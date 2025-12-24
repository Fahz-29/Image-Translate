
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
import { identifyObjects, generateSentences, generateRelatedVocabulary } from './services/geminiService';
import { getSavedWords, saveWord, removeWord, isWordSaved } from './services/storageService';

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
  const [isSaved, setIsSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [isWordsLoading, setIsWordsLoading] = useState(false);
  const [viewingSavedWord, setViewingSavedWord] = useState<SavedWord | null>(null);

  // Manual Translation State
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

  useEffect(() => {
    localStorage.setItem('thaisnap_lang', language);
  }, [language]);

  const checkSavedStatus = useCallback(async (word: string) => {
    const saved = await isWordSaved(word);
    setIsSaved(saved);
  }, []);

  useEffect(() => {
    if (scanResults[selectedIndex]) {
        checkSavedStatus(scanResults[selectedIndex].english);
    }
  }, [scanResults, selectedIndex, checkSavedStatus]);

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    if (tab !== Tab.SAVED) setViewingSavedWord(null);
    if (tab === Tab.SAVED || tab === Tab.FLASHCARDS || tab === Tab.PRACTICE) fetchWords();
  };

  const handleImageCaptured = useCallback(async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setAppState(AppState.ANALYZING);
    setErrorMessage(null);
    
    try {
      const base64Data = imageSrc.includes(',') ? imageSrc.split(',')[1] : imageSrc;
      const results = await identifyObjects(base64Data); 
      
      if (!results || results.length === 0) {
        throw new Error("NO_OBJECTS: ไม่พบวัตถุในภาพนี้ ลองถ่ายใหม่ให้ชัดเจนขึ้น");
      }
      
      setScanResults(results);
      setSelectedIndex(0); 
      setSentences(null);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error("App identification error:", err);
      let msg = err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      
      if (msg.includes('API_KEY_MISSING')) {
        msg = language === 'th' ? "ยังไม่ได้ตั้งค่า API Key ใน Vercel Dashboard" : "API Key is missing in Vercel settings.";
      } else if (msg.includes('403') || msg.includes('401')) {
        msg = language === 'th' ? "API Key ไม่ถูกต้อง หรือไม่มีสิทธิ์ใช้งาน Model นี้" : "Invalid API Key or no permission for this model.";
      } else if (msg.includes('Model not found')) {
        msg = "ไม่พบ Model ที่ระบุ โปรดตรวจสอบชื่อ Model ในโค้ด";
      }

      setErrorMessage(msg);
      setAppState(AppState.HOME);
    }
  }, [language]);

  const handleManualTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    
    setIsTranslating(true);
    setAppState(AppState.ANALYZING);
    try {
      const result = await generateSentences(manualText, manualText); 
      setScanResults([{
        thai: manualText,
        english: manualText,
        box_2d: [0, 0, 1, 1],
        confidence: 1.0
      }]);
      setSelectedIndex(0);
      setSentences(result);
      setCapturedImage(null);
      setAppState(AppState.RESULT);
    } catch (err) {
      setErrorMessage(language === 'th' ? "เกิดข้อผิดพลาดในการแปล" : "Translation error.");
      setAppState(AppState.HOME);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShowSentences = useCallback(async () => {
    if (scanResults.length === 0) return;
    const currentObject = scanResults[selectedIndex];
    setAppState(AppState.SENTENCES_LOADING);
    try {
      const result = await generateSentences(currentObject.english, currentObject.thai);
      setSentences(result);
      setAppState(AppState.SENTENCES_VIEW);
    } catch (err) {
      setErrorMessage(language === 'th' ? "เกิดข้อผิดพลาดในการสร้างประโยค" : "Error generating sentences.");
      setAppState(AppState.RESULT);
    }
  }, [scanResults, selectedIndex, language]);

  const handleLoadAssociationsInline = useCallback(async () => {
    if (scanResults.length === 0) return;
    const currentObject = scanResults[selectedIndex];
    if (relatedWordsCache[currentObject.english]) return;
    setIsLoadingAssociations(true);
    try {
        const result = await generateRelatedVocabulary(currentObject.english);
        setRelatedWordsCache(prev => ({ ...prev, [currentObject.english]: result }));
    } catch (err) { console.error(err); } finally { setIsLoadingAssociations(false); }
  }, [scanResults, selectedIndex, relatedWordsCache]);

  useEffect(() => {
    if (appState === AppState.RESULT && scanResults.length > 0) handleLoadAssociationsInline();
  }, [appState, scanResults, selectedIndex, handleLoadAssociationsInline]);

  const handleSaveObject = async (obj: DetectedObject) => {
    const associations = relatedWordsCache[obj.english];
    await saveWord(obj.english, obj.thai, sentences || undefined, associations);
    setIsSaved(true);
    fetchWords();
  };

  const handleRemoveWord = async (id: string) => {
    await removeWord(id);
    fetchWords();
    if (viewingSavedWord?.id === id) setViewingSavedWord(null);
  };

  const renderContent = () => {
    if (currentTab === Tab.SETTINGS) {
        return <SettingsView theme={theme} onThemeChange={setTheme} language={language} onLanguageChange={setLanguage} />;
    }

    if (currentTab === Tab.SAVED) {
      if (viewingSavedWord) {
         return (
             <SentencesModal 
                result={{ english: viewingSavedWord.english, thai: viewingSavedWord.thai, confidence: 1, box_2d: [0,0,0,0] }}
                sentences={viewingSavedWord.sentences || null}
                onBack={() => setViewingSavedWord(null)}
                onSave={() => {}} 
                isSaved={true}
             />
         );
      }
      return <SavedList words={savedWords} onDelete={handleRemoveWord} onSelectWord={setViewingSavedWord} />;
    }

    if (currentTab === Tab.FLASHCARDS) return <Flashcards words={savedWords} />;
    if (currentTab === Tab.PRACTICE) return <PracticeHub words={savedWords} />;

    if (appState === AppState.CAMERA) return <Camera onCapture={handleImageCaptured} onBack={() => setAppState(AppState.HOME)} />;

    if (appState === AppState.ANALYZING) {
      return (
        <div className="relative h-full w-full bg-slate-900">
          {capturedImage && <img src={capturedImage} alt="analyzing" className="w-full h-full object-cover opacity-30" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className={`text-white text-xl font-bold animate-pulse ${language === 'th' ? 'font-thai' : ''}`}>
              {language === 'th' ? 'กำลังส่งข้อมูลไปที่ Gemini AI...' : 'Analyzing with Gemini AI...'}
            </p>
            <p className="text-slate-400 text-sm mt-2 font-thai opacity-60">รอสักครู่ ระบบกำลังประมวลผล</p>
          </div>
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
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 -right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-20 animate-blob animation-delay-2000"></div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="absolute top-10 left-6 right-6 z-50 animate-bounce-short">
             <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-red-400">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/20 rounded-full">
                      <XMarkIcon className="w-5 h-5" />
                   </div>
                   <p className="text-sm font-bold font-thai">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-white/10 rounded-full transition">
                   <XMarkIcon className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}

        <div className="relative z-10 text-center space-y-8 w-full max-w-sm">
          <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 mx-auto">
            <SparklesIcon className="w-12 h-12 text-indigo-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-300 dark:to-purple-300">ThaiSnap Lingo</h1>
            <p className={`text-slate-500 dark:text-slate-400 text-lg ${language === 'th' ? 'font-thai' : ''}`}>
              {language === 'th' ? 'เรียนภาษาอังกฤษจากสิ่งรอบตัว' : 'Learn English from your surroundings'}
            </p>
          </div>

          {/* Manual Translation Input */}
          <form onSubmit={handleManualTranslate} className="w-full relative group">
              <input 
                type="text" 
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={language === 'th' ? "พิมพ์คำศัพท์ที่ต้องการแปล..." : "Type a word to translate..."}
                className="w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-thai text-slate-900 dark:text-white"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition shadow-md"
              >
                <GlobeIcon className="w-5 h-5" />
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
            <button
                onClick={() => setAppState(AppState.CAMERA)}
                className="group flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300"
            >
                <CameraIcon className="w-6 h-6" />
                <span className={language === 'th' ? 'font-thai' : ''}>{language === 'th' ? 'สแกนเลย' : 'Scan'}</span>
            </button>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg active:scale-95 transition-all"
            >
                <PhotoIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-500`}>
      {renderContent()}
      {(appState === AppState.HOME || currentTab !== Tab.HOME || appState === AppState.RESULT) && (
        <NavBar currentTab={currentTab} onTabChange={handleTabChange} language={language} />
      )}
    </div>
  );
};

export default App;
