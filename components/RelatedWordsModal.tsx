import React from 'react';
import { DetectedObject, WordAssociations, RelatedWord } from '../types';
import { ArrowLeftIcon, SpeakerIcon, BookmarkIcon, SquaresPlusIcon } from './Icons';

interface RelatedWordsModalProps {
  originalObject: DetectedObject;
  associations: WordAssociations;
  onBack: () => void;
  onSaveWord: (en: string, th: string) => void;
  savedStatus: {[key: string]: boolean};
}

const RelatedWordsModal: React.FC<RelatedWordsModalProps> = ({ 
  originalObject, 
  associations, 
  onBack,
  onSaveWord,
  savedStatus
}) => {

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderWordItem = (word: RelatedWord) => (
    <div 
        key={word.english}
        className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 transition hover:border-indigo-400 dark:hover:bg-slate-800 shadow-sm"
    >
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">{word.english}</span>
                <button 
                    onClick={() => handleSpeak(word.english)} 
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-full bg-slate-100 dark:bg-white/5"
                >
                    <SpeakerIcon className="w-4 h-4" />
                </button>
            </div>
            <button 
                onClick={() => onSaveWord(word.english, word.thai)}
                className={`p-2 rounded-lg transition-colors ${
                    savedStatus[word.english.toLowerCase()] 
                    ? 'text-pink-500 bg-pink-50 dark:bg-pink-500/10' 
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5'
                }`}
            >
                <BookmarkIcon className="w-5 h-5" filled={savedStatus[word.english.toLowerCase()]} />
            </button>
        </div>
        
        <p className="text-indigo-600 dark:text-indigo-300 font-thai font-bold mb-1">{word.thai}</p>
        
        <div className="flex items-start gap-2 mt-2">
            <span className="px-2 py-0.5 text-[10px] rounded uppercase tracking-wider font-bold whitespace-nowrap mt-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                {word.type}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-thai leading-relaxed">
                {word.definition}
            </p>
        </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-6 pb-24 overflow-hidden relative z-50 transition-colors duration-500">
      {/* Header */}
      <div className="px-6 mb-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-thai text-slate-900 dark:text-white">คลังคำศัพท์ที่เกี่ยวข้อง</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 no-scrollbar">
        
        {/* Original Word Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md flex items-center justify-between border border-slate-200 dark:border-slate-700">
            <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1 tracking-widest">Target Word</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{originalObject.english}</h1>
                <p className="text-lg font-thai text-indigo-600 dark:text-indigo-400">{originalObject.thai}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <SquaresPlusIcon className="w-6 h-6" />
            </div>
        </div>

        {/* Section: Related Vocabulary */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-thai">ศัพท์ใกล้เคียง</h3>
            </div>
            <div className="space-y-3">
                {associations.relatedWords.map(word => renderWordItem(word))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default RelatedWordsModal;