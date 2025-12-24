import React, { useState, useRef } from 'react';
import { SavedWord, PronunciationResult } from '../types';
import { analyzePronunciation } from '../services/geminiService';
import { saveAccentResult } from '../services/storageService';
import { ArrowLeftIcon, MicrophoneIcon, SpeakerIcon, GlobeIcon, RefreshIcon } from './Icons';

interface AccentCoachProps {
    words: SavedWord[];
    onBack: () => void;
}

const AccentCoach: React.FC<AccentCoachProps> = ({ words, onBack }) => {
    const [step, setStep] = useState<'SELECT' | 'RECORD' | 'RESULT'>('SELECT');
    const [targetWord, setTargetWord] = useState<SavedWord | null>(null);
    const [targetSentence, setTargetSentence] = useState<string>('');
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<PronunciationResult | null>(null);
    const [recordingError, setRecordingError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const stopRequestedRef = useRef<boolean>(false);
    const shouldAnalyzeRef = useRef<boolean>(false);

    const getSentencesPool = (word: SavedWord) => {
        if (word.sentences) return [word.sentences.past.en, word.sentences.present.en, word.sentences.future.en];
        return [`I see a ${word.english} in the picture.`, `The ${word.english} is very beautiful.`, `Please put the ${word.english} on the table.`];
    };

    const handleSelectWord = (word: SavedWord) => {
        setTargetWord(word);
        setTargetSentence(getSentencesPool(word)[0]);
        setStep('RECORD');
        setResult(null);
        setRecordingError(null);
    };

    const handleShuffleSentence = () => {
        if (!targetWord) return;
        const pool = getSentencesPool(targetWord);
        setTargetSentence(pool[Math.floor(Math.random() * pool.length)]);
        setStep('RECORD');
        setResult(null);
    };

    const startRecording = async () => {
        setRecordingError(null);
        stopRequestedRef.current = false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (stopRequestedRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                if (!shouldAnalyzeRef.current) return;
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size < 500) { setRecordingError("เสียงเบาเกินไป"); setIsAnalyzing(false); return; }
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => analyzeAudio((reader.result as string).split(',')[1]);
            };
            mediaRecorder.start();
            startTimeRef.current = Date.now();
            setIsRecording(true);
        } catch (err) { setRecordingError("ไม่สามารถเข้าถึงไมโครโฟนได้"); }
    };

    const stopRecording = () => {
        stopRequestedRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const duration = Date.now() - startTimeRef.current;
            shouldAnalyzeRef.current = duration >= 1000;
            if (!shouldAnalyzeRef.current) setRecordingError("กดค้างไว้นานกว่านี้เพื่อพูด");
            else setIsAnalyzing(true);
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const analyzeAudio = async (base64: string) => {
        try {
            const res = await analyzePronunciation(base64, targetSentence);
            setResult(res);
            setStep('RESULT');
            if (targetWord) {
                await saveAccentResult(targetWord.id, targetSentence, res);
            }
        } catch (e) { setRecordingError("เกิดข้อผิดพลาดในการวิเคราะห์"); } finally { setIsAnalyzing(false); }
    };

    if (step === 'SELECT') {
        return (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-6 pb-24 px-6 transition-colors">
                 <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white font-thai">เลือกคำศัพท์เพื่อฝึกพูด</h1>
                </div>
                {words.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-slate-500 font-thai">ไม่มีคำศัพท์ที่บันทึกไว้</div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                        {words.map(w => (
                            <button key={w.id} onClick={() => handleSelectWord(w)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:border-indigo-400 transition shadow-sm">
                                <span className="font-bold text-slate-900 dark:text-white block capitalize">{w.english}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-thai">{w.thai}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('SELECT')} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-thai">Accent Coach</h1>
            </div>
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full bg-white dark:bg-gradient-to-br dark:from-indigo-900 dark:to-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-indigo-500/30 text-center mb-8 shadow-xl relative transition-colors">
                    <button onClick={handleShuffleSentence} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:rotate-180 transition-all duration-500"><RefreshIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-200" /></button>
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 font-bold uppercase mb-2">Read this aloud</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">"{targetSentence}"</h2>
                    <button onClick={() => { const u = new SpeechSynthesisUtterance(targetSentence); u.lang = 'en-US'; window.speechSynthesis.speak(u); }} className="mt-4 p-2 bg-indigo-50 dark:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-200 hover:bg-indigo-100 transition"><SpeakerIcon className="w-5 h-5" /></button>
                </div>
                {isAnalyzing ? (
                     <div className="text-center space-y-4 mt-8">
                        <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-600 dark:text-slate-300 font-thai animate-pulse">AI กำลังวิเคราะห์และบันทึกข้อมูล...</p>
                     </div>
                ) : step === 'RECORD' ? (
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <p className="text-slate-500 dark:text-slate-400 font-thai mb-8 text-center">กดปุ่มค้างไว้เพื่อพูด แล้วปล่อยเพื่อส่ง</p>
                        <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${isRecording ? 'bg-red-500 scale-110' : 'bg-indigo-600'}`}>
                            <MicrophoneIcon className="w-12 h-12 text-white" />
                        </button>
                    </div>
                ) : (
                    result && (
                        <div className="w-full flex-1 overflow-y-auto animate-fade-in space-y-4 no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Score</span>
                                    <div className={`text-4xl font-bold mt-1 ${result.score > 80 ? 'text-green-600' : result.score > 50 ? 'text-yellow-600' : 'text-red-600'}`}>{result.score}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm flex flex-col items-center justify-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1"><GlobeIcon className="w-3 h-3"/> Accent</span>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white truncate w-full">{result.accent}</div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">AI Feedback (Saved)</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                            </div>
                            <button onClick={() => setStep('RECORD')} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg mt-4 font-thai">ลองอีกครั้ง</button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AccentCoach;