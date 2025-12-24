
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
        <h2 className="text-xl font-bold font-thai text-slate-900 dark:text-white">ตัวอย่างบทสนทนา</h2>
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
        </div>

        {/* Sentences List */}
        <div className="space-y-6">
          {!sentences ? (
             <div className="text-center py-8 space-y-4">
               <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-full mb-2 shadow-sm">
                 <BookOpenIcon className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-slate-500 dark:text-slate-400 font-thai">กำลังประมวลผลบทสนทนา...</p>
               {onGenerate && (
                 <button
                   onClick={handleGenerateClick}
                   disabled={isGenerating}
                   className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition shadow-lg disabled:opacity-50"
                 >
                   <SparklesIcon className="w-5 h-5" />
                   <span className="font-thai">{isGenerating ? 'กำลังสร้าง...' : 'สร้างตัวอย่างบทสนทนา'}</span>
                 </button>
               )}
             </div>
          ) : (
            <>
              {/* Scenarios */}
              {[
                { label: 'Casual', thai: 'ภาษาพูดทั่วไป', data: sentences.scenario1, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-300' },
                { label: 'Formal', thai: 'ทางการ', data: sentences.scenario2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
                { label: 'Q & A', thai: 'ถาม-ตอบ', data: sentences.scenario3, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 ${item.color} text-[10px] font-bold uppercase tracking-wider rounded`}>{item.label}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-thai">{item.thai}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-lg text-slate-900 dark:text-white leading-relaxed font-medium italic">"{item.data.en}"</p>
                      <button onClick={() => handleSpeak(item.data.en)} className="mt-1 text-slate-400 hover:text-indigo-600 transition"><SpeakerIcon className="w-5 h-5" /></button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-thai text-sm">{item.data.th}</p>
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
               className="w-full py-4 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl"
             >
               <BookmarkIcon className="w-5 h-5" filled={false} />
               <span className="font-thai">บันทึกคำศัพท์และบทสนทนา</span>
             </button>
         )}
      </div>
    </div>
  );
};

export default SentencesModal;
