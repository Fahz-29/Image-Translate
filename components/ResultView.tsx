
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
    const fallbackUrl = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80&sig=${index}&keyword=${encodeURIComponent(currentObject.english)}`;
    newImages[index] = fallbackUrl;
    setImages(newImages);
  };

  const getBoxStyle = (box: number[]) => {
    // Normalizing coordinates from [ymin, xmin, ymax, xmax] (usually 0-1000 in Gemini, or 0-1)
    // We assume coordinates are 0-1000 or 0-1. Let's handle both.
    let [ymin, xmin, ymax, xmax] = box;
    
    // Normalize if they are 0-1000
    if (ymin > 1 || xmin > 1 || ymax > 1 || xmax > 1) {
      ymin /= 1000; xmin /= 1000; ymax /= 1000; xmax /= 1000;
    }

    return {
      top: `${ymin * 100}%`,
      left: `${xmin * 100}%`,
      height: `${(ymax - ymin) * 100}%`,
      width: `${(xmax - xmin) * 100}%`,
    };
  };

  const handleBoxClick = (idx: number) => {
    onSelect(idx);
    if (isMinimized) setIsMinimized(false);
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
      <div className={`relative flex-1 w-full flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${isMinimized ? 'pb-32' : 'pb-80'} z-10`}>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition shadow-lg"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {images.length > 1 ? (
          /* Multi-Image View (Carousel) */
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
          /* Single Image with Interactive Bounding Boxes */
          <div className="relative shadow-2xl rounded-3xl overflow-hidden transition-all duration-700 border-4 border-white/5">
            <img 
              src={images[0]} 
              alt="Captured" 
              className="block max-w-full w-auto h-auto max-h-[55vh] object-contain transition-all duration-700"
              onError={() => handleImageError(0)}
            />
            {/* Draw Bounding Boxes for all results */}
            {results.map((obj, idx) => (
              <button
                key={idx}
                onClick={() => handleBoxClick(idx)}
                style={getBoxStyle(obj.box_2d)}
                className={`absolute border-2 transition-all duration-300 rounded-lg group ${
                  selectedIndex === idx 
                    ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.8)] z-30 ring-2 ring-indigo-400/50 animate-pulse' 
                    : 'border-white/30 hover:border-white/80 z-20 hover:bg-white/5'
                }`}
              >
                {/* Label Tag on Box */}
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full shadow-2xl backdrop-blur-xl whitespace-nowrap transition-all duration-300 flex items-center space-x-2 border ${
                    selectedIndex === idx 
                      ? 'bg-indigo-600 border-indigo-400 text-white opacity-100 scale-100 -translate-y-1' 
                      : 'bg-black/60 border-white/10 text-white/90 opacity-80 scale-90 translate-y-0 group-hover:opacity-100 group-hover:scale-100'
                }`}>
                    <span className="font-black text-xs uppercase tracking-tight">{obj.english}</span>
                    <span className="w-px h-3 bg-white/20"></span>
                    <span className="font-mono text-[9px] font-black text-white/70">{Math.round(obj.confidence * 100)}%</span>
                </div>
                
                {/* Helper corners for unselected */}
                {selectedIndex !== idx && (
                    <div className="absolute inset-0 border border-white/10 rounded-md pointer-events-none opacity-50"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Card Wrapper - Sticky above NavBar */}
      <div className={`fixed bottom-0 left-0 w-full p-4 z-[55] transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isMinimized ? 'translate-y-[calc(100%-195px)]' : 'translate-y-0'}`}>
        <div 
          onClick={() => isMinimized && setIsMinimized(false)}
          className={`relative bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.8)] transition-all duration-500 ${isMinimized ? 'h-[105px] pt-4 pb-4 cursor-pointer hover:bg-slate-800 ring-4 ring-indigo-500/10' : 'p-8 pb-24 min-h-[350px]'}`}
        >
          
          {/* Main Toggle Handle */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-50 ${isMinimized ? 'top-[-20px]' : '-top-6'}`}>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
               className={`group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-slate-900 bg-indigo-600 w-12 h-12`}
             >
                {isMinimized ? <ChevronUpIcon className="w-6 h-6 text-white animate-bounce" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
             </button>
          </div>

          {/* Minimized State UI */}
          {isMinimized && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="flex items-center justify-between px-4 mt-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <BookOpenIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-lg font-black capitalize leading-tight">{currentObject.english}</h3>
                    <p className="text-indigo-400 text-sm font-thai font-bold">{currentObject.thai}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 border border-white/10 active:scale-95 transition-transform">
                  <span className="text-xs font-thai font-black uppercase tracking-widest">แตะเพื่อขยาย</span>
                  <SquaresPlusIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="h-20" /> {/* NavBar Clearance */}
            </div>
          )}

          {/* Expanded State UI */}
          {!isMinimized && (
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
                      
                      {/* Vocabulary Intelligence Section */}
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
                        isSaved ? 'bg-pink-500 text-white scale-110 shadow-pink-500/30' : 'bg-white/5 text-slate-400 hover:text-white'
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
                        <span className="font-thai">บทสนทนา</span>
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
  );
};

export default ResultView;
