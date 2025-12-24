
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
import { CameraIcon, SparklesIcon, PhotoIcon, GlobeIcon, XMarkIcon, CheckBadgeIcon } from './components/Icons';
import { AppState, DetectedObject, SentenceExamples, Tab, SavedWord, WordAssociations, Language } from './types';
import { identifyObjects, generateSentences, generateRelatedVocabulary, translateQuick, getRelatedImage } from './services/geminiService';
import { getSavedWords, saveWord, removeWord, isWordSaved } from './services/storageService';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('thaisnap_lingo_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('thaisnap_lingo_lang');
    return (saved as Language) || 'th';
  });

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DetectedObject[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [sentences, setSentences] = useState<SentenceExamples | null>(null);
  const [relatedWordsCache, setRelatedWordsCache] = useState<Record<string, WordAssociations>>({});
  const [isLoadingAssociations, setIsLoadingAssociations] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('กำลังประมวลผล...');
  
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
    localStorage.setItem('thaisnap_lingo_theme', theme);
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
      setErrorMessage("โควตาเต็ม! โปรดใช้ Key ส่วนตัว");
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
    setLoadingStatus('กำลังวิเคราะห์วัตถุในภาพ...');
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const base64Data = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
      const results = await identifyObjects(base64Data); 
      
      if (!results || results.length === 0) {
        throw new Error("NO_OBJECTS: ไม่พบวัตถุ");
      }
      
      setScanResults(results);
      setSelectedIndex(0); 
      setSentences(null);
      setAppState(AppState.RESULT);

      // Background load details
      loadObjectDetailsInBackground(results[0].english, results[0].thai);
    } catch (err: any) {
      handleError(err);
    }
  }, []);

  const loadObjectDetailsInBackground = async (en: string, th: string) => {
    try {
      const [sentenceRes, vocabRes] = await Promise.all([
        generateSentences(en, th),
        generateRelatedVocabulary(en)
      ]);
      setSentences(sentenceRes);
      setRelatedWordsCache(prev => ({ ...prev, [en]: vocabRes }));
    } catch (e) {
      console.warn("Background load failed", e);
    }
  };

  const handleManualTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    
    setIsTranslating(true);
    setAppState(AppState.ANALYZING);
    setLoadingStatus('กำลังหาความหมาย...');
    setErrorMessage(null);

    try {
      // 1. Get Translation FAST (Stage 1)
      const trans = await translateQuick(manualText);

      // 2. Set intermediate state and show ResultView immediately
      setScanResults([{
        thai: trans.thai,
        english: trans.english,
        box_2d: [0, 0, 1, 1],
        confidence: 1.0,
        imageUrls: [] 
      }]);
      setSelectedIndex(0);
      setSentences(null);
      setAppState(AppState.RESULT);
      setManualText(''); 
      setIsTranslating(false);

      // 3. Load Extra Data in Background (Stage 2)
      // Fetch Image first as it's visual
      getRelatedImage(trans.english).then(img => {
          setCapturedImage(img);
          setScanResults(prev => [{ ...prev[0], imageUrls: [img] }]);
      });
      
      // Fetch Sentences and Vocab
      loadObjectDetailsInBackground(trans.english, trans.thai);

    } catch (err: any) {
      handleError(err);
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

  const handleSaveObject = async (obj: DetectedObject) => {
    const associations = relatedWordsCache[obj.english];
    const { data, error, schemaIncomplete } = await saveWord(obj.english, obj.thai, sentences || undefined, associations, obj.imageUrls);
    
    if (data) {
        setIsSaved(true);
        await fetchWords();
        if (!schemaIncomplete) {
          setSuccessMessage("บันทึกแล้ว!");
          setTimeout(() => setSuccessMessage(null), 1500);
        }
    } else if (error) {
        setErrorMessage(error);
    }
  };

  const handleTabChange = useCallback((tab: Tab) => {
    setCurrentTab(tab);
    if (tab === Tab.HOME) setAppState(AppState.HOME);
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
      return <SavedList words={savedWords} onDelete={async id => { await removeWord(id); fetchWords(); }} onSelectWord={setViewingSavedWord} />;
    }

    if (currentTab === Tab.FLASHCARDS) return <Flashcards words={savedWords} />;
    if (currentTab === Tab.PRACTICE) return <PracticeHub words={savedWords} />;

    if (appState === AppState.CAMERA) return <Camera onCapture={handleImageCaptured} onBack={() => setAppState(AppState.HOME)} />;

    if (appState === AppState.ANALYZING) {
      return (
        <div className="relative h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
            <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full" />
                <div className="absolute top-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-3">
                <p className="text-white text-2xl font-black font-thai animate-pulse">{loadingStatus}</p>
                <p className="text-slate-500 text-sm font-thai">กำลังเรียกใช้พลังของ Gemini 3...</p>
            </div>
        </div>
      );
    }

    if (appState === AppState.RESULT && scanResults.length > 0) {
      return (
        <ResultView 
          imageSrc={capturedImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'} 
          results={scanResults} 
          selectedIndex={selectedIndex}
          onSelect={(idx) => {
            setSelectedIndex(idx);
            setSentences(null);
            loadObjectDetailsInBackground(scanResults[idx].english, scanResults[idx].thai);
          }} 
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
                onSaveWord={async (en, th) => { const { data } = await saveWord(en, th); if (data) fetchWords(); }}
                savedStatus={Object.fromEntries(savedWords.map(w => [w.english.toLowerCase(), true]))}
            />
        );
    }

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 relative overflow-hidden pb-32">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-600 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center space-y-8 w-full max-w-sm">
          <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <SparklesIcon className="w-12 h-12 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">ThaiSnap Lingo</h1>
            <p className="text-slate-500 dark:text-slate-400 font-thai font-medium">รวดเร็วทันใจด้วย AI รุ่นล่าสุด</p>
          </div>

          <form onSubmit={handleManualTranslate} className="w-full relative group">
              <input 
                type="text" 
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={language === 'th' ? "เช่น 'ท้องฟ้า'..." : "Search..."}
                className="w-full pl-6 pr-14 py-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl focus:ring-4 focus:ring-indigo-500/20 font-thai text-lg"
                disabled={isTranslating}
              />
              <button 
                type="submit"
                disabled={isTranslating}
                className="absolute right-2 top-2 p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition shadow-lg"
              >
                {isTranslating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <GlobeIcon className="w-6 h-6" />}
              </button>
          </form>

          <div className="flex items-center gap-4 w-full">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => handleImageCaptured(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <button onClick={() => setAppState(AppState.CAMERA)} className="flex-1 flex items-center justify-center space-x-3 bg-indigo-600 text-white py-5 px-6 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95">
                <CameraIcon className="w-7 h-7" />
                <span className="font-thai">กล้องสแกน</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-slate-800 text-slate-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg transition-all hover:bg-slate-50">
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
