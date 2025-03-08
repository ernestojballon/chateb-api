// server.js or routes/chat.js
import express from "express";
import axios from "axios";
import { getChat, pushToChatHistory, updateChatName } from "../db/chatdb.js";
import { initChatModelSession } from "../llm/chatLlm.js";

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
    const chat = await getChat(chatId,userId);

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
    
    // Create chat session
    const chatSession = initChatModelSession(chat.history);

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
    await pushToChatHistory(chatId,userId,[
      { 
        role: "user", 
        parts: [{ text }],
        ...(attachmentsData.length && { attachments: attachments.map(attachment =>( {filePath:attachment.filePath})),}) 
      },
      { 
        role: "model", 
        parts: [{ text: response.text() }] 
      }
    ]);
    
    res.end();
  } catch (error) {
    console.error("Error in Gemini:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

router.put("/rename-chat/:chatId", async (req, res) => {
  const userId = req.auth.userId;
  const chatId = req.params.chatId;
  if(!userId) return res.status(401).json({error: "Unauthorized"});
  if(!chatId) return res.status(400).json({error: "Chat ID is required"});
  

  try {
    const chat = await getChat(chatId,userId);
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
  // generate new title using llm and chat history
  const chatSession = initChatModelSession(chat.history);
  if (chat.history.length>2 ){
    //don not update
     return res.status(200).json({ message: "no need to rename chat" });
  }
  const result = await chatSession.sendMessage([
    `suggest a name for this chat , respond just with 
    the chat name, choose a meaningful, usefull to recognized 
    this chat easy from the name between 4 to 6 words, hihgly 
    related to the message topic and very specific about the 
    question and answer provided, all chat are AI so that wont 
    be an identifier, suggest names like : - "binary search ", 
    "javascript ninary search in js", "find the issue in the code"
    `]);

    const newtitle = await result.response.text();
  
    await updateChatName(chatId,userId,newtitle);

    res.status(200).json({ message: "Chat renamed successfully" });
  } catch (error) {
    console.error("Error renaming chat:", error);
    res.status(500).json({ error: "Error renaming chat" });
  }
});

export default router;