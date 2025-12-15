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

export enum AppState {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  SENTENCES_LOADING = 'SENTENCES_LOADING',
  SENTENCES_VIEW = 'SENTENCES_VIEW'
}

export enum Tab {
  HOME = 'HOME',
  SAVED = 'SAVED',
  FLASHCARDS = 'FLASHCARDS'
}