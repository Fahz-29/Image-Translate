import React from 'react';
import { DetectedObject, RelatedWord } from '../types';
import { ArrowLeftIcon, SpeakerIcon, BookmarkIcon } from './Icons';

interface RelatedWordsModalProps {
  originalObject: DetectedObject;
  relatedWords: RelatedWord[];
  onBack: () => void;
  onSaveWord: (en: string, th: string) => void;
  savedStatus: {[key: string]: boolean};
}

const RelatedWordsModal: React.FC<RelatedWordsModalProps> = ({ 
  originalObject, 
  relatedWords, 
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

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 overflow-hidden relative z-50">
      {/* Header */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-thai text-white">คำศัพท์ใกล้เคียง</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Original Word Card */}
        <div className="bg-slate-800 rounded-3xl p-6 shadow-xl mb-6 flex items-center justify-between border border-slate-700">
            <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Original Word</p>
                <h1 className="text-2xl font-bold text-white capitalize">{originalObject.english}</h1>
                <p className="text-lg font-thai text-indigo-400">{originalObject.thai}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30">
                {relatedWords.length}
            </div>
        </div>

        {/* List of related words */}
        <div className="space-y-3">
          {relatedWords.map((word, index) => (
             <div 
                key={index} 
                className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:bg-slate-800 transition"
             >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white capitalize">{word.english}</span>
                        <button 
                            onClick={() => handleSpeak(word.english)} 
                            className="p-1 text-slate-500 hover:text-indigo-400 rounded-full bg-white/5"
                        >
                            <SpeakerIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <button 
                        onClick={() => onSaveWord(word.english, word.thai)}
                        className={`p-2 rounded-lg transition-colors ${
                            savedStatus[word.english.toLowerCase()] 
                            ? 'text-pink-400 bg-pink-500/10' 
                            : 'text-slate-500 hover:text-white bg-white/5'
                        }`}
                    >
                        <BookmarkIcon className="w-5 h-5" filled={savedStatus[word.english.toLowerCase()]} />
                    </button>
                </div>
                
                <p className="text-indigo-300 font-thai font-bold mb-1">{word.thai}</p>
                
                <div className="flex items-start gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded uppercase tracking-wider font-bold whitespace-nowrap mt-0.5">
                        {word.type}
                    </span>
                    <p className="text-xs text-slate-400 font-thai leading-relaxed">
                        {word.definition}
                    </p>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatedWordsModal;