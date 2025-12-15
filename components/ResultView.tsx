import React, { useState } from 'react';
import { DetectedObject } from '../types';
import { BookOpenIcon, XMarkIcon, SpeakerIcon, BookmarkIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface ResultViewProps {
  imageSrc: string;
  results: DetectedObject[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  onShowSentences: () => void;
  onSave: (obj: DetectedObject) => void;
  isSaved: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  imageSrc, 
  results, 
  selectedIndex,
  onSelect,
  onClose, 
  onShowSentences,
  onSave,
  isSaved
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
    <div className="relative w-full h-full flex flex-col bg-slate-900">
      
      {/* Background Ambience (Blurred) */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={imageSrc} 
          alt="Background" 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
        />
      </div>

      {/* Main Image Area */}
      <div className={`relative flex-1 w-full flex items-center justify-center p-4 transition-all duration-500 ${isMinimized ? 'pb-24' : 'pb-64'} z-10`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Image Wrapper (Size to fit image) */}
        <div className="relative shadow-2xl rounded-lg overflow-hidden max-h-[70vh]">
          {/* Main Image - object-contain-like behavior via CSS flow */}
          <img 
            src={imageSrc} 
            alt="Captured" 
            className="block max-w-full max-h-[70vh] w-auto h-auto object-contain"
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
              {/* Label Tag on Box */}
              {!isMinimized && (
                <span className={`absolute -top-7 left-0 px-2 py-0.5 text-xs rounded shadow-sm backdrop-blur-md whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    selectedIndex === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-black/50 text-white/80'
                }`}>
                    <span className="font-bold">{obj.english}</span>
                    <span className="opacity-75 text-[10px] border-l border-white/20 pl-1 ml-1 font-mono">
                    {Math.round(obj.confidence * 100)}%
                    </span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      <div className={`absolute bottom-0 w-full p-6 z-20 transition-transform duration-300 ${isMinimized ? 'translate-y-0' : 'translate-y-0'}`}>
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 pb-24 shadow-2xl space-y-4">
          
          {/* Toggle Minimize Button */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
             <button 
               onClick={() => setIsMinimized(!isMinimized)}
               className="bg-slate-800 border border-slate-700 text-slate-400 rounded-full p-1.5 shadow-lg hover:text-white"
             >
                {isMinimized ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
             </button>
          </div>

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

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xs text-indigo-400 font-bold tracking-wider uppercase">
                  {isMinimized ? currentObject.english : 'Tap objects to select'}
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
          </div>

          {!isMinimized && (
            <button
                onClick={onShowSentences}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-lg"
            >
                <BookOpenIcon className="w-5 h-5" />
                <span className="font-thai">ดูตัวอย่างประโยค</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultView;