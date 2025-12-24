
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult, WordAssociations } from "../types";

// gemini-3-flash-preview is the recommended model for both text and vision (image analysis)
const VISION_MODEL = 'gemini-3-flash-preview'; 
const TEXT_MODEL = 'gemini-3-flash-preview';
const AUDIO_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

const getAi = () => {
  const key = process.env.API_KEY || "";
  if (!key || key === "MISSING_API_KEY" || key.length < 10) {
    throw new Error("API_KEY_MISSING: โปรดตั้งค่า API_KEY ใน Vercel Settings > Environment Variables");
  }
  return new GoogleGenAI({ apiKey: key });
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
              thai: { type: Type.STRING, description: "Name of the object in Thai" },
              english: { type: Type.STRING, description: "Name of the object in English" },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Bounding box [ymin, xmin, ymax, xmax]",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence score 0.0 to 1.0",
              },
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
            {
              inlineData: {
                mimeType: "image/jpeg", // Standard for base64 captured from canvas
                data: base64Image,
              },
            },
            {
              text: "Identify up to 5 main objects in this image for an English learning app. Return only JSON with thai, english, box_2d, and confidence.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI_NO_RESPONSE: Gemini ไม่ตอบกลับข้อมูล");
    
    const json = JSON.parse(text);
    return json.objects as DetectedObject[];

  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    // Throw a more descriptive error to be caught by the UI
    throw new Error(error.message || "Failed to identify objects");
  }
};

export const generateSentences = async (englishName: string, thaiName: string): Promise<SentenceExamples> => {
  try {
    const ai = getAi();
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        past: {
          type: Type.OBJECT,
          properties: { en: { type: Type.STRING }, th: { type: Type.STRING } },
          required: ["en", "th"],
        },
        present: {
          type: Type.OBJECT,
          properties: { en: { type: Type.STRING }, th: { type: Type.STRING } },
          required: ["en", "th"],
        },
        future: {
          type: Type.OBJECT,
          properties: { en: { type: Type.STRING }, th: { type: Type.STRING } },
          required: ["en", "th"],
        },
      },
      required: ["past", "present", "future"],
    };

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Create simple educational sentences for "${englishName}" (${thaiName}) in past, present, and future tenses. Return JSON with translations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw error;
  }
};

export const generateRelatedVocabulary = async (word: string): Promise<WordAssociations> => {
    try {
        const ai = getAi();
        const responseSchema = {
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
        };

        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: `Generate 5 related words and 3 associated verbs for "${word}" with Thai translations.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        return JSON.parse(response.text || "{}");
    } catch (error) {
        throw error;
    }
};

export const generateGrammarQuiz = async (word: string, difficulty: string): Promise<QuizQuestion> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create a ${difficulty} grammar quiz for "${word}". Return JSON with question, options, correctIndex, explanation, and type.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.NUMBER },
                    explanation: { type: Type.STRING },
                    type: { type: Type.STRING }
                },
                required: ["question", "options", "correctIndex", "explanation", "type"]
            },
        },
    });
    return JSON.parse(response.text || "{}");
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Create ${words.length} grammar quizzes for: ${words.join(', ')}. Difficulty: ${difficulty}. Return array of JSON objects.`,
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
            },
        },
    });
    return JSON.parse(response.text || "[]");
};

export const analyzePronunciation = async (audioBase64: string, targetSentence: string): Promise<PronunciationResult> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: [
            {
                parts: [
                    { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
                    { text: `Rate this pronunciation of: "${targetSentence}"` }
                ]
            }
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
            },
        },
    });
    return JSON.parse(response.text || "{}");
};
