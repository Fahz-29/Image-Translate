import React, { useState } from 'react';
import { SentenceExamples, DetectedObject } from '../types';
import { ArrowLeftIcon, SpeakerIcon, BookmarkIcon, SparklesIcon, BookOpenIcon } from './Icons';

interface SentencesModalProps {
  result: DetectedObject;
  sentences?: SentenceExamples | null;
  onBack: () => void;
  onSave: () => void;
  isSaved: boolean;
  onGenerate?: () => Promise<void>;
}

const SentencesModal: React.FC<SentencesModalProps> = ({ 
  result, 
  sentences, 
  onBack, 
  onSave, 
  isSaved,
  onGenerate 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGenerateClick = async () => {
    if (onGenerate) {
      setIsGenerating(true);
      try {
        await onGenerate();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-6 pb-24 overflow-hidden relative z-50 transition-colors duration-500">
      {/* Header */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold font-thai text-slate-900 dark:text-white">ตัวอย่างประโยค</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
        {/* Word Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl mb-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2 capitalize">{result.english}</h1>
            <p className="text-2xl font-thai text-indigo-200">{result.thai}</p>
            <button 
              onClick={() => handleSpeak(result.english)}
              className="mt-4 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition backdrop-blur-sm"
            >
              <SpeakerIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        </div>

        {/* Sentences List */}
        <div className="space-y-6">
          {!sentences ? (
             <div className="text-center py-8 space-y-4">
               <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-full mb-2 shadow-sm">
                 <BookOpenIcon className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-slate-500 dark:text-slate-400 font-thai">ยังไม่มีตัวอย่างประโยคสำหรับคำนี้</p>
               {onGenerate && (
                 <button
                   onClick={handleGenerateClick}
                   disabled={isGenerating}
                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
                 >
                   {isGenerating ? (
                     <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="font-thai">กำลังสร้าง...</span>
                     </>
                   ) : (
                     <>
                        <SparklesIcon className="w-5 h-5" />
                        <span className="font-thai">สร้างตัวอย่างประโยคด้วย AI</span>
                     </>
                   )}
                 </button>
               )}
             </div>
          ) : (
            <>
              {/* Tense Sections */}
              {[
                { label: 'Past', thai: 'อดีต', data: sentences.past, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-300' },
                { label: 'Present', thai: 'ปัจจุบัน', data: sentences.present, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
                { label: 'Future', thai: 'อนาคต', data: sentences.future, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' }
              ].map((tense, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 ${tense.color} text-[10px] font-bold uppercase tracking-wider rounded`}>{tense.label}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-thai">{tense.thai}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-lg text-slate-900 dark:text-white leading-relaxed font-medium">{tense.data.en}</p>
                      <button onClick={() => handleSpeak(tense.data.en)} className="mt-1 text-slate-400 hover:text-indigo-600 transition"><SpeakerIcon className="w-5 h-5" /></button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-thai">{tense.data.th}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 w-full px-6">
         {!isSaved && (
             <button
               onClick={onSave}
               className="w-full py-4 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
             >
               <BookmarkIcon className="w-5 h-5" filled={false} />
               <span className="font-thai">บันทึกคำศัพท์</span>
             </button>
         )}
      </div>
    </div>
  );
};

export default SentencesModal;