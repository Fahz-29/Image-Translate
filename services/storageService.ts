import { SavedWord, SentenceExamples, Deck, PronunciationResult } from '../types';
import { supabase } from './supabaseClient';

// --- WORDS ---

export const getSavedWords = async (): Promise<SavedWord[]> => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) {
    console.error("Failed to fetch words", error);
    return [];
  }
  return data.map(w => ({
      ...w,
      timestamp: new Date(w.timestamp).getTime()
  }));
};

export const saveWord = async (english: string, thai: string, sentences?: SentenceExamples, associations?: any): Promise<SavedWord | null> => {
  const { data: existing } = await supabase
    .from('words')
    .select('*')
    .eq('english', english)
    .single();

  const payload = {
    english,
    thai,
    sentences: sentences || (existing ? existing.sentences : null),
    associations: associations || (existing ? existing.associations : null),
    timestamp: new Date().toISOString()
  };

  if (existing) {
    const { data, error } = await supabase
      .from('words')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return null;
    return data;
  } else {
    const { data, error } = await supabase
      .from('words')
      .insert([payload])
      .select()
      .single();
    if (error) return null;
    return data;
  }
};

export const removeWord = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);
  
  if (error) return false;
  return true;
};

export const isWordSaved = async (english: string): Promise<boolean> => {
    const { data } = await supabase
      .from('words')
      .select('id')
      .eq('english', english)
      .single();
    return !!data;
};

// --- DECKS ---

export const getDecks = async (): Promise<Deck[]> => {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data.map(d => ({
      ...d,
      wordIds: d.word_ids,
      createdAt: new Date(d.created_at).getTime()
  }));
};

export const saveDeck = async (name: string, wordIds: string[]): Promise<Deck | null> => {
  const { data, error } = await supabase
    .from('decks')
    .insert([{ name, word_ids: wordIds }])
    .select()
    .single();
  
  if (error) return null;
  return {
      ...data,
      wordIds: data.word_ids,
      createdAt: new Date(data.created_at).getTime()
  };
};

export const updateDeck = async (id: string, name: string, wordIds: string[]): Promise<boolean> => {
  const { error } = await supabase
    .from('decks')
    .update({ name, word_ids: wordIds })
    .eq('id', id);
  return !error;
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', id);
  return !error;
};

// --- HISTORY ---

export const savePracticeResult = async (score: number, total: number, difficulty: string) => {
    await supabase.from('practice_history').insert([{ score, total, difficulty }]);
};

export const saveAccentResult = async (wordId: string, sentence: string, result: PronunciationResult) => {
    await supabase.from('accent_history').insert([{
        word_id: wordId,
        sentence: sentence,
        score: result.score,
        accent: result.accent,
        feedback: result.feedback,
        phonemes: result.phonemes
    }]);
};