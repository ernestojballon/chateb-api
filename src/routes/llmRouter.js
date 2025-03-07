// server.js or routes/chat.js
import express from "express";
import axios from "axios";
import Chat from "../db/models/chat.js";
import model from "../lib/gemini.js";

const router = express.Router();


// Streaming endpoint for chat messages
router.post("/chat-message/:chatId", async (req, res) => {
  const userId = req.auth.userId;
  const chatId = req.params.chatId;
  if(!userId) return res.status(401).json({error: "Unauthorized"});
  if(!chatId) return res.status(400).json({error: "Chat ID is required"});
  const { text , attachments} = req.body;

  try {
    // Get the chat to check ownership and get history
    const chat = await Chat.findOne({ _id: chatId, userId });
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found",chat,chatId,userId });
    }

    const attachmentsData = await Promise.all (attachments.map(async (attachment) => {
      const imageData = await axios.get(process.env.IMAGE_KIT_ENDPOINT + attachment.filePath, {
        responseType: 'arraybuffer'
      }).then(response => Buffer.from(response.data, 'binary').toString('base64')).catch(err => {
        console.error("Error fetching image:", err);
        return null;
      }
      );
      return {
        inlineData: {
          data: imageData,
          mimeType: 'image/png',
        },
      };
    }))
    
    
    // Format chat history
    const formattedHistory = chat.history.map(({ role, parts }) => ({
      role: role,
      parts: [{ text: parts[0].text }],
    }));

    // Create chat session
    const chatSession = model.startChat({
      history: formattedHistory,
    });

    // Send message
    const messageParts = attachmentsData.length ? [...attachmentsData,text] : [text];
    const result = await chatSession.sendMessageStream(messageParts);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // write accumulate text to the response stream
      res.write(`data: ${JSON.stringify({ response: chunkText })}\n\n`);
      
    }
    const response = await result.response;
    // Update database
  
    await Chat.updateOne(
      { _id: chatId, userId },
      {
        $push: {
          history: [
            { 
              role: "user", 
              parts: [{ text }],
              
              ...(attachmentsData.length && { attachments: attachments.map(attachment =>( {filePath:attachment.filePath})),
               }) 
            },
            { 
              role: "model", 
              parts: [{ text: response.text() }] 
            }
          ]
        }
      }
    );
    res.end();
  } catch (error) {
    console.error("Error in Gemini:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;