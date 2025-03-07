
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
export const updateChatName = async (chatId,userId,newtitle) => {
  try{
    await Chat.updateOne(
        { _id:
          chatId, userId },
        {
          $set: {
            title:newtitle,
          }
        }
      );
  }catch(error){
    console.error("Error updating chat:", error);
    return false
  }
  return true
}


