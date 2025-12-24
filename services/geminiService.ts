
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
 * Searches for a translation and multiple representative web image URLs for any given text.
 */
export const searchAndTranslate = async (query: string): Promise<{ english: string, thai: string, imageUrls: string[] }> => {
  try {
    const ai = getAi();
    
    const prompt = `Task: Translate the user's query "${query}" between Thai and English. 
    Then, using the English translation, find exactly 5 direct, high-quality, publicly accessible web image URLs (must end in .jpg, .png, or .webp) that best represent this word.
    Avoid URLs from Pinterest or restricted sites. Use reliable sources like Wikimedia, Unsplash, or Pixabay if possible.
    
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
        tools: [{ googleSearch: {} }],
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
    
    // Validate URLs (ensure they look like URLs)
    const validUrls = parsed.imageUrls.filter((url: string) => url.startsWith('http'));
    
    // If fewer than 3 valid URLs, add fallback placeholders based on the English word
    const finalUrls = [...validUrls];
    const englishWord = parsed.english;
    while (finalUrls.length < 5) {
      finalUrls.push(`https://images.unsplash.com/photo-1?auto=format&fit=crop&w=800&q=80&sig=${finalUrls.length}&keyword=${encodeURIComponent(englishWord)}`);
    }

    return { ...parsed, imageUrls: finalUrls };
  } catch (error) {
    console.error("Search/Translate Error:", error);
    // Ultimate Fallback: Use a direct Unsplash search parameter
    return { 
      english: query, 
      thai: query, 
      imageUrls: [
        `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80&query=${encodeURIComponent(query)}&1`,
        `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80&query=${encodeURIComponent(query)}&2`,
        `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80&query=${encodeURIComponent(query)}&3`
      ] 
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
