import React from 'react';
import { SavedWord } from '../types';
import { TrashIcon, SpeakerIcon, BookOpenIcon } from './Icons';

interface SavedListProps {
  words: SavedWord[];
  onDelete: (id: string) => void;
  onSelectWord: (word: SavedWord) => void;
}

const SavedList: React.FC<SavedListProps> = ({ words, onDelete, onSelectWord }) => {
  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 dark:text-slate-500 space-y-4 transition-colors">
        <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
            <BookOpenIcon className="w-8 h-8 opacity-50" />
        </div>
        <p className="font-thai">ยังไม่มีคำศัพท์ที่บันทึกไว้<br/>ลองสแกนแล้วกดบันทึกดูสิ</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 pb-24 px-4 overflow-hidden transition-colors duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2 font-thai">คำศัพท์ที่บันทึก ({words.length})</h1>
      
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1 no-scrollbar">
        {words.map((word) => (
          <div 
            key={word.id} 
            onClick={() => onSelectWord(word)}
            className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-400 transition active:scale-[0.98]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate capitalize">{word.english}</h3>
                <button 
                  onClick={(e) => handleSpeak(word.english, e)}
                  className="p-1.5 rounded-full bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:text-white hover:bg-indigo-600 transition"
                >
                  <SpeakerIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-indigo-600 dark:text-indigo-400 font-thai text-sm truncate">{word.thai}</p>
              
              <div className="flex items-center mt-2 space-x-2">
                 {word.sentences ? (
                    <span className="text-[10px] bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800 flex items-center gap-1">
                        <BookOpenIcon className="w-3 h-3" />
                        มีประโยค
                    </span>
                 ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1.5 py-0.5">
                        แตะเพื่อดูรายละเอียด
                    </span>
                 )}
              </div>
            </div>
            
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors ml-2"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedList;