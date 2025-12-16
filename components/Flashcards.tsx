import React, { useState, useEffect } from 'react';
import { SavedWord, Deck } from '../types';
import { SpeakerIcon, ArrowLeftIcon, SparklesIcon, PlayIcon, XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckBadgeIcon } from './Icons';
import { saveDeck, getDecks, deleteDeck, updateDeck } from '../services/storageService';

interface FlashcardsProps {
  words: SavedWord[];
}

type FlashcardView = 'LIST_DECKS' | 'CREATE_DECK' | 'PLAY_DECK';

const Flashcards: React.FC<FlashcardsProps> = ({ words }) => {
  const [view, setView] = useState<FlashcardView>('LIST_DECKS');
  const [decks, setDecks] = useState<Deck[]>([]);
  
  // Creation/Edit State
  const [newDeckName, setNewDeckName] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);

  // Player State
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
  const [sessionWords, setSessionWords] = useState<SavedWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setDecks(getDecks());
  }, []);

  // --- ACTIONS ---

  const handleSaveDeck = () => {
    if (!newDeckName.trim() || selectedWordIds.size === 0) return;

    if (editingDeckId) {
        updateDeck(editingDeckId, newDeckName, Array.from(selectedWordIds));
    } else {
        saveDeck(newDeckName, Array.from(selectedWordIds));
    }

    setDecks(getDecks());
    resetCreateForm();
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบชุดคำศัพท์นี้?")) {
        setDecks(deleteDeck(id));
    }
  };

  const handleEditDeck = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeckId(deck.id);
    setNewDeckName(deck.name);
    setSelectedWordIds(new Set(deck.wordIds));
    setView('CREATE_DECK');
  };

  const resetCreateForm = () => {
    setView('LIST_DECKS');
    setNewDeckName('');
    setSelectedWordIds(new Set());
    setEditingDeckId(null);
  };

  const handlePlayDeck = (deck: Deck) => {
    const deckWords = words.filter(w => deck.wordIds.includes(w.id));
    if (deckWords.length === 0) return;

    // Shuffle
    const shuffled = [...deckWords].sort(() => Math.random() - 0.5);
    setSessionWords(shuffled);
    setCurrentDeck(deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setView('PLAY_DECK');
  };

  const restartDeck = () => {
    if (!currentDeck) return;
    const shuffled = [...sessionWords].sort(() => Math.random() - 0.5);
    setSessionWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedWordIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedWordIds(newSelected);
  };

  const handleNext = () => {
    setIsFlipped(false);
    
    // Check if it was the last card
    if (currentIndex >= sessionWords.length - 1) {
        // Delay slightly to allow flip animation reset if needed, but mainly just show finish
        setTimeout(() => {
            setIsFinished(true);
        }, 300);
    } else {
        // Wait slightly for the flip back to start before changing content
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 300);
    }
  };

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- VIEWS ---

  // 1. LIST DECKS VIEW
  if (view === 'LIST_DECKS') {
    return (
      <div className="h-full w-full bg-slate-900 flex flex-col pt-10 pb-24 overflow-hidden px-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white font-thai">ชุดคำศัพท์ของฉัน</h1>
            <button 
                onClick={() => { resetCreateForm(); setView('CREATE_DECK'); }}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-500 shadow-lg"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
        </div>

        {decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 space-y-4 text-center">
                <SparklesIcon className="w-12 h-12 opacity-30" />
                <p className="font-thai">ยังไม่ได้สร้างชุดคำศัพท์<br/>กด + เพื่อสร้างชุดใหม่</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-4">
                {decks.map(deck => {
                    const count = words.filter(w => deck.wordIds.includes(w.id)).length;
                    return (
                        <div 
                            key={deck.id}
                            onClick={() => handlePlayDeck(deck)}
                            className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition-all group"
                        >
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white font-thai">{deck.name}</h3>
                                <p className="text-slate-400 text-sm mt-1">{count} คำศัพท์</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleEditDeck(deck, e)}
                                    className="p-2 text-slate-500 hover:text-indigo-400 transition"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                                    className="p-2 text-slate-500 hover:text-red-400 transition"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition ml-1">
                                    <PlayIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    );
  }

  // 2. CREATE / EDIT DECK VIEW
  if (view === 'CREATE_DECK') {
    return (
      <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 overflow-hidden">
        <div className="px-6 mb-4 flex items-center gap-3">
            <button onClick={resetCreateForm} className="p-2 -ml-2 text-slate-400 hover:text-white">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white font-thai">
                {editingDeckId ? 'แก้ไขชุดคำศัพท์' : 'สร้างชุดใหม่'}
            </h1>
        </div>

        <div className="px-6 mb-4">
            <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">ชื่อชุดคำศัพท์</label>
            <input 
                type="text" 
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="เช่น ผลไม้, เครื่องเขียน"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-thai"
            />
        </div>

        <div className="px-6 py-2 bg-slate-800/50 border-y border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400 font-thai">เลือกคำศัพท์ ({selectedWordIds.size})</span>
            <button 
                onClick={() => setSelectedWordIds(new Set(words.map(w => w.id)))}
                className="text-xs text-indigo-400 font-bold uppercase"
            >Select All</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {words.length === 0 && <p className="text-center text-slate-500 font-thai py-4">ไม่มีคำศัพท์ที่บันทึกไว้</p>}
            {words.map((word) => {
                const isSelected = selectedWordIds.has(word.id);
                return (
                    <div 
                        key={word.id}
                        onClick={() => toggleSelection(word.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                            ? 'bg-indigo-900/20 border-indigo-500/50' 
                            : 'bg-slate-800/30 border-slate-700/30'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                 isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-500'
                             }`}>
                                 {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                             </div>
                             <span className="font-bold text-white capitalize">{word.english}</span>
                        </div>
                        <span className="text-sm font-thai text-slate-400">{word.thai}</span>
                    </div>
                );
            })}
        </div>

        <div className="px-6 pt-4">
             <button
                onClick={handleSaveDeck}
                disabled={!newDeckName.trim() || selectedWordIds.size === 0}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg ${
                    newDeckName.trim() && selectedWordIds.size > 0 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
             >
                <span className="font-thai">{editingDeckId ? 'บันทึกการแก้ไข' : 'สร้างชุดคำศัพท์'}</span>
             </button>
        </div>
      </div>
    );
  }

  // 3. PLAY DECK VIEW
  
  // 3.1 Completion Screen
  if (view === 'PLAY_DECK' && isFinished) {
      return (
        <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
             <div className="relative mb-8">
                 <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 rounded-full"></div>
                 <div className="relative bg-slate-800 p-6 rounded-full border border-slate-700">
                     <CheckBadgeIcon className="w-20 h-20 text-green-400" />
                 </div>
             </div>
             
             <h2 className="text-3xl font-bold text-white mb-2 font-thai">ยอดเยี่ยม!</h2>
             <p className="text-slate-400 font-thai mb-10">คุณท่องคำศัพท์ครบ {sessionWords.length} คำแล้ว</p>

             <div className="w-full max-w-xs space-y-3">
                 <button 
                    onClick={restartDeck}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all font-thai"
                 >
                    ทดสอบอีกครั้ง
                 </button>
                 <button 
                    onClick={() => setView('LIST_DECKS')}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all font-thai"
                 >
                    เสร็จสิ้น
                 </button>
             </div>
        </div>
      );
  }

  // 3.2 Playing Screen
  const currentWord = sessionWords[currentIndex];

  if (view === 'PLAY_DECK' && currentWord) {
    return (
        <div className="h-full w-full bg-slate-900 flex flex-col pt-10 pb-24 px-6 overflow-hidden items-center justify-center">
            <div className="absolute top-8 left-0 w-full flex justify-between px-6 items-center z-10">
                <button 
                    onClick={() => setView('LIST_DECKS')} 
                    className="p-2 rounded-full bg-black/20 text-white/50 hover:bg-black/40 hover:text-white transition"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h2 className="text-white font-bold font-thai">{currentDeck?.name}</h2>
                    <span className="text-slate-400 font-mono text-xs">{currentIndex + 1} / {sessionWords.length}</span>
                </div>
                <div className="w-10" />
            </div>

            {/* Flashcard Area */}
            <div 
                className="relative w-full max-w-sm aspect-[3/4] [perspective:1000px] cursor-pointer group mt-4"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                
                {/* Front (English) */}
                <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest absolute top-8">Tap to flip</span>
                    
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-4xl font-bold text-white capitalize">{currentWord.english}</h2>
                        <button 
                            onClick={(e) => handleSpeak(currentWord.english, e)}
                            className="p-3 bg-slate-700 rounded-full text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                        >
                            <SpeakerIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Back (Thai & Sentences) */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl shadow-2xl border border-indigo-500/30 flex flex-col p-8">
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 border-b border-white/10 pb-4 mb-4">
                        <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Meaning</span>
                        <h3 className="text-3xl font-thai text-white">{currentWord.thai}</h3>
                    </div>
                    
                    <div className="flex-[2] overflow-y-auto space-y-3 no-scrollbar">
                        {currentWord.sentences ? (
                            <>
                                <div className="space-y-1 bg-black/20 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase text-indigo-300 font-bold">Past</span>
                                        <button onClick={(e) => handleSpeak(currentWord.sentences!.past.en, e)} className="p-1 text-indigo-300 hover:text-white"><SpeakerIcon className="w-3 h-3"/></button>
                                    </div>
                                    <p className="text-sm text-slate-200 italic">"{currentWord.sentences.past.en}"</p>
                                    <p className="text-xs text-slate-400 font-thai mt-1">{currentWord.sentences.past.th}</p>
                                </div>

                                <div className="space-y-1 bg-black/20 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase text-emerald-300 font-bold">Present</span>
                                        <button onClick={(e) => handleSpeak(currentWord.sentences!.present.en, e)} className="p-1 text-emerald-300 hover:text-white"><SpeakerIcon className="w-3 h-3"/></button>
                                    </div>
                                    <p className="text-sm text-slate-200 italic">"{currentWord.sentences.present.en}"</p>
                                    <p className="text-xs text-slate-400 font-thai mt-1">{currentWord.sentences.present.th}</p>
                                </div>

                                <div className="space-y-1 bg-black/20 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase text-blue-300 font-bold">Future</span>
                                        <button onClick={(e) => handleSpeak(currentWord.sentences!.future.en, e)} className="p-1 text-blue-300 hover:text-white"><SpeakerIcon className="w-3 h-3"/></button>
                                    </div>
                                    <p className="text-sm text-slate-200 italic">"{currentWord.sentences.future.en}"</p>
                                    <p className="text-xs text-slate-400 font-thai mt-1">{currentWord.sentences.future.th}</p>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-white/50 text-sm italic font-thai">
                                ไม่มีตัวอย่างประโยค
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="mt-8 px-10 py-3 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all font-thai"
            >
                {currentIndex === sessionWords.length - 1 ? 'เสร็จสิ้น' : 'ถัดไป'}
            </button>
        </div>
    );
  }

  return null;
};

export default Flashcards;