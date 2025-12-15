import React, { useState, useCallback } from 'react';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import SentencesModal from './components/SentencesModal';
import { CameraIcon, SparklesIcon } from './components/Icons';
import { AppState, DetectedObject, SentenceExamples } from './types';
import { identifyObjects, generateSentences } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // State to hold list of objects found
  const [scanResults, setScanResults] = useState<DetectedObject[]>([]);
  // State to track which object is currently selected by user
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(0);
  
  const [sentences, setSentences] = useState<SentenceExamples | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = () => {
    setAppState(AppState.CAMERA);
    setError(null);
  };

  const handleImageCaptured = useCallback(async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setAppState(AppState.ANALYZING);

    try {
      // 1. Identify Objects (returns array)
      const results = await identifyObjects(imageSrc.split(',')[1]); // remove data:image/jpeg;base64,
      
      if (results.length === 0) {
        throw new Error("No objects found");
      }

      setScanResults(results);
      setSelectedObjectIndex(0); // Default to first object
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถระบุวัตถุได้ ลองใหม่อีกครั้ง");
      setAppState(AppState.HOME);
    }
  }, []);

  const handleShowSentences = useCallback(async () => {
    if (scanResults.length === 0) return;
    
    const currentObject = scanResults[selectedObjectIndex];
    setAppState(AppState.SENTENCES_LOADING);
    
    try {
      // 2. Generate Sentences for the selected object
      const result = await generateSentences(currentObject.english, currentObject.thai);
      setSentences(result);
      setAppState(AppState.SENTENCES_VIEW);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการสร้างประโยค");
      // Go back to result view if failed
      setAppState(AppState.RESULT);
    }
  }, [scanResults, selectedObjectIndex]);

  const resetApp = () => {
    setAppState(AppState.HOME);
    setCapturedImage(null);
    setScanResults([]);
    setSelectedObjectIndex(0);
    setSentences(null);
    setError(null);
  };

  const backToResult = () => {
    setAppState(AppState.RESULT);
  };

  // --- RENDER LOGIC ---

  // 1. Home Screen
  if (appState === AppState.HOME) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-900 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center space-y-8">
          <div className="inline-flex p-4 bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-700">
            <SparklesIcon className="w-12 h-12 text-indigo-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              ThaiSnap Lingo
            </h1>
            <p className="text-slate-400 font-thai text-lg">
              เรียนภาษาอังกฤษจากสิ่งรอบตัว
            </p>
          </div>

          {error && (
             <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm font-thai">
                {error}
             </div>
          )}

          <button
            onClick={startScanning}
            className="group relative w-full max-w-xs flex items-center justify-center space-x-3 bg-white text-slate-900 py-4 px-8 rounded-full font-bold text-lg shadow-lg hover:shadow-indigo-500/20 hover:scale-105 transition-all duration-300"
          >
            <CameraIcon className="w-6 h-6 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span className="font-thai">สแกนคำศัพท์</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Camera View
  if (appState === AppState.CAMERA) {
    return <Camera onCapture={handleImageCaptured} onBack={resetApp} />;
  }

  // 3. Analyzing (Loading Overlay)
  if (appState === AppState.ANALYZING) {
    return (
      <div className="relative h-full w-full bg-slate-900">
        {capturedImage && (
          <img src={capturedImage} alt="analyzing" className="w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-lg font-thai animate-pulse">กำลังวิเคราะห์วัตถุ...</p>
        </div>
      </div>
    );
  }

  // 4. Result View
  if (appState === AppState.RESULT && capturedImage && scanResults.length > 0) {
    return (
      <ResultView 
        imageSrc={capturedImage} 
        results={scanResults}
        selectedIndex={selectedObjectIndex}
        onSelect={setSelectedObjectIndex}
        onClose={resetApp} 
        onShowSentences={handleShowSentences} 
      />
    );
  }

  // 5. Sentences Loading
  if (appState === AppState.SENTENCES_LOADING) {
    return (
       <div className="relative h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
             <SparklesIcon className="w-16 h-16 text-indigo-400 relative z-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Generating Sentences</h3>
            <p className="text-slate-400 font-thai">กำลังแต่งประโยคตัวอย่าง...</p>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 animate-progress"></div>
          </div>
       </div>
    );
  }

  // 6. Sentences View
  if (appState === AppState.SENTENCES_VIEW && sentences && scanResults.length > 0) {
    return (
      <SentencesModal 
        result={scanResults[selectedObjectIndex]} 
        sentences={sentences} 
        onBack={backToResult} 
      />
    );
  }

  return null;
};

export default App;