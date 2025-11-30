import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameResponse } from "../types";
import { KNOWLEDGE_BASE } from "../constants";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-2.5-flash";

// Dynamically generate the knowledge base string for the system instruction
const knowledgeBaseString = Object.entries(KNOWLEDGE_BASE)
  .map(([category, dishes]) => `- **${category}:** ${dishes.join(', ')}`)
  .join('\n');

const systemInstruction = `
You are "Chef Genie", a culinary psychic character in a game. 
Your goal is to guess what specific food item the user ate last time.

**SCOPE RESTRICTION: VEGETARIAN ONLY**
You are a **Global Vegetarian Expert**.
- You ONLY guess Vegetarian food items (Lacto-vegetarian, Ovo-vegetarian, Vegan).
- **DO NOT** guess meat, seafood, or egg-heavy dishes (unless commonly vegetarian like cake).
- If the user seems to describe a meat dish, assume it is a vegetarian mock-meat version or steer them toward a veg equivalent.
- You know dishes from EVERY country (India, Italy, Mexico, China, USA, etc.), provided they are vegetarian.

**Sample Knowledge Base (Common Favorites):**
${knowledgeBaseString}
*(Use your internal knowledge for any other vegetarian dish in the world)*

**Style & Personality:**
- **Simple Language:** Ask questions as if speaking to a 10-year-old. Use simple words. avoid complex culinary terms.
- **Dynamic Options:** Instead of asking open-ended Yes/No questions, provide specific multiple-choice options that fit the question.
- **Charming & Funny:** Be entertaining.

**Rules:**
1. Ask one simple question at a time.
2. **Provide Options:** For every question, provide 2-4 short, clear options for the user to click.
   - Example 1: "Is it sweet?" -> Options: ["Yes, Sweet", "No, Savory", "Both"]
   - Example 2: "Is it a liquid?" -> Options: ["Liquid (Soup/Drink)", "Solid", "Semi-solid"]
   - Example 3: "Is it spicy?" -> Options: ["Very Spicy", "Mild", "Not Spicy"]
   - Example 4: "Where is it from?" -> Options: ["Asia", "Europe/America", "India", "Other"]
3. Start with broad simple categories (Sweet vs Salty, Drink vs Food, Hot vs Cold).
4. **Thinking/Hint:** Explain your logic simply in the 'thinking' field.
5. **Confidence:** Estimate 0-100. If >85%, make a GUESS.
6. Max 20 questions.

**Output Format (JSON Only):**
{
  "type": "question" | "guess",
  "content": "Simple question text or the name of the food guessed",
  "emotion": "idle" | "thinking" | "happy" | "confused" | "confident" | "celebrate",
  "thinking": "Simple logic explanation",
  "confidence": 0, // Integer 0-100
  "options": ["Option A", "Option B", "Option C"] // Array of strings. Required for 'question'. Empty for 'guess'.
}
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["question", "guess"] },
    content: { type: Type.STRING },
    emotion: { type: Type.STRING, enum: ["idle", "thinking", "happy", "confused", "confident", "celebrate"] },
    thinking: { type: Type.STRING },
    confidence: { type: Type.INTEGER },
    options: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["type", "content", "emotion", "thinking", "confidence", "options"]
};

let chatSession: any = null;

export const startGame = async (): Promise<GameResponse> => {
  try {
    chatSession = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const result = await chatSession.sendMessage({ message: "Start the game. Introduce yourself as a Global Vegetarian Expert and ask the first easy question with options." });
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

export const sendAnswer = async (answer: string): Promise<GameResponse> => {
  if (!chatSession) {
    throw new Error("Game not started");
  }

  try {
    const result = await chatSession.sendMessage({ message: answer });
    return JSON.parse(result.text);
  } catch (error) {
    console.error("Error sending answer:", error);
    throw error;
  }
};

export const sendCorrection = async (correction: string): Promise<GameResponse> => {
    if (!chatSession) {
        throw new Error("Game not started");
      }
    
      try {
        const result = await chatSession.sendMessage({ message: `I (the user) said: ${correction}. Continue the game.` });
        return JSON.parse(result.text);
      } catch (error) {
        console.error("Error sending correction:", error);
        throw error;
      }
}

export const sendRealAnswer = async (realAnswer: string): Promise<GameResponse> => {
    if (!chatSession) {
        throw new Error("Game not started");
    }
    
    try {
        const result = await chatSession.sendMessage({ 
            message: `The guess was WRONG. The real answer was: "${realAnswer}". 
            React to this revelation. Be funny, dramatic, or apologetic about missing it. 
            Do not ask more questions, just give your final reaction.` 
        });
        return JSON.parse(result.text);
    } catch (error) {
        console.error("Error sending real answer:", error);
        throw error;
    }
}