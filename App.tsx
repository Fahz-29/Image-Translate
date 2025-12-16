import React, { useState, useCallback, useEffect } from 'react';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import SentencesModal from './components/SentencesModal';
import NavBar from './components/NavBar';
import SavedList from './components/SavedList';
import Flashcards from './components/Flashcards';
import PracticeHub from './components/PracticeHub';
import { CameraIcon, SparklesIcon } from './components/Icons';
import { AppState, DetectedObject, SentenceExamples, Tab, SavedWord } from './types';
import { identifyObjects, generateSentences } from './services/geminiService';
import { getSavedWords, saveWord, removeWord, isWordSaved } from './services/storageService';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  
  // Camera & Detection
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DetectedObject[]>([]);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number>(0);
  const [sentences, setSentences] = useState<SentenceExamples | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Saved Data State
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  // State for viewing a saved word in detail (reuse SentencesModal logic)
  const [viewingSavedWord, setViewingSavedWord] = useState<SavedWord | null>(null);

  // Load saved words on mount
  useEffect(() => {
    setSavedWords(getSavedWords());
  }, []);

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    // Remove automatic state reset to persist Home state
    if (tab !== Tab.SAVED) {
      setViewingSavedWord(null);
    }
  };

  const startScanning = () => {
    setAppState(AppState.CAMERA);
    setError(null);
  };

  const handleImageCaptured = useCallback(async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setAppState(AppState.ANALYZING);

    try {
      const results = await identifyObjects(imageSrc.split(',')[1]); 
      
      if (results.length === 0) {
        throw new Error("No objects found");
      }

      setScanResults(results);
      setSelectedObjectIndex(0); 
      setSentences(null); // Reset sentences from previous scan
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
      const result = await generateSentences(currentObject.english, currentObject.thai);
      setSentences(result);
      setAppState(AppState.SENTENCES_VIEW);
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการสร้างประโยค");
      setAppState(AppState.RESULT);
    }
  }, [scanResults, selectedObjectIndex]);

  const handleSaveObject = (obj: DetectedObject) => {
    // Save current object, pass sentences if they exist in state
    saveWord(obj.english, obj.thai, sentences || undefined);
    setSavedWords(getSavedWords()); // Refresh list
  };

  const handleSaveSentences = () => {
    // Save/Update from Sentence Modal
    const currentObject = scanResults[selectedObjectIndex];
    if (currentObject && sentences) {
       saveWord(currentObject.english, currentObject.thai, sentences);
       setSavedWords(getSavedWords());
    }
  };

  const handleDeleteWord = (id: string) => {
    const updated = removeWord(id);
    setSavedWords(updated);
    if (viewingSavedWord?.id === id) {
        setViewingSavedWord(null);
    }
  };

  const handleGenerateSentencesForSaved = async () => {
      if (!viewingSavedWord) return;

      try {
          const sentences = await generateSentences(viewingSavedWord.english, viewingSavedWord.thai);
          
          // Save immediately
          saveWord(viewingSavedWord.english, viewingSavedWord.thai, sentences);
          
          // Update local states
          const updatedWords = getSavedWords();
          setSavedWords(updatedWords);
          
          // Update the currently viewed word to show new sentences
          const updatedWord = updatedWords.find(w => w.id === viewingSavedWord.id);
          if (updatedWord) {
              setViewingSavedWord(updatedWord);
          }
      } catch (err) {
          console.error("Failed to generate", err);
          alert("ไม่สามารถสร้างประโยคได้ กรุณาลองใหม่");
      }
  };

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

  // --- RENDER LOGIC BY TAB ---

  const renderContent = () => {
    // 1. SAVED TAB
    if (currentTab === Tab.SAVED) {
      // If viewing details of a saved word
      if (viewingSavedWord) {
         // Create a mock DetectedObject for the modal
         const mockResult: DetectedObject = {
             english: viewingSavedWord.english,
             thai: viewingSavedWord.thai,
             confidence: 1,
             box_2d: [0,0,0,0]
         };

         return (
             <SentencesModal 
                result={mockResult}
                sentences={viewingSavedWord.sentences || null}
                onBack={() => setViewingSavedWord(null)}
                onSave={() => {}} // Already saved
                isSaved={true}
                onGenerate={!viewingSavedWord.sentences ? handleGenerateSentencesForSaved : undefined}
             />
         );
      }

      return <SavedList words={savedWords} onDelete={handleDeleteWord} onSelectWord={setViewingSavedWord} />;
    }

    // 2. FLASHCARDS TAB
    if (currentTab === Tab.FLASHCARDS) {
      return <Flashcards words={savedWords} />;
    }

    // 3. PRACTICE TAB
    if (currentTab === Tab.PRACTICE) {
      return <PracticeHub words={savedWords} />;
    }

    // 4. HOME TAB (Scanning Flow)
    // 4.1 Camera View
    if (appState === AppState.CAMERA) {
      return <Camera onCapture={handleImageCaptured} onBack={resetApp} />;
    }

    // 4.2 Analyzing
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

    // 4.3 Result View
    if (appState === AppState.RESULT && capturedImage && scanResults.length > 0) {
      const currentObj = scanResults[selectedObjectIndex];
      const isSaved = isWordSaved(currentObj.english);
      
      return (
        <ResultView 
          imageSrc={capturedImage} 
          results={scanResults}
          selectedIndex={selectedObjectIndex}
          onSelect={setSelectedObjectIndex}
          onClose={resetApp} 
          onShowSentences={handleShowSentences}
          onSave={handleSaveObject}
          isSaved={isSaved}
        />
      );
    }

    // 4.4 Sentences Loading
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

    // 4.5 Sentences View
    if (appState === AppState.SENTENCES_VIEW && sentences && scanResults.length > 0) {
      const currentObj = scanResults[selectedObjectIndex];
      const isSaved = isWordSaved(currentObj.english);

      return (
        <SentencesModal 
          result={currentObj} 
          sentences={sentences} 
          onBack={backToResult}
          onSave={handleSaveSentences}
          isSaved={isSaved}
        />
      );
    }

    // 4.6 Default Home Screen
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-900 relative overflow-hidden pb-24">
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
  };

  return (
    <div className="h-full w-full bg-slate-900 text-white relative">
      {renderContent()}
      
      {/* Hide NavBar if in Camera mode or full screen modals to avoid clutter */}
      {appState !== AppState.CAMERA && appState !== AppState.SENTENCES_VIEW && !viewingSavedWord && (
        <NavBar currentTab={currentTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
};

export default App;