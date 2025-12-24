
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult, WordAssociations } from "../types";

const VISION_MODEL = 'gemini-3-flash-preview'; 
const TEXT_MODEL = 'gemini-3-flash-preview';
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * รวบรวมข้อมูลทั้งหมดในครั้งเดียว (Translation + Sentences + Related Words)
 * วิธีนี้จะเร็วกว่าการแยกเรียก 3 ครั้งมาก
 */
export const getFullWordData = async (query: string): Promise<{ 
  english: string, 
  thai: string, 
  imageUrls: string[],
  sentences: SentenceExamples,
  associations: WordAssociations
}> => {
  const ai = getAi();
  
  const prompt = `Task: Act as an expert linguist. For the word/query "${query}":
  1. Translate it between Thai and English.
  2. Create 3 conversational sentence pairs (Casual, Formal, Q&A).
  3. Provide 5 related words and 3 associated verbs with definitions.
  4. Find 1 high-quality web image URL for this object.

  Return ONLY JSON.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          english: { type: Type.STRING },
          thai: { type: Type.STRING },
          imageUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentences: {
            type: Type.OBJECT,
            properties: {
              scenario1: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
              scenario2: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
              scenario3: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
            },
            required: ["scenario1", "scenario2", "scenario3"]
          },
          associations: {
            type: Type.OBJECT,
            properties: {
              relatedWords: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, thai: { type: Type.STRING }, type: { type: Type.STRING }, definition: { type: Type.STRING } } } },
              associatedVerbs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, thai: { type: Type.STRING }, type: { type: Type.STRING }, definition: { type: Type.STRING } } } }
            },
            required: ["relatedWords", "associatedVerbs"]
          }
        },
        required: ["english", "thai", "imageUrls", "sentences", "associations"]
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI_NO_RESPONSE");
  const parsed = JSON.parse(text);
  
  // Fallback for image
  if (!parsed.imageUrls || parsed.imageUrls.length === 0) {
    parsed.imageUrls = [`https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80&keyword=${encodeURIComponent(parsed.english)}`];
  }

  return parsed;
};

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  const ai = getAi();
  
  const response = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Identify up to 5 objects. Return JSON: {objects: [{thai, english, box_2d, confidence}]}" },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                thai: { type: Type.STRING },
                english: { type: Type.STRING },
                box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                confidence: { type: Type.NUMBER },
              },
              required: ["thai", "english", "box_2d", "confidence"],
            },
          }
        },
        required: ["objects"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI_NO_RESPONSE");
  const json = JSON.parse(text);
  return json.objects as DetectedObject[];
};

export const generateSentences = async (englishName: string, thaiName: string): Promise<SentenceExamples> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Create 3 conversation pairs for "${englishName}" (${thaiName}). JSON: {scenario1: {en, th}, scenario2: {en, th}, scenario3: {en, th}}`,
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || "{}");
};

export const generateRelatedVocabulary = async (word: string): Promise<WordAssociations> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `5 related words and 3 verbs for "${word}". JSON: {relatedWords: [{english, thai, type, definition}], associatedVerbs: [...]}`,
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || "{}");
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Quizzes for: ${words.join(', ')}. Difficulty: ${difficulty}.`,
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "[]");
};

export const analyzePronunciation = async (audioBase64: string, targetSentence: string): Promise<PronunciationResult> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: [
            { parts: [{ inlineData: { mimeType: "audio/webm", data: audioBase64 } }, { text: `Rate pronunciation: "${targetSentence}"` }] }
        ],
        config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
};
