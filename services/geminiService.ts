
import { GoogleGenAI } from "@google/genai";

// Initialize API Client
// NOTE: In a real production app, these calls would likely go through a backend proxy 
// to protect the key, or use the user's key as per the instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGameAnalysis = async (score: number, maxCombo: number, accuracy: number): Promise<string> => {
  try {
    const prompt = `
      You are a futuristic AI Combat Systems Coach in a cyberpunk universe. 
      A pilot (the user) just finished a synchronization simulation (rhythm game) called "DJBIG".
      
      Here are their stats:
      - Score: ${score}
      - Max Combo Link: ${maxCombo}
      - Synchronization Integrity (Health/Accuracy): ${accuracy}%
      
      Provide a short, 2-sentence tactical assessment of their performance. 
      Use sci-fi terminology (e.g., "neural link", "latency", "apm", "system overload").
      
      If score is high (>5000), praise them as an elite unit.
      If score is low, tell them to recalibrate their sensors.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "SYSTEM OFFLINE. UNABLE TO GENERATE ANALYSIS.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "COMMUNICATION ERROR. TACTICAL ANALYSIS UNAVAILABLE.";
  }
};