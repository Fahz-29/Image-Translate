
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Camera from './components/Camera';
import ResultView from './components/ResultView';
import SentencesModal from './components/SentencesModal';
import RelatedWordsModal from './components/RelatedWordsModal';
import NavBar from './components/NavBar';
import SavedList from './components/SavedList';
import Flashcards from './components/Flashcards';
import PracticeHub from './components/PracticeHub';
import SettingsView from './components/SettingsView';
import { CameraIcon, SparklesIcon, PhotoIcon, GlobeIcon, XMarkIcon } from './components/Icons';
import { AppState, DetectedObject, SentenceExamples, Tab, SavedWord, WordAssociations, Language } from './types';
import { identifyObjects, generateSentences, generateRelatedVocabulary, searchAndTranslate } from './services/geminiService';
import { getSavedWords, saveWord, removeWord, isWordSaved } from './services/storageService';

// จัดการ Type สำหรับ AI Studio tools
// FIX: Defined AIStudio interface and updated global Window declaration to match expected platform types and modifiers.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('thaisnap_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('thaisnap_lang');
    return (saved as Language) || 'th';
  });

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DetectedObject[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [sentences, setSentences] = useState<SentenceExamples | null>(null);
  const [relatedWordsCache, setRelatedWordsCache] = useState<Record<string, WordAssociations>>({});
  const [isLoadingAssociations, setIsLoadingAssociations] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isWordsLoading, setIsWordsLoading] = useState(false);
  const [viewingSavedWord, setViewingSavedWord] = useState<SavedWord | null>(null);

  const [manualText, setManualText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWords = async () => {
    setIsWordsLoading(true);
    const words = await getSavedWords();
    setSavedWords(words);
    setIsWordsLoading(false);
  };

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('thaisnap_theme', theme);
  }, [theme]);

  const checkSavedStatus = useCallback(async (word: string) => {
    const saved = await isWordSaved(word);
    setIsSaved(saved);
  }, []);

  useEffect(() => {
    if (scanResults[selectedIndex]) {
        checkSavedStatus(scanResults[selectedIndex].english);
    }
  }, [scanResults, selectedIndex, checkSavedStatus]);

  const handleError = (err: any) => {
    console.error("App Error:", err);
    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      setIsQuotaError(true);
      setErrorMessage("โควตาฟรีของแอปเต็มแล้ว! โปรดเลือกใช้ API Key ส่วนตัวเพื่อใช้งานต่อ");
    } else if (err.message?.includes('entity was not found')) {
      if (window.aistudio?.openSelectKey) {
        window.aistudio.openSelectKey();
      }
    } else {
      setErrorMessage(err.message || "เกิดข้อผิดพลาด");
    }
    setAppState(AppState.HOME);
    setIsTranslating(false);
  };

  const handleSelectPersonalKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsQuotaError(false);
      setErrorMessage(null);
    }
  };

  const handleImageCaptured = useCallback(async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setIsQuotaError(false);
    
    try {
      const base64Data = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
      const results = await identifyObjects(base64Data); 
      
      if (!results || results.length === 0) {
        throw new Error("NO_OBJECTS: ไม่พบวัตถุในภาพนี้");
      }
      
      setScanResults(results);
      setSelectedIndex(0); 
      setSentences(null);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      handleError(err);
    }
  }, []);

  const handleManualTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    
    setIsTranslating(true);
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    setIsQuotaError(false);

    try {
      const [searchResult, relatedRes] = await Promise.all([
        searchAndTranslate(manualText),
        generateRelatedVocabulary(manualText)
      ]);
      
      const sentencesResult = await generateSentences(searchResult.english, searchResult.thai);

      setCapturedImage(searchResult.imageUrls[0]);
      setScanResults([{
        thai: searchResult.thai,
        english: searchResult.english,
        box_2d: [0, 0, 1, 1],
        confidence: 1.0,
        imageUrls: searchResult.imageUrls
      }]);
      
      setRelatedWordsCache(prev => ({ ...prev, [searchResult.english]: relatedRes }));
      setSelectedIndex(0);
      setSentences(sentencesResult);
      setAppState(AppState.RESULT);
      setManualText(''); 
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowSentences = useCallback(async () => {
    if (scanResults.length === 0) return;
    const currentObject = scanResults[selectedIndex];
    if (sentences) { setAppState(AppState.SENTENCES_VIEW); return; }
    
    setAppState(AppState.SENTENCES_LOADING);
    try {
      const result = await generateSentences(currentObject.english, currentObject.thai);
      setSentences(result);
      setAppState(AppState.SENTENCES_VIEW);
    } catch (err: any) {
      handleError(err);
    }
  }, [scanResults, selectedIndex, sentences]);

  const handleLoadAssociationsInline = useCallback(async () => {
    if (scanResults.length === 0) return;
    const currentObject = scanResults[selectedIndex];
    if (relatedWordsCache[currentObject.english]) return;
    setIsLoadingAssociations(true);
    try {
        const result = await generateRelatedVocabulary(currentObject.english);
        setRelatedWordsCache(prev => ({ ...prev, [currentObject.english]: result }));
    } catch (err: any) { console.error(err); } finally { setIsLoadingAssociations(false); }
  }, [scanResults, selectedIndex, relatedWordsCache]);

  useEffect(() => {
    if (appState === AppState.RESULT && scanResults.length > 0) handleLoadAssociationsInline();
  }, [appState, scanResults, selectedIndex, handleLoadAssociationsInline]);

  const handleSaveObject = async (obj: DetectedObject) => {
    const associations = relatedWordsCache[obj.english];
    await saveWord(obj.english, obj.thai, sentences || undefined, associations, obj.imageUrls);
    setIsSaved(true);
    fetchWords();
  };

  const handleTabChange = useCallback((tab: Tab) => {
    setCurrentTab(tab);
    if (tab === Tab.HOME) {
      setAppState(AppState.HOME);
    }
  }, []);

  const renderContent = () => {
    if (currentTab === Tab.SETTINGS) {
        return <SettingsView theme={theme} onThemeChange={setTheme} language={language} onLanguageChange={setLanguage} />;
    }

    if (currentTab === Tab.SAVED) {
      if (viewingSavedWord) {
         return (
             <SentencesModal 
                result={{ 
                  english: viewingSavedWord.english, 
                  thai: viewingSavedWord.thai, 
                  confidence: 1, 
                  box_2d: [0,0,0,0], 
                  imageUrls: viewingSavedWord.imageUrls 
                }}
                sentences={viewingSavedWord.sentences || null}
                onBack={() => setViewingSavedWord(null)}
                onSave={() => {}} 
                isSaved={true}
             />
         );
      }
      return <SavedList words={savedWords} onDelete={id => { removeWord(id); fetchWords(); }} onSelectWord={setViewingSavedWord} />;
    }

    if (currentTab === Tab.FLASHCARDS) return <Flashcards words={savedWords} />;
    if (currentTab === Tab.PRACTICE) return <PracticeHub words={savedWords} />;

    if (appState === AppState.CAMERA) return <Camera onCapture={handleImageCaptured} onBack={() => setAppState(AppState.HOME)} />;

    if (appState === AppState.ANALYZING) {
      return (
        <div className="relative h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-white text-xl font-bold font-thai animate-pulse">กำลังประมวลผลข้อมูลอัจฉริยะ...</p>
        </div>
      );
    }

    if (appState === AppState.RESULT && scanResults.length > 0) {
      return (
        <ResultView 
          imageSrc={capturedImage || ''} 
          results={scanResults} 
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex} 
          onClose={() => setAppState(AppState.HOME)} 
          onShowSentences={handleShowSentences}
          onShowRelated={() => setAppState(AppState.RELATED_VIEW)}
          onSave={handleSaveObject}
          isSaved={isSaved}
          associations={relatedWordsCache[scanResults[selectedIndex].english]}
          onLoadAssociations={handleLoadAssociationsInline}
          isLoadingAssociations={isLoadingAssociations}
        />
      );
    }

    if (appState === AppState.SENTENCES_VIEW && sentences && scanResults.length > 0) {
        return (
          <SentencesModal 
            result={scanResults[selectedIndex]} sentences={sentences} 
            onBack={() => setAppState(AppState.RESULT)}
            onSave={() => handleSaveObject(scanResults[selectedIndex])}
            isSaved={isSaved}
          />
        );
    }

    if (appState === AppState.RELATED_VIEW && scanResults.length > 0) {
        const currentObj = scanResults[selectedIndex];
        const associations = relatedWordsCache[currentObj.english];
        return (
            <RelatedWordsModal
                originalObject={currentObj}
                associations={associations!}
                onBack={() => setAppState(AppState.RESULT)}
                onSaveWord={async (en, th) => { await saveWord(en, th); fetchWords(); }}
                savedStatus={Object.fromEntries(savedWords.map(w => [w.english.toLowerCase(), true]))}
            />
        );
    }

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 relative overflow-hidden pb-32 transition-colors duration-500">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-600 rounded-full filter blur-3xl opacity-10 dark:opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-10 dark:opacity-20 animate-blob animation-delay-2000"></div>

        {errorMessage && (
          <div className="absolute top-10 left-6 right-6 z-50">
             <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-3">
                <div className="flex w-full items-center justify-between">
                   <p className="text-sm font-bold font-thai">{errorMessage}</p>
                   <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full"><XMarkIcon className="w-4 h-4" /></button>
                </div>
                {isQuotaError && (
                  <button 
                    onClick={handleSelectPersonalKey}
                    className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg font-thai"
                  >
                     คลิกเพื่อใช้ API Key ของตัวเอง
                  </button>
                )}
             </div>
          </div>
        )}

        <div className="relative z-10 text-center space-y-8 w-full max-w-sm">
          <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mx-auto border border-slate-100 dark:border-slate-700">
            <SparklesIcon className="w-12 h-12 text-indigo-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">ThaiSnap Lingo</h1>
            <p className="text-slate-500 dark:text-slate-400 font-thai font-medium opacity-80">ค้นหาความหมายจากภาพและคำศัพท์</p>
          </div>

          <form onSubmit={handleManualTranslate} className="w-full relative group">
              <input 
                type="text" 
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={language === 'th' ? "เช่น 'ท้องฟ้า' หรือ 'Sky'..." : "Search anything..."}
                className="w-full pl-6 pr-14 py-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-thai text-lg"
                disabled={isTranslating}
              />
              <button 
                type="submit"
                disabled={isTranslating}
                className="absolute right-2 top-2 p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition shadow-lg disabled:opacity-50"
              >
                {isTranslating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <GlobeIcon className="w-6 h-6" />}
              </button>
          </form>

          <div className="flex items-center gap-4 w-full pt-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => handleImageCaptured(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <button
                onClick={() => setAppState(AppState.CAMERA)}
                className="group flex-1 flex items-center justify-center space-x-3 bg-indigo-600 text-white py-5 px-6 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                <CameraIcon className="w-7 h-7" />
                <span className="font-thai">สแกนจากกล้อง</span>
            </button>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-slate-800 text-slate-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:bg-slate-50 transition-all"
            >
                <PhotoIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 transition-colors">
      {renderContent()}
      {(appState === AppState.HOME || currentTab !== Tab.HOME || appState === AppState.RESULT) && (
        <NavBar currentTab={currentTab} onTabChange={handleTabChange} language={language} />
      )}
    </div>
  );
};

export default App;
