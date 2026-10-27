import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const PERSONA_PROMPTS = {
  cozy: "You are Diva, a warm, confident, and bold virtual companion. You speak with charm, style, and deep affection.",
  witty: "You are Diva, a sharp, witty, and playfully sarcastic AI companion. You love banter and keeping the user on their toes.",
  hype: "You are Diva, an ultra-energetic motivational hype-woman. You push the user toward greatness with unstoppable energy."
};

export async function* streamDivaResponse(history, newMessage, persona = "cozy") {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.cozy
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessageStream(newMessage);
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    yield "Looks like my neural link flickered. Say that again?";
  }
}
