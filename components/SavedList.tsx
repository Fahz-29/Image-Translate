
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

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 pb-24 px-6 overflow-hidden transition-colors duration-500">
      
      {/* Header - Simplified by removing the icon as requested */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-thai tracking-tight leading-none mb-2">คลังคำศัพท์ของฉัน</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-thai opacity-80">
          {words.length > 0 
            ? `รายการคำศัพท์ที่คุณบันทึกไว้ทั้งหมด (${words.length} รายการ)`
            : 'สะสมคำศัพท์จากการสแกนของคุณได้ที่นี่'}
        </p>
      </div>
      
      {/* List Content or Empty State */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 dark:text-slate-500 space-y-4 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <BookOpenIcon className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-thai">ยังไม่มีคำศัพท์ที่บันทึกไว้<br/>ลองสแกนแล้วกดบันทึกดูสิ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {words.map((word) => (
              <div 
                key={word.id} 
                onClick={() => onSelectWord(word)}
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all active:scale-[0.98] group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate capitalize tracking-tight">{word.english}</h3>
                    <button 
                      onClick={(e) => handleSpeak(word.english, e)}
                      className="p-1.5 rounded-xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:text-white hover:bg-indigo-600 transition-all"
                    >
                      <SpeakerIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-indigo-600 dark:text-indigo-400 font-thai font-bold text-sm truncate mt-0.5">{word.thai}</p>
                  
                  <div className="flex items-center mt-3 space-x-2">
                    {word.sentences ? (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1 font-bold">
                            <BookOpenIcon className="w-3 h-3" />
                            มีประโยคตัวอย่าง
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                            แตะเพื่อเรียนรู้เพิ่ม
                        </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
                  className="p-2.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all ml-2"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedList;
