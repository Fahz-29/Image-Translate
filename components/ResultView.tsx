
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
  
  // Prepare images list
  const initialImages = currentObject.imageUrls && currentObject.imageUrls.length > 0 
    ? currentObject.imageUrls 
    : [imageSrc];
    
  const [images, setImages] = useState<string[]>(initialImages);

  const handleImageError = (index: number) => {
    const newImages = [...images];
    // If a web image fails, replace it with a reliable Unsplash fallback based on the word
    const fallbackUrl = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80&sig=${index}&keyword=${encodeURIComponent(currentObject.english)}`;
    newImages[index] = fallbackUrl;
    setImages(newImages);
  };

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
      <div className={`relative flex-1 w-full flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${isMinimized ? 'pb-16' : 'pb-80'} z-10`}>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition shadow-lg"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {images.length > 1 ? (
          /* Multi-Image Carousel */
          <div className={`w-full h-full flex items-center overflow-x-auto snap-x snap-mandatory gap-6 px-4 no-scrollbar transition-all duration-700`}>
            {images.map((img, i) => (
              <div key={i} className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center py-10">
                <div className="relative shadow-2xl rounded-[40px] overflow-hidden bg-slate-800 border-4 border-white/10 max-h-full">
                   <img 
                    src={img} 
                    alt={`Result ${i}`} 
                    className="block w-full h-auto max-h-[60vh] object-contain"
                    onError={() => handleImageError(i)}
                   />
                   <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-xl text-white text-xs px-3 py-1.5 rounded-full font-bold border border-white/10">
                      {i + 1} / {images.length}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Image with Box (For Camera Scan) */
          <div className={`relative shadow-2xl rounded-3xl overflow-hidden transition-all duration-700 border-4 border-white/5`}>
            <img 
              src={images[0]} 
              alt="Captured" 
              className="block max-w-full w-auto h-auto max-h-[55vh] object-contain transition-all duration-700"
              onError={() => handleImageError(0)}
            />
            {results.map((obj, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                style={getBoxStyle(obj.box_2d)}
                className={`absolute border-2 transition-all duration-300 ${
                  selectedIndex === idx 
                    ? 'border-indigo-400 bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-20' 
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
           <div className="absolute bottom-80 left-1/2 -translate-x-1/2 flex gap-2 items-center bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full text-xs text-white font-bold tracking-widest font-thai border border-white/10">
              <span className="animate-pulse">← ปัดเพื่อดูรูปอื่น →</span>
           </div>
        )}
      </div>

      {/* Result Card */}
      <div className={`absolute bottom-0 w-full p-4 z-20 transition-all duration-700 ease-in-out ${isMinimized ? 'translate-y-[calc(100%-80px)]' : 'translate-y-0'}`}>
        <div 
          onClick={() => isMinimized && setIsMinimized(false)}
          className={`bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 ${isMinimized ? 'pt-6 pb-6 cursor-pointer hover:bg-slate-900' : 'p-8 pb-24'}`}
        >
          
          {/* Toggle Button Container */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-30 ${isMinimized ? 'top-1' : '-top-6'}`}>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
               className={`group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 ${
                 isMinimized ? 'bg-indigo-600 border-white/20 w-12 h-12' : 'bg-indigo-600 border-slate-900 w-12 h-12'
               }`}
             >
                {isMinimized ? <ChevronUpIcon className="w-6 h-6 text-white animate-bounce" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
             </button>
          </div>

          {/* Card Content */}
          <div className="relative">
            {isMinimized ? (
              /* Mini Header (Visible when minimized) */
              <div className="flex items-center justify-between px-2 animate-fade-in">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                       <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                       <h3 className="text-white font-black capitalize leading-tight">{currentObject.english}</h3>
                       <p className="text-indigo-400 text-[10px] font-thai font-bold">{currentObject.thai}</p>
                    </div>
                 </div>
                 <div className="text-[9px] text-slate-500 dark:text-slate-500 font-thai font-bold uppercase tracking-widest opacity-60">
                    แตะเพื่อขยาย
                 </div>
              </div>
            ) : (
              /* Full Content */
              <div className="animate-fade-in-up">
                  <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-[10px] text-indigo-400 font-black tracking-[0.2em] uppercase">Verified Discovery</h2>
                          <span className="text-xs font-mono text-emerald-400 font-black px-2 py-0.5 bg-emerald-400/10 rounded-full">{Math.round(currentObject.confidence * 100)}% Match</span>
                      </div>
                      
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h1 className="text-4xl font-black text-white capitalize leading-tight tracking-tight">{currentObject.english}</h1>
                              <button 
                                onClick={(e) => handleSpeak(currentObject.english, e)}
                                className="p-2.5 rounded-2xl bg-white/5 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all shadow-inner"
                              >
                                <SpeakerIcon className="w-6 h-6" />
                              </button>
                            </div>
                            <p className="text-2xl font-thai font-bold text-indigo-300 mt-1 opacity-90">{currentObject.thai}</p>
                            
                            {/* Section: Associated Verbs */}
                            <div className="mt-6 min-h-[40px] flex items-center">
                               {associations ? (
                                  <div className="flex flex-wrap gap-2 animate-fade-in">
                                      <span className="text-[10px] text-emerald-400 font-black tracking-widest mr-2 uppercase bg-emerald-400/10 px-2 py-1 rounded-md font-thai">
                                          กริยาที่ใช้คู่กัน
                                      </span>
                                      {associations.associatedVerbs.slice(0, 3).map((verb, i) => (
                                          <button
                                              key={i}
                                              onClick={(e) => handleSpeak(verb.english, e)}
                                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-indigo-500 transition-all"
                                          >
                                              {verb.english} ({verb.thai})
                                          </button>
                                      ))}
                                  </div>
                               ) : isLoadingAssociations ? (
                                  <div className="flex items-center gap-3">
                                       <div className="flex space-x-1.5">
                                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                       </div>
                                       <span className="text-xs text-slate-500 font-thai font-bold">กำลังดึงข้อมูลอัจฉริยะ...</span>
                                  </div>
                               ) : null}
                            </div>
                         </div>
                         
                         <button 
                          onClick={(e) => { e.stopPropagation(); onSave(currentObject); }}
                          className={`p-4 rounded-3xl transition-all shadow-xl ${
                              isSaved ? 'bg-pink-500 text-white scale-110' : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                         >
                           <BookmarkIcon className="w-8 h-8" filled={isSaved} />
                         </button>
                      </div>

                      <div className="flex gap-3 mt-8">
                          <button
                              onClick={(e) => { e.stopPropagation(); onShowSentences(); }}
                              className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all active:scale-[0.95] shadow-xl"
                          >
                              <BookOpenIcon className="w-6 h-6" />
                              <span className="font-thai">ตัวอย่างบทสนทนา</span>
                          </button>
                          <button
                              onClick={(e) => { e.stopPropagation(); onShowRelated(); }}
                              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all active:scale-[0.95] shadow-xl shadow-indigo-600/20"
                          >
                              <SquaresPlusIcon className="w-6 h-6" />
                              <span className="font-thai">คลังคำศัพท์</span>
                          </button>
                      </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
