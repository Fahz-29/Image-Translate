import { SavedWord, SentenceExamples, Deck } from '../types';

const STORAGE_KEY = 'thaisnap_vocabulary';
const DECKS_KEY = 'thaisnap_decks';

// --- WORDS ---

export const getSavedWords = (): SavedWord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load words", e);
    return [];
  }
};

export const saveWord = (english: string, thai: string, sentences?: SentenceExamples): SavedWord => {
  const words = getSavedWords();
  
  // Check if already exists (update if so)
  const existingIndex = words.findIndex(w => w.english.toLowerCase() === english.toLowerCase());
  
  let newWord: SavedWord;

  if (existingIndex >= 0) {
    // Update existing
    newWord = {
      ...words[existingIndex],
      sentences: sentences || words[existingIndex].sentences, 
      timestamp: Date.now()
    };
    words[existingIndex] = newWord;
  } else {
    // Create new
    newWord = {
      id: crypto.randomUUID(),
      english,
      thai,
      sentences,
      timestamp: Date.now()
    };
    words.unshift(newWord); // Add to top
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  return newWord;
};

export const removeWord = (id: string): SavedWord[] => {
  const words = getSavedWords().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  
  // Also remove from decks
  const decks = getDecks();
  const updatedDecks = decks.map(deck => ({
    ...deck,
    wordIds: deck.wordIds.filter(wordId => wordId !== id)
  }));
  localStorage.setItem(DECKS_KEY, JSON.stringify(updatedDecks));

  return words;
};

export const isWordSaved = (english: string): boolean => {
  const words = getSavedWords();
  return words.some(w => w.english.toLowerCase() === english.toLowerCase());
};

// --- DECKS ---

export const getDecks = (): Deck[] => {
  try {
    const data = localStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load decks", e);
    return [];
  }
};

export const saveDeck = (name: string, wordIds: string[]): Deck => {
  const decks = getDecks();
  const newDeck: Deck = {
    id: crypto.randomUUID(),
    name,
    wordIds,
    createdAt: Date.now()
  };
  decks.unshift(newDeck);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  return newDeck;
};

export const updateDeck = (id: string, name: string, wordIds: string[]): Deck[] => {
  const decks = getDecks();
  const index = decks.findIndex(d => d.id === id);
  if (index !== -1) {
    decks[index] = { ...decks[index], name, wordIds };
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }
  return decks;
};

export const deleteDeck = (id: string): Deck[] => {
  const decks = getDecks().filter(d => d.id !== id);
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  return decks;
};