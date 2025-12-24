
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult, WordAssociations } from "../types";

const VISION_MODEL = 'gemini-3-flash-preview'; 
const TEXT_MODEL = 'gemini-3-flash-preview';
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

const getAi = () => {
  const key = process.env.API_KEY || "";
  if (!key || key === "MISSING_API_KEY" || key.length < 10) {
    throw new Error("API_KEY_MISSING: โปรดตั้งค่า API_KEY ใน Vercel Settings");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Searches for a translation and a representative web image URL for any given text.
 */
export const searchAndTranslate = async (query: string): Promise<{ english: string, thai: string, imageUrl: string }> => {
  try {
    const ai = getAi();
    
    const prompt = `Translate "${query}" between Thai and English. Also, find a direct high-quality web image URL (JPG/PNG) that represents this object/concept. 
    Return as JSON: {"english": "...", "thai": "...", "imageUrl": "..."}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            thai: { type: Type.STRING },
            imageUrl: { type: Type.STRING, description: "A valid URL to a representative image from the web" }
          },
          required: ["english", "thai", "imageUrl"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI_NO_RESPONSE");
    return JSON.parse(text);
  } catch (error) {
    console.error("Search/Translate Error:", error);
    // Fallback if search fails or URL is blocked
    return { 
      english: query, 
      thai: query, 
      imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(query)}` 
    };
  }
};

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  try {
    const ai = getAi();
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        objects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              thai: { type: Type.STRING },
              english: { type: Type.STRING },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
              },
              confidence: { type: Type.NUMBER },
            },
            required: ["thai", "english", "box_2d", "confidence"],
          },
        }
      },
      required: ["objects"],
    };

    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Identify up to 5 main objects in this image. Return only JSON with thai, english, box_2d, and confidence." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI_NO_RESPONSE");
    const json = JSON.parse(text);
    return json.objects as DetectedObject[];
  } catch (error: any) {
    throw new Error(error.message || "Failed to identify objects");
  }
};

export const generateSentences = async (englishName: string, thaiName: string): Promise<SentenceExamples> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Create simple sentences for "${englishName}" (${thaiName}) in past, present, and future. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          past: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
          present: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
          future: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
        },
        required: ["past", "present", "future"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateRelatedVocabulary = async (word: string): Promise<WordAssociations> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Generate 5 related words and 3 verbs for "${word}" with Thai translations.`,
    config: {
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateGrammarQuiz = async (word: string, difficulty: string): Promise<QuizQuestion> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a ${difficulty} quiz for "${word}".`,
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create quizzes for: ${words.join(', ')}. Difficulty: ${difficulty}.`,
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
};

export const analyzePronunciation = async (audioBase64: string, targetSentence: string): Promise<PronunciationResult> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: [
            { parts: [{ inlineData: { mimeType: "audio/webm", data: audioBase64 } }, { text: `Rate: "${targetSentence}"` }] }
        ],
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
};
