
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
    let [ymin, xmin, ymax, xmax] = box;
    // Normalize coordinates if they are 0-1000 from Gemini Vision API
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

  const handleSelection = (idx: number) => {
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
      
      {/* Background Blur Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={images[0]} 
          alt="Background" 
          className="w-full h-full object-cover blur-3xl opacity-30 scale-110"
        />
      </div>

      {/* Close Button Area */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition shadow-lg border border-white/10"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* Main Image View Section - Optimized for overflowing labels */}
      <div className={`relative flex-1 w-full flex flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out ${isMinimized ? 'pb-32' : 'pb-96'} z-10 overflow-hidden`}>
        
        <div className="relative w-full max-w-sm mx-auto shadow-[0_0_100px_rgba(0,0,0,0.6)] bg-slate-900/30 group overflow-visible">
          {/* Apply rounding to the image itself instead of the container to allow overflow */}
          <img 
            src={images[0]} 
            alt="Captured Result" 
            className="block w-full h-auto max-h-[70vh] object-contain transition-all duration-700 rounded-[36px] border-4 border-white/5"
            onError={() => handleImageError(0)}
          />
          
          {/* Bounding Boxes Overlay */}
          {results.map((obj, idx) => (
            <button
              key={idx}
              onClick={() => handleSelection(idx)}
              style={getBoxStyle(obj.box_2d)}
              className={`absolute border-2 transition-all duration-300 rounded-xl ${
                selectedIndex === idx 
                  ? 'border-indigo-400 bg-indigo-500/15 shadow-[0_0_40px_rgba(99,102,241,0.8)] z-[40] ring-2 ring-indigo-400/50 animate-pulse' 
                  : 'border-white/30 hover:border-white/80 z-[30] hover:bg-white/5'
              }`}
            >
              {/* Highlight Label - Positioned with negative top so it can exceed image frame */}
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl whitespace-nowrap transition-all duration-300 flex items-center space-x-2 border ring-4 ring-black/10 ${
                  selectedIndex === idx 
                    ? 'bg-indigo-600 border-indigo-300 text-white opacity-100 scale-110 -translate-y-1 z-[45]' 
                    : 'bg-black/80 border-white/20 text-white/90 opacity-0 group-hover:opacity-100 scale-100 translate-y-0 z-[35]'
              }`}>
                  <span className="font-black text-sm uppercase tracking-tight shadow-sm">{obj.english}</span>
                  <span className="w-px h-3 bg-white/30"></span>
                  <span className="font-mono text-[10px] font-black text-white/80">{Math.round(obj.confidence * 100)}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Control Card (Sticky Bottom) */}
      <div className={`fixed bottom-0 left-0 w-full p-4 z-[55] transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isMinimized ? 'translate-y-[calc(100%-195px)]' : 'translate-y-0'}`}>
        <div 
          onClick={() => isMinimized && setIsMinimized(false)}
          className={`relative bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_-20px_100px_rgba(0,0,0,0.9)] transition-all duration-500 ${isMinimized ? 'h-[105px] pt-4 pb-4 cursor-pointer hover:bg-slate-800 ring-4 ring-indigo-500/20' : 'p-8 pb-24 min-h-[420px]'}`}
        >
          
          {/* Main Handle */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-50 ${isMinimized ? 'top-[-20px]' : '-top-6'}`}>
             <button 
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
               className={`group flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-slate-900 bg-indigo-600 w-12 h-12`}
             >
                {isMinimized ? <ChevronUpIcon className="w-6 h-6 text-white animate-bounce" /> : <ChevronDownIcon className="w-6 h-6 text-white" />}
             </button>
          </div>

          {/* Minimized Quick-View */}
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
                
                <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-lg border border-white/10">
                  <span className="text-xs font-thai font-black uppercase tracking-widest">ขยายดู</span>
                  <SquaresPlusIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="h-20" />
            </div>
          )}

          {/* Expanded Detail View */}
          {!isMinimized && (
            <div className="animate-fade-in-up">
              <div className="flex flex-col">
                
                {/* Selection Chips Area */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[10px] text-indigo-400 font-black tracking-[0.2em] uppercase">Verified Discovery</h2>
                    <span className="text-xs font-mono text-emerald-400 font-black px-2 py-0.5 bg-emerald-400/10 rounded-full">{Math.round(currentObject.confidence * 100)}% Match</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {results.map((obj, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); handleSelection(idx); }}
                        className={`flex-shrink-0 px-4 py-2 rounded-2xl border font-bold text-xs transition-all flex items-center gap-2 active:scale-95 ${
                          selectedIndex === idx 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="capitalize">{obj.english}</span>
                        <span className={`font-thai text-[9px] ${selectedIndex === idx ? 'text-indigo-200' : 'opacity-40'}`}>({obj.thai})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Word Info */}
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
                      
                      {/* Knowledge Base */}
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
                                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-sm"
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
                                 <span className="text-xs text-slate-500 font-thai font-bold">กำลังวิเคราะห์ข้อมูล...</span>
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

                {/* Primary Action Buttons */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={(e) => { e.stopPropagation(); onShowSentences(); }}
                        className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all active:scale-[0.95] shadow-xl hover:bg-slate-50"
                    >
                        <BookOpenIcon className="w-6 h-6" />
                        <span className="font-thai">ฝึกบทสนทนา</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onShowRelated(); }}
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all active:scale-[0.95] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500"
                    >
                        <SquaresPlusIcon className="w-6 h-6" />
                        <span className="font-thai">คลังศัพท์</span>
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
