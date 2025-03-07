
import UserChats from "./models/userChats.js";
import Chat from "./models/chat.js";

export const getChat = async (chatId,userId) => {
  const chat = await Chat.findOne({ _id: chatId, userId });
    
  return chat
}
export const pushToChatHistory = async (chatId,userId,toAddhistory) => {
  try{
    await Chat.updateOne(
        { _id:
          chatId, userId },
        {
          $push: {
            history: toAddhistory
            
          }
        }
      );
  }catch(error){
    console.error("Error updating chat:", error);
    return false
  }
  return true
}
export const updateChatName = async (chatId, userId, newTitle) => {
  try {
    // Find and update the specific chat within the array
    const result = await UserChats.findOneAndUpdate(
      { userId, "chats._id": chatId }, //Query to find the chat
      { $set: { "chats.$.title": newTitle } }, // Update operator for array element
      { new: true } // Return the updated document
    );

    if (!result) {
      return false;
    }
    return true;

  } catch (error) {
    console.error("Error updating chat:", error);
    return false;
  }
};


