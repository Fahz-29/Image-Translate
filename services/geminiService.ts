
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult, WordAssociations } from "../types";

const VISION_MODEL = 'gemini-3-flash-preview'; 
const TEXT_MODEL = 'gemini-3-flash-preview';
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * แปลภาษาแบบด่วนที่สุด (ใช้สำหรับแสดงผลทันที)
 * ปิดการ 'คิด' (thinkingBudget: 0) เพื่อให้ AI ตอบทันที
 */
export const translateQuick = async (query: string): Promise<{ english: string, thai: string }> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Translate "${query}" between Thai and English. Return JSON: {english, thai}`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 } // ลด Latency สูงสุด
    },
  });
  return JSON.parse(response.text || "{}");
};

/**
 * ดึงเฉพาะรูปภาพที่เกี่ยวข้อง
 */
export const getRelatedImage = async (query: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Provide one high-quality Unsplash image keyword for "${query}". Return JSON: {keyword}`,
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
    const keyword = JSON.parse(response.text || '{"keyword": "object"}').keyword;
    return `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80&keyword=${encodeURIComponent(keyword)}`;
};

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Identify objects. Return JSON: {objects: [{thai, english, box_2d, confidence}]}" },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 } // ปิดการคิดวิเคราะห์ซับซ้อนเพื่อความเร็ว
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
    config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateRelatedVocabulary = async (word: string): Promise<WordAssociations> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `5 related words and 3 verbs for "${word}". JSON: {relatedWords: [{english, thai, type, definition}], associatedVerbs: [...]}`,
    config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Quizzes for: ${words.join(', ')}. Difficulty: ${difficulty}.`,
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
        },
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
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
        },
    });
    return JSON.parse(response.text || "{}");
};

// Deprecated in favor of faster separate calls
export const getFullWordData = async (query: string) => {
    return translateQuick(query);
};
