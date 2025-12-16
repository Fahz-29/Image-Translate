import React, { useState, useRef } from 'react';
import { SavedWord, PronunciationResult } from '../types';
import { analyzePronunciation } from '../services/geminiService';
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
    
    // Safety Refs
    const startTimeRef = useRef<number>(0);
    const stopRequestedRef = useRef<boolean>(false);
    const shouldAnalyzeRef = useRef<boolean>(false);

    const getSentencesPool = (word: SavedWord) => {
        if (word.sentences) {
            return [
                word.sentences.past.en,
                word.sentences.present.en,
                word.sentences.future.en
            ];
        }
        // Varied fallback templates
        return [
            `I see a ${word.english} in the picture.`,
            `The ${word.english} is very beautiful.`,
            `Have you ever seen a giant ${word.english}?`,
            `Please put the ${word.english} on the table.`,
            `Look at that colorful ${word.english} over there.`,
            `I really need to find my ${word.english}.`,
            `Does this ${word.english} belong to you?`
        ];
    };

    const pickRandomSentence = (word: SavedWord, current?: string) => {
        const pool = getSentencesPool(word);
        let next = pool[Math.floor(Math.random() * pool.length)];
        
        // Try to pick a new one if possible
        if (pool.length > 1 && current && next === current) {
            const remaining = pool.filter(s => s !== current);
            if (remaining.length > 0) {
                 next = remaining[Math.floor(Math.random() * remaining.length)];
            }
        }
        return next;
    };

    const handleSelectWord = (word: SavedWord) => {
        setTargetWord(word);
        setTargetSentence(pickRandomSentence(word));
        setStep('RECORD');
        setResult(null);
        setRecordingError(null);
    };

    const handleShuffleSentence = () => {
        if (!targetWord) return;
        setTargetSentence(prev => pickRandomSentence(targetWord, prev));
        setResult(null); 
    };

    const startRecording = async () => {
        setRecordingError(null);
        stopRequestedRef.current = false; // Reset stop flag

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Check if user already released the button while waiting for permission
            if (stopRequestedRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            shouldAnalyzeRef.current = false; // Default to false, enable on valid stop

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Always clean up tracks
                stream.getTracks().forEach(track => track.stop());

                // If marked to skip analysis (e.g. too short), return
                if (!shouldAnalyzeRef.current) {
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                // Double check blob size
                if (audioBlob.size < 500) {
                    setRecordingError("เสียงเบาเกินไป");
                    setIsAnalyzing(false);
                    return;
                }

                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64String = (reader.result as string).split(',')[1];
                    analyzeAudio(base64String);
                };
            };

            mediaRecorder.start();
            startTimeRef.current = Date.now();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone error:", err);
            setRecordingError("ไม่สามารถเข้าถึงไมโครโฟนได้");
        }
    };

    const stopRecording = () => {
        stopRequestedRef.current = true; // Signal that stop was requested

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const duration = Date.now() - startTimeRef.current;
            
            if (duration < 1000) { // Require at least 1 second
                shouldAnalyzeRef.current = false;
                setRecordingError("กดค้างไว้นานกว่านี้เพื่อพูด");
            } else {
                shouldAnalyzeRef.current = true;
                setIsAnalyzing(true);
            }
            
            mediaRecorderRef.current.stop(); // This triggers onstop
            setIsRecording(false);
        }
    };

    const analyzeAudio = async (base64: string) => {
        try {
            const res = await analyzePronunciation(base64, targetSentence);
            setResult(res);
            setStep('RESULT');
        } catch (e) {
            console.error(e);
            setRecordingError("เกิดข้อผิดพลาดในการวิเคราะห์");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSpeak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    // 1. SELECT SCREEN
    if (step === 'SELECT') {
        return (
            <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 px-6">
                 <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white font-thai">เลือกคำศัพท์เพื่อฝึกพูด</h1>
                </div>
                {words.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-slate-500 font-thai">ไม่มีคำศัพท์ที่บันทึกไว้</div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {words.map(w => (
                            <button 
                                key={w.id} 
                                onClick={() => handleSelectWord(w)}
                                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-left hover:bg-indigo-900/20 hover:border-indigo-500/50 transition"
                            >
                                <span className="font-bold text-white block capitalize">{w.english}</span>
                                <span className="text-xs text-slate-400 font-thai">{w.thai}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 2. RECORD / RESULT SCREEN
    return (
        <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('SELECT')} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white font-thai">Accent Coach</h1>
            </div>

            <div className="flex-1 flex flex-col items-center">
                {/* Target Sentence Card */}
                <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 text-center mb-8 shadow-2xl relative">
                    <button 
                        onClick={handleShuffleSentence}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 hover:rotate-180 transition-all duration-500"
                        title="Change Sentence"
                    >
                        <RefreshIcon className="w-4 h-4 text-indigo-200" />
                    </button>

                    <p className="text-sm text-indigo-300 font-bold uppercase mb-2">Read this aloud</p>
                    <h2 className="text-2xl font-bold text-white leading-relaxed">"{targetSentence}"</h2>
                    <button 
                        onClick={() => handleSpeak(targetSentence)}
                        className="mt-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                    >
                        <SpeakerIcon className="w-5 h-5 text-indigo-200" />
                    </button>
                </div>

                {isAnalyzing ? (
                     <div className="text-center space-y-4 mt-8">
                        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-300 font-thai animate-pulse">AI กำลังวิเคราะห์สำเนียง...</p>
                     </div>
                ) : step === 'RECORD' ? (
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <p className="text-slate-400 font-thai mb-8 text-center">กดปุ่มค้างไว้เพื่อพูด แล้วปล่อยเพื่อส่ง</p>
                        
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-200 ${
                                isRecording ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                        >
                            <MicrophoneIcon className="w-12 h-12 text-white" />
                        </button>
                        
                        <div className="mt-8 text-center min-h-[1.5rem]">
                            {isRecording ? (
                                <p className="text-sm text-red-400 animate-pulse font-bold">Recording...</p>
                            ) : recordingError ? (
                                <p className="text-sm text-yellow-400 font-thai">{recordingError}</p>
                            ) : (
                                <p className="text-sm text-slate-500">Hold to Record</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // RESULT VIEW
                    result && (
                        <div className="w-full flex-1 overflow-y-auto animate-fade-in space-y-4">
                            
                            {/* Score & Accent */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center">
                                    <span className="text-xs text-slate-400 uppercase">Score</span>
                                    <div className={`text-4xl font-bold mt-1 ${result.score > 80 ? 'text-green-400' : result.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {result.score}
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-1 mb-1">
                                        <GlobeIcon className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-slate-400 uppercase">Accent</span>
                                    </div>
                                    <div className="text-lg font-bold text-white truncate w-full">
                                        {result.accent}
                                    </div>
                                </div>
                            </div>

                            {/* Feedback */}
                            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
                                <h3 className="font-bold text-white mb-2">AI Feedback</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">{result.feedback}</p>
                            </div>

                            {/* Phonetic */}
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                                <span className="text-xs text-slate-500 block mb-1">What AI heard (Phonetics)</span>
                                <code className="text-indigo-300 text-lg">{result.phonemes}</code>
                            </div>

                            <button 
                                onClick={() => { setRecordingError(null); setStep('RECORD'); }}
                                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg mt-4"
                            >
                                ลองอีกครั้ง
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AccentCoach;