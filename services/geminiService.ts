import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectedObject, SentenceExamples, QuizQuestion, PronunciationResult } from "../types";

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    // If API_KEY is missing, use a placeholder to prevent immediate crash,
    // the API call will simply fail later with a clear error.
    const apiKey = process.env.API_KEY || "MISSING_API_KEY";
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const modelName = "gemini-2.5-flash";

export const identifyObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  try {
    const ai = getAiClient();
    
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
    const ai = getAiClient();
    
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

export const generateGrammarQuiz = async (word: string, difficulty: string): Promise<QuizQuestion> => {
    try {
        const ai = getAiClient();
        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING, description: "The sentence with a blank or error" },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 possible answers" },
                correctIndex: { type: Type.NUMBER, description: "Index of the correct answer (0-3)" },
                explanation: { type: Type.STRING, description: "Explanation why the answer is correct" },
                type: { type: Type.STRING, enum: ['grammar_error', 'fill_blank'] }
            },
            required: ["question", "options", "correctIndex", "explanation", "type"]
        };

        const prompt = `Create a multiple-choice grammar quiz question using the word "${word}". 
        The difficulty level is ${difficulty}.
        Focus specifically on English grammar rules relevant to this level (e.g. tenses, prepositions, articles, sentence structure).
        It can be either a "Fill in the blank" style or "Spot the error" style.
        Provide 4 options and a clear explanation in Thai/English mixed.`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as QuizQuestion;

    } catch (error) {
        console.error("Error generating quiz", error);
        throw error;
    }
};

export const generateBatchGrammarQuiz = async (words: string[], difficulty: string): Promise<QuizQuestion[]> => {
    try {
        const ai = getAiClient();
        const responseSchema: Schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The sentence with a blank or error" },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 possible answers" },
                    correctIndex: { type: Type.NUMBER, description: "Index of the correct answer (0-3)" },
                    explanation: { type: Type.STRING, description: "Explanation why the answer is correct" },
                    type: { type: Type.STRING, enum: ['grammar_error', 'fill_blank'] }
                },
                required: ["question", "options", "correctIndex", "explanation", "type"]
            }
        };

        const prompt = `Create ${words.length} multiple-choice grammar quiz questions.
        Generate exactly one question for each of these words: ${words.join(', ')}.
        The difficulty level is ${difficulty}.
        Focus specifically on English grammar rules relevant to this level (e.g. tenses, prepositions, articles, sentence structure).
        Mix "Fill in the blank" and "Spot the error" styles.
        Provide 4 options and a clear explanation in Thai/English mixed for each.`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as QuizQuestion[];

    } catch (error) {
        console.error("Error generating batch quiz", error);
        throw error;
    }
};

export const analyzePronunciation = async (audioBase64: string, targetSentence: string): Promise<PronunciationResult> => {
    try {
        const ai = getAiClient();
        const responseSchema: Schema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "Score from 0 to 100. Return 0 if no clear speech is detected." },
                accent: { type: Type.STRING, description: "Identified accent style, or 'Unknown' if no speech." },
                feedback: { type: Type.STRING, description: "Constructive feedback on pronunciation." },
                phonemes: { type: Type.STRING, description: "Simple phonetic representation of what was heard." }
            },
            required: ["score", "accent", "feedback", "phonemes"]
        };

        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "audio/webm", // Browser media recorder usually outputs webm/mp4
                            data: audioBase64
                        }
                    },
                    {
                        text: `The user is trying to say: "${targetSentence}". 
                        
                        STRICT INSTRUCTIONS:
                        1. **Check for Speech**: First, listen if there is actual speech matching the target sentence. If the audio is silent, just background noise, or too short/unintelligible, return a score of 0 and feedback like "ไม่ได้รับเสียงพูด หรือเสียงเบาเกินไป กรุณาลองใหม่อีกครั้ง".
                        2. **Rate Accuracy**: Only if speech is present, rate the pronunciation accuracy (0-100). Be strict. 
                        3. **Identify Accent**: Identify the accent style (e.g. American, British, Strong Thai Accent, etc.).
                        4. **Feedback**: Give specific feedback on which words or sounds were unclear.
                        5. **Phonetics**: Provide a phonetic breakdown of what you *actually* heard.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text) as PronunciationResult;

    } catch (error) {
        console.error("Error analyzing audio", error);
        throw error;
    }
};