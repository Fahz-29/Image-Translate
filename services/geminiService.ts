
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult, WordAssociations } from "../types";

const VISION_MODEL = 'gemini-3-flash-preview'; 
const TEXT_MODEL = 'gemini-3-flash-preview';
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

// FIX: Always use direct process.env.API_KEY initialization as per SDK guidelines
const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Searches for a translation and multiple representative web image URLs for any given text.
 */
export const searchAndTranslate = async (query: string): Promise<{ english: string, thai: string, imageUrls: string[] }> => {
  const ai = getAi();
  
  // FIX: Guideline states response.text may not be JSON when using googleSearch.
  // We remove googleSearch tool here to ensure JSON parsing succeeds, as translations 
  // and image URL retrieval by prompt are primarily generative tasks.
  const prompt = `Task: Translate the user's query "${query}" between Thai and English. 
  Then, find exactly 5 high-quality, publicly accessible web image URLs that best represent this word.
  
  Return ONLY JSON format: 
  {
    "english": "English word",
    "thai": "คำแปลภาษาไทย",
    "imageUrls": ["https://url1.jpg", "https://url2.jpg", "https://url3.jpg", "https://url4.jpg", "https://url5.jpg"]
  }`;

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
          imageUrls: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            minItems: 3,
            maxItems: 5
          }
        },
        required: ["english", "thai", "imageUrls"]
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI_NO_RESPONSE");
  const parsed = JSON.parse(text);
  
  const validUrls = parsed.imageUrls.filter((url: string) => url.startsWith('http'));
  const finalUrls = [...validUrls];
  const englishWord = parsed.english;
  while (finalUrls.length < 5) {
    finalUrls.push(`https://images.unsplash.com/photo-1?auto=format&fit=crop&w=800&q=80&sig=${finalUrls.length}&keyword=${encodeURIComponent(englishWord)}`);
  }

  return { ...parsed, imageUrls: finalUrls };
};

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
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
};

/**
 * Generates CONVERSATIONAL example sentences.
 */
export const generateSentences = async (englishName: string, thaiName: string): Promise<SentenceExamples> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Create 3 short CONVERSATIONAL (dialogue style) English sentences for "${englishName}" (${thaiName}). 
    One should be casual, one formal, and one a question/answer pair. 
    Return JSON: {"scenario1": {"en": "...", "th": "..."}, "scenario2": {"en": "...", "th": "..."}, "scenario3": {"en": "...", "th": "..."}}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenario1: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
          scenario2: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
          scenario3: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, th: { type: Type.STRING } }, required: ["en", "th"] },
        },
        required: ["scenario1", "scenario2", "scenario3"],
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
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            relatedWords: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.STRING },
                        thai: { type: Type.STRING },
                        type: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ["english", "thai", "type", "definition"]
                }
            },
            associatedVerbs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.STRING },
                        thai: { type: Type.STRING },
                        type: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ["english", "thai", "type", "definition"]
                }
            }
        },
        required: ["relatedWords", "associatedVerbs"]
      }
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create quizzes for: ${words.join(', ')}. Difficulty: ${difficulty}.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation", "type"]
            }
          }
        },
    });
    return JSON.parse(response.text || "[]");
};

export const analyzePronunciation = async (audioBase64: string, targetSentence: string): Promise<PronunciationResult> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: [
            { parts: [{ inlineData: { mimeType: "audio/webm", data: audioBase64 } }, { text: `Rate pronunciation of: "${targetSentence}" against the provided audio. Provide score (0-100), accent, feedback, and phonemes.` }] }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              accent: { type: Type.STRING },
              feedback: { type: Type.STRING },
              phonemes: { type: Type.STRING }
            },
            required: ["score", "accent", "feedback", "phonemes"]
          }
        },
    });
    return JSON.parse(response.text || "{}");
};
