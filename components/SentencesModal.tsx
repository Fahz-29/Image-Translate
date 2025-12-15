import React from 'react';
import { SentenceExamples, DetectedObject } from '../types';
import { ArrowLeftIcon, SpeakerIcon } from './Icons';

interface SentencesModalProps {
  result: DetectedObject;
  sentences: SentenceExamples;
  onBack: () => void;
}

const SentencesModal: React.FC<SentencesModalProps> = ({ result, sentences, onBack }) => {

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="p-6 pb-4 flex items-center space-x-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition">
          <ArrowLeftIcon className="w-6 h-6 text-white" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight capitalize flex items-center gap-2">
             {result.english}
             <button 
               onClick={() => handleSpeak(result.english)}
               className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
             >
               <SpeakerIcon className="w-4 h-4" />
             </button>
          </h2>
          <p className="text-sm font-thai text-indigo-400">{result.thai}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Past */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wider">
                    Past (อดีต)
                </span>
            </div>
            <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-lg text-white font-medium">{sentences.past.en}</p>
                <button 
                  onClick={() => handleSpeak(sentences.past.en)}
                  className="flex-shrink-0 p-2 mt-1 rounded-full bg-slate-700/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                >
                  <SpeakerIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-slate-400 font-thai">{sentences.past.th}</p>
        </div>

        {/* Present */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 uppercase tracking-wider">
                    Present (ปัจจุบัน)
                </span>
            </div>
            <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-lg text-white font-medium">{sentences.present.en}</p>
                <button 
                  onClick={() => handleSpeak(sentences.present.en)}
                  className="flex-shrink-0 p-2 mt-1 rounded-full bg-slate-700/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                >
                  <SpeakerIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-slate-400 font-thai">{sentences.present.th}</p>
        </div>

        {/* Future */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                    Future (อนาคต)
                </span>
            </div>
            <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-lg text-white font-medium">{sentences.future.en}</p>
                <button 
                  onClick={() => handleSpeak(sentences.future.en)}
                  className="flex-shrink-0 p-2 mt-1 rounded-full bg-slate-700/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                >
                  <SpeakerIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-slate-400 font-thai">{sentences.future.th}</p>
        </div>

      </div>
    </div>
  );
};

export default SentencesModal;