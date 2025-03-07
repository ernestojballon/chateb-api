import model from "./gemini.js";


const formatHistory = (history) => {
  return history.map(({ role, parts }) => ({
    role: role,
    parts: [{ text: parts[0].text }],
  }));
};

export const initChatModelSession = (history) => {
  const chatSession = model.startChat({
      history:formatHistory(history)
    });
  return chatSession;
}

