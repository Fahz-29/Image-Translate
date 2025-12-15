import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectedObject, SentenceExamples } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        objects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              thai: { type: Type.STRING, description: "Name of the object in Thai" },
              english: { type: Type.STRING, description: "Name of the object in English" },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Bounding box of the object in [ymin, xmin, ymax, xmax] format (normalized 0-1).",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence score between 0.0 and 1.0 representing how certain the model is about this detection.",
              },
            },
            required: ["thai", "english", "box_2d", "confidence"],
          },
          description: "List of identified objects found in the image with their bounding boxes and confidence scores.",
        }
      },
      required: ["objects"],
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Identify up to 5 distinct main objects in this image. Return their names in Thai/English, bounding boxes, and confidence scores.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const json = JSON.parse(text);
    return json.objects as DetectedObject[];

  } catch (error) {
    console.error("Error identifying objects:", error);
    throw error;
  }
};

export const generateSentences = async (englishName: string, thaiName: string): Promise<SentenceExamples> => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        past: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            th: { type: Type.STRING },
          },
          required: ["en", "th"],
        },
        present: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            th: { type: Type.STRING },
          },
          required: ["en", "th"],
        },
        future: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            th: { type: Type.STRING },
          },
          required: ["en", "th"],
        },
      },
      required: ["past", "present", "future"],
    };

    const prompt = `
      Create 3 example sentences for the object "${englishName}" (${thaiName}).
      1. Past tense.
      2. Present tense.
      3. Future tense.
      Provide both English and Thai translations for each sentence.
      Keep sentences simple and educational.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as SentenceExamples;

  } catch (error) {
    console.error("Error generating sentences:", error);
    throw error;
  }
};