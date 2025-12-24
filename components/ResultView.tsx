
import React, { useState } from 'react';
import { DetectedObject, WordAssociations } from '../types';
import { BookOpenIcon, XMarkIcon, SpeakerIcon, BookmarkIcon, ChevronDownIcon, ChevronUpIcon, SquaresPlusIcon } from './Icons';

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
  associations?: WordAssociations; 
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
  const images = currentObject.imageUrls && currentObject.imageUrls.length > 0 
    ? currentObject.imageUrls 
    : [imageSrc];

  // Helper to convert normalized coordinates
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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={images[0]} 
          alt="Background" 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
        />
      </div>

      {/* Main Area: Image(s) */}
      <div className={`relative flex-1 w-full flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${isMinimized ? 'pb-12' : 'pb-80'} z-10`}>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {images.length > 1 ? (
          /* Multi-Image Carousel */
          <div className={`w-full flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 no-scrollbar transition-all duration-700 ${isMinimized ? 'max-h-[85vh]' : 'max-h-[50vh]'}`}>
            {images.map((img, i) => (
              <div key={i} className="flex-shrink-0 w-full snap-center flex items-center justify-center">
                <div className="relative shadow-2xl rounded-3xl overflow-hidden bg-slate-800">
                   <img 
                    src={img} 
                    alt={`Result ${i}`} 
                    className="block max-w-full w-auto h-auto max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://source.unsplash.com/featured/?nature&${i}`;
                    }}
                   />
                   <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold">
                      {i + 1} / {images.length}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Image with Box */
          <div className={`relative shadow-2xl rounded-2xl overflow-hidden transition-all duration-700 ${isMinimized ? 'max-h-[88vh]' : 'max-h-[55vh]'}`}>
            <img 
              src={images[0]} 
              alt="Captured" 
              className="block max-w-full w-auto h-auto object-contain transition-all duration-700"
            />
            {results.map((obj, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                style={getBoxStyle(obj.box_2d)}
                className={`absolute border-2 transition-all duration-300 ${
                  selectedIndex === idx 
                    ? 'border-indigo-400 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20' 
                    : 'border-white/40 hover:border-white/80 z-10'
                }`}
              >
                <span className={`absolute -top-7 left-0 px-2 py-0.5 text-xs rounded shadow-sm backdrop-blur-md whitespace-nowrap transition-all duration-300 flex items-center space-x-1 ${
                    selectedIndex === idx ? 'bg-indigo-600 text-white opacity-100 scale-100' : 'bg-black/50 text-white/80 opacity-0 scale-90'
                }`}>
                    <span className="font-bold">{obj.english}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Swipe Hint for Carousel */}
        {images.length > 1 && !isMinimized && (
           <div className="absolute bottom-72 left-1/2 -translate-x-1/2 flex gap-1 items-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/70 font-bold uppercase tracking-widest font-thai">
              <span className="animate-pulse">เลื่อนดูรูปเพิ่มเติม</span>
           </div>
        )}
      </div>

      {/* Result Card */}
      <div className={`absolute bottom-0 w-full p-6 z-20 transition-all duration-700 ${isMinimized ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'}`}>
        <div className="bg-slate-800/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 pb-24 shadow-[0_-20px_50px_rgba(0,0,0,0.6)] space-y-4">
          
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${isMinimized ? '-top-10' : '-top-5'}`}>
             <button 
               onClick={() => setIsMinimized(!isMinimized)}
               className={`group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${
                 isMinimized ? 'bg-indigo-600 border-white w-14 h-14' : 'bg-indigo-600 border-indigo-500 w-12 h-12'
               }`}
             >
                {isMinimized ? <ChevronUpIcon className="w-7 h-7 text-white animate-bounce" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
             </button>
          </div>

          {!isMinimized && (
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xs text-indigo-400 font-bold tracking-wider uppercase">Vocabulary Match</h2>
                    <span className="text-sm font-mono text-emerald-400 font-bold">{Math.round(currentObject.confidence * 100)}% Match</span>
                </div>
                
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-white capitalize leading-tight">{currentObject.english}</h1>
                        <button 
                          onClick={(e) => handleSpeak(currentObject.english, e)}
                          className="p-2 rounded-full bg-slate-700 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                        >
                          <SpeakerIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-2xl font-thai text-indigo-300 mt-1">{currentObject.thai}</p>
                      
                      {/* Section: Associated Verbs */}
                      <div className="mt-4 min-h-[32px] flex items-center">
                         {associations ? (
                            <div className="flex flex-wrap gap-2 animate-fade-in">
                                <span className="text-[10px] text-emerald-400 font-bold tracking-wide mr-1 h-6 font-thai flex items-center">
                                    ใช้บ่อย (Verbs)
                                </span>
                                {associations.associatedVerbs.slice(0, 3).map((verb, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => handleSpeak(verb.english, e)}
                                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                                    >
                                        {verb.english} ({verb.thai})
                                    </button>
                                ))}
                            </div>
                         ) : isLoadingAssociations ? (
                            <div className="flex items-center gap-2">
                                 <div className="flex space-x-1">
                                    <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce"></div>
                                 </div>
                                 <span className="text-[10px] text-slate-500 font-thai">กำลังหาข้อมูลเพิ่มเติม...</span>
                            </div>
                         ) : null}
                      </div>
                   </div>
                   
                   <button 
                    onClick={() => onSave(currentObject)}
                    className={`p-3 rounded-xl transition-all ${
                        isSaved ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}
                   >
                     <BookmarkIcon className="w-6 h-6" filled={isSaved} />
                   </button>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onShowSentences}
                        className="flex-1 bg-white text-slate-900 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                    >
                        <BookOpenIcon className="w-5 h-5" />
                        <span className="font-thai">ตัวอย่างสนทนา</span>
                    </button>
                    <button
                        onClick={onShowRelated}
                        className="flex-1 bg-slate-700 text-white border border-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
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
