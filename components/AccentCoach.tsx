import React, { useState, useRef } from 'react';
import { SavedWord, PronunciationResult } from '../types';
import { analyzePronunciation } from '../services/geminiService';
import { ArrowLeftIcon, MicrophoneIcon, SpeakerIcon, GlobeIcon } from './Icons';

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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleSelectWord = (word: SavedWord) => {
        setTargetWord(word);
        // Prefer present tense sentence if available, otherwise just use the word
        const sentence = word.sentences?.present.en || `I like the ${word.english}.`;
        setTargetSentence(sentence);
        setStep('RECORD');
        setResult(null);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Convert to base64
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64String = (reader.result as string).split(',')[1];
                    analyzeAudio(base64String);
                };
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone error:", err);
            alert("ไม่สามารถเข้าถึงไมโครโฟนได้");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsAnalyzing(true);
        }
    };

    const analyzeAudio = async (base64: string) => {
        try {
            const res = await analyzePronunciation(base64, targetSentence);
            setResult(res);
            setStep('RESULT');
        } catch (e) {
            console.error(e);
            alert("เกิดข้อผิดพลาดในการวิเคราะห์");
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
                <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 text-center mb-8 shadow-2xl">
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
                        
                        <p className="mt-8 text-sm text-slate-500">{isRecording ? "Recording..." : "Hold to Record"}</p>
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
                                onClick={() => setStep('RECORD')}
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