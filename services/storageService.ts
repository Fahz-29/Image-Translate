
import { SavedWord, SentenceExamples, Deck, PronunciationResult, WordAssociations } from '../types';
import { supabase } from './supabaseClient';

// --- WORDS ---

export const getSavedWords = async (): Promise<SavedWord[]> => {
  try {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
        console.error("Supabase SELECT Error:", error.message);
        return [];
    }
    
    return (data || []).map(w => ({
        id: w.id,
        thai: w.thai,
        english: w.english,
        sentences: w.sentences,
        associations: w.associations,
        imageUrls: w.image_urls || [], 
        timestamp: w.timestamp ? new Date(w.timestamp).getTime() : Date.now()
    }));
  } catch (e) {
    console.error("Failed to fetch words:", e);
    return [];
  }
};

/**
 * บันทึกคำศัพท์
 * คืนค่าเป็น Object ที่มี data (SavedWord) หรือ error (string)
 */
export const saveWord = async (
  english: string, 
  thai: string, 
  sentences?: SentenceExamples, 
  associations?: WordAssociations,
  imageUrls?: string[]
): Promise<{ data: SavedWord | null, error: string | null }> => {
  try {
    // 1. ตรวจสอบว่ามีคำนี้อยู่แล้วหรือไม่ (Case Insensitive)
    const { data: existing } = await supabase
      .from('words')
      .select('*')
      .ilike('english', english)
      .maybeSingle();

    // 2. เตรียมข้อมูล (ปรับชื่อคอลัมน์ให้ตรงกับ SQL)
    const payload: any = {
      english: english.toLowerCase(),
      thai,
      sentences: sentences || (existing ? existing.sentences : null),
      associations: associations || (existing ? existing.associations : null),
      image_urls: imageUrls || (existing?.image_urls) || [],
      timestamp: new Date().toISOString()
    };

    let finalData;
    if (existing) {
      const { data, error } = await supabase
        .from('words')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      finalData = data;
    } else {
      const { data, error } = await supabase
        .from('words')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      finalData = data;
    }

    return { 
      data: { ...finalData, imageUrls: finalData.image_urls || [] }, 
      error: null 
    };
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error("❌ Supabase Save Failure:", errorMsg);
    
    // ดักจับกรณีคอลัมน์ image_urls หายไป
    if (errorMsg.includes('column "image_urls"') || errorMsg.includes('image_urls')) {
        return { 
            data: null, 
            error: "DATABASE_SCHEMA_ERROR: ตาราง 'words' ขาดคอลัมน์ 'image_urls' กรุณารัน SQL 'ALTER TABLE words ADD COLUMN image_urls TEXT[];' ใน Supabase SQL Editor" 
        };
    }
    
    return { data: null, error: `Supabase Error: ${errorMsg}` };
  }
};

export const removeWord = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Supabase DELETE Error:", error.message);
    return false;
  }
  return true;
};

export const isWordSaved = async (english: string): Promise<boolean> => {
    try {
        if (!english) return false;
        const { data } = await supabase
          .from('words')
          .select('id')
          .ilike('english', english)
          .maybeSingle();
        return !!data;
    } catch {
        return false;
    }
};

// --- DECKS & HISTORY ---

export const getDecks = async (): Promise<Deck[]> => {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      wordIds: d.word_ids || [],
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
      id: data.id,
      name: data.name,
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
