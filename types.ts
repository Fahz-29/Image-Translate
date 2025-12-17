export interface DetectedObject {
  thai: string;
  english: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax]
  confidence: number; // 0 to 1
}

export interface SentencePair {
  en: string;
  th: string;
}

export interface SentenceExamples {
  past: SentencePair;
  present: SentencePair;
  future: SentencePair;
}

export interface RelatedWord {
  english: string;
  thai: string;
  type: string; // e.g., "Synonym", "Verb", "Type of"
  definition: string; // Short explanation in Thai
}

export interface WordAssociations {
  relatedWords: RelatedWord[]; // Synonyms, types, nouns
  associatedVerbs: RelatedWord[]; // Verbs specifically used with the object
}

export interface SavedWord {
  id: string;
  thai: string;
  english: string;
  sentences?: SentenceExamples;
  timestamp: number;
}

export interface Deck {
  id: string;
  name: string;
  wordIds: string[];
  createdAt: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  type: 'grammar_error' | 'fill_blank';
}

export interface PronunciationResult {
  score: number; // 0-100
  accent: string; // e.g., "British", "American", "Thai-English"
  feedback: string;
  phonemes: string; // IPA or simple phonetic breakdown
}

export enum AppState {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  SENTENCES_LOADING = 'SENTENCES_LOADING',
  SENTENCES_VIEW = 'SENTENCES_VIEW',
  RELATED_LOADING = 'RELATED_LOADING',
  RELATED_VIEW = 'RELATED_VIEW'
}

export enum Tab {
  HOME = 'HOME',
  SAVED = 'SAVED',
  FLASHCARDS = 'FLASHCARDS',
  PRACTICE = 'PRACTICE'
}