import React, { useState } from 'react';
import { DetectedObject, WordAssociations } from '../types';
import { BookOpenIcon, XMarkIcon, SpeakerIcon, BookmarkIcon, ChevronDownIcon, ChevronUpIcon, SquaresPlusIcon, SparklesIcon } from './Icons';

interface ResultViewProps {
  imageSrc: string;
  results: DetectedObject[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  onShowSentences: () => void;
  onShowRelated: () => void;
  onSave: (obj: DetectedObject) => void;
  isSaved: boolean;
  associations?: WordAssociations; // Optional: May not be loaded yet
  onLoadAssociations: () => void;
  isLoadingAssociations: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  imageSrc, 
  results, 
  selectedIndex,
  onClose, 
  onShowSentences,
  onShowRelated,
  onSave,
  isSaved,
  associations,
  onSelect,
  isLoadingAssociations
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const currentObject = results[selectedIndex];

  // Helper to convert normalized coordinates [ymin, xmin, ymax, xmax] to style percentages
  const getBoxStyle = (box: number[]) => {
    const [ymin, xmin, ymax, xmax] = box;
    return {
      top: `${ymin * 100}%`,
      left: `${xmin * 100}%`,
      height: `${(ymax - ymin) * 100}%`,
      width: `${(xmax - xmin) * 100}%`,
    };
  };

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      
      {/* Background Ambience (Blurred) */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={imageSrc} 
          alt="Background" 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
        />
      </div>

      {/* Main Image Area */}
      <div className={`relative flex-1 w-full flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${isMinimized ? 'pb-12' : 'pb-80'} z-10`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Image Wrapper - Takes more space when minimized */}
        <div className={`relative shadow-2xl rounded-2xl overflow-hidden transition-all duration-700 ${isMinimized ? 'max-h-[88vh]' : 'max-h-[55vh]'}`}>
          <img 
            src={imageSrc} 
            alt="Captured" 
            className="block max-w-full w-auto h-auto object-contain transition-all duration-700"
          />

          {/* Bounding Boxes Overlay */}
          {results.map((obj, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              style={getBoxStyle(obj.box_2d)}
              className={`absolute border-2 transition-all duration-300 group ${
                selectedIndex === idx 
                  ? 'border-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20' 
                  : 'border-white/40 hover:border-white/80 hover:bg-white/10 z-10'
              }`}
            >
              {/* Labels - Always visible now even when minimized */}
              <span className={`absolute -top-7 left-0 px-2 py-0.5 text-xs rounded shadow-sm backdrop-blur-md whitespace-nowrap transition-all duration-300 flex items-center space-x-1 ${
                  selectedIndex === idx
                  ? 'bg-indigo-600 text-white opacity-100 scale-100'
                  : 'bg-black/50 text-white/80 opacity-100 scale-90'
              }`}>
                  <span className="font-bold">{obj.english}</span>
                  <span className="opacity-75 text-[10px] border-l border-white/20 pl-1 ml-1 font-mono">
                  {Math.round(obj.confidence * 100)}%
                  </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Card - Slides down significantly when minimized */}
      <div className={`absolute bottom-0 w-full p-6 z-20 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isMinimized ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'}`}>
        <div className="bg-slate-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 pb-24 shadow-[0_-20px_50px_rgba(0,0,0,0.6)] space-y-4">
          
          {/* Toggle Minimize Button - More prominent when minimized */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${isMinimized ? '-top-10' : '-top-5'}`}>
             <button 
               onClick={() => setIsMinimized(!isMinimized)}
               className={`group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${
                 isMinimized 
                 ? 'bg-indigo-600 border-white w-14 h-14' 
                 : 'bg-indigo-600 border-indigo-500 w-12 h-12'
               }`}
             >
                {isMinimized ? (
                  <ChevronUpIcon className="w-7 h-7 text-white animate-bounce" />
                ) : (
                  <ChevronDownIcon className="w-6 h-6 text-white" />
                )}
                
                {/* Visual Cue when minimized */}
                {isMinimized && (
                   <div className="absolute -top-12 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap animate-pulse shadow-lg font-thai">
                     แตะเพื่อขยาย
                   </div>
                )}
             </button>
          </div>

          {/* Compact Info Header - Always slightly visible even when sliding down */}
          {isMinimized && (
            <div className="flex items-center justify-center opacity-40 select-none pb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  {currentObject.english} • {currentObject.thai}
                </span>
            </div>
          )}

          {!isMinimized && results.length > 1 && (
            <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar mask-gradient-r">
              {results.map((obj, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                    selectedIndex === idx
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {obj.english}
                </button>
              ))}
            </div>
          )}

          {!isMinimized && (
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs text-indigo-400 font-bold tracking-wider uppercase">
                      Selected Object
                    </h2>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Confidence</span>
                        <span className="text-sm font-mono text-emerald-400 font-bold">
                            {Math.round(currentObject.confidence * 100)}%
                        </span>
                    </div>
                </div>
                
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-white capitalize leading-tight">{currentObject.english}</h1>
                        <button 
                          onClick={(e) => handleSpeak(currentObject.english, e)}
                          className="p-2 rounded-full bg-slate-700 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                          title="Listen"
                        >
                          <SpeakerIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-2xl font-thai text-indigo-300 mt-1">{currentObject.thai}</p>
                      
                      {/* --- SECTION: Associated Verbs (Auto-Loaded) --- */}
                      <div className="mt-4 min-h-[32px] flex items-center">
                         {associations ? (
                            <div className="flex flex-wrap gap-2 animate-fade-in">
                                <span className="text-[10px] text-emerald-400 font-bold tracking-wide flex items-center mr-1 h-6 font-thai">
                                    คำกริยาที่ใช้บ่อย (Verbs)
                                </span>
                                {associations.associatedVerbs.map((verb, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => handleSpeak(verb.english, e)}
                                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1 group"
                                    >
                                        <span>{verb.english}</span>
                                        <span className="text-[10px] opacity-60 font-thai group-hover:opacity-100 transition-opacity">({verb.thai})</span>
                                    </button>
                                ))}
                            </div>
                         ) : isLoadingAssociations ? (
                            <div className="flex items-center gap-2">
                                 <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce"></div>
                                 </div>
                                 <span className="text-xs text-slate-500 font-thai">กำลังหาคำกริยาที่ใช้คู่กัน...</span>
                            </div>
                         ) : null}
                      </div>
                   </div>
                   
                   <button 
                    onClick={() => onSave(currentObject)}
                    className={`p-3 rounded-xl transition-all ${
                        isSaved 
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                    }`}
                   >
                     <BookmarkIcon className="w-6 h-6" filled={isSaved} />
                   </button>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onShowSentences}
                        className="flex-1 bg-white text-slate-900 hover:bg-slate-100 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-lg"
                    >
                        <BookOpenIcon className="w-5 h-5" />
                        <span className="font-thai">ตัวอย่างประโยค</span>
                    </button>
                    <button
                        onClick={onShowRelated}
                        className="flex-1 bg-slate-700 text-white hover:bg-slate-600 border border-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-lg"
                    >
                        <SquaresPlusIcon className="w-5 h-5 text-indigo-300" />
                        <span className="font-thai">ศัพท์ใกล้เคียง</span>
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultView;