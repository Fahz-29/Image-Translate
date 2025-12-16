import React, { useState } from 'react';
import { SavedWord, QuizQuestion } from '../types';
import { generateBatchGrammarQuiz } from '../services/geminiService';
import { ArrowLeftIcon, CheckBadgeIcon, XMarkIcon, SparklesIcon, HomeIcon, PlusIcon, MinusIcon } from './Icons';

interface GrammarQuizProps {
    words: SavedWord[];
    onBack: () => void;
}

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ words, onBack }) => {
    // Settings State
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [targetTotal, setTargetTotal] = useState(5);

    // Session State
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Current Question State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const startSession = async () => {
        if (words.length === 0) return;

        setIsLoading(true);
        setScore(0);
        setQuestionCount(0);
        setIsFinished(false);
        setQuestions([]);

        try {
            // Select random words
            let chosenWords: string[] = [];
            if (words.length >= targetTotal) {
                // Shuffle and pick unique
                const shuffled = [...words].sort(() => 0.5 - Math.random());
                chosenWords = shuffled.slice(0, targetTotal).map(w => w.english);
            } else {
                // Pick random allowing duplicates to fill up
                for(let i=0; i<targetTotal; i++) {
                     chosenWords.push(words[Math.floor(Math.random() * words.length)].english);
                }
            }

            const quizSet = await generateBatchGrammarQuiz(chosenWords, difficulty);
            setQuestions(quizSet);
            setIsPlaying(true);
        } catch (e) {
            console.error(e);
            alert("ไม่สามารถสร้างแบบทดสอบได้ กรุณาลองใหม่");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (selectedOption !== null) return;
        const currentQ = questions[questionCount];
        setSelectedOption(index);
        
        const correct = index === currentQ.correctIndex;
        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        const nextCount = questionCount + 1;
        
        if (nextCount >= questions.length) {
            setIsFinished(true);
        } else {
            setQuestionCount(nextCount);
            // Reset for next question
            setSelectedOption(null);
            setIsCorrect(null);
        }
    };

    const increaseQuestions = () => {
        setTargetTotal(prev => Math.min(10, prev + 1));
    }

    const decreaseQuestions = () => {
        setTargetTotal(prev => Math.max(5, prev - 1));
    }

    // --- RENDER LOADING SCREEN ---
    if (isLoading) {
        return (
            <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in relative z-50">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                   <SparklesIcon className="w-16 h-16 text-indigo-400 relative z-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Generating Quiz</h3>
                  <p className="text-slate-400 font-thai">กำลังสร้างโจทย์ {targetTotal} ข้อ...</p>
                </div>
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 animate-progress"></div>
                </div>
            </div>
        );
    }

    // --- RENDER START/CONFIG SCREEN ---
    if (!isPlaying && !isFinished) {
        return (
            <div className="h-full w-full bg-slate-900 flex flex-col pt-10 px-6 pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full p-6 z-10">
                     <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 animate-fade-in">
                    <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-3">
                         <SparklesIcon className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-white font-thai">Grammar Challenge</h1>
                        <p className="text-slate-400 font-thai text-sm">ทดสอบความแม่นยำทางไวยากรณ์</p>
                    </div>

                    {/* Settings Area */}
                    <div className="w-full max-w-sm space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        
                        {/* Difficulty Selector */}
                        <div className="space-y-3">
                            <label className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Difficulty Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={`py-2 px-1 rounded-lg text-sm font-bold transition-all border ${
                                            difficulty === level 
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                                            : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Count Selector */}
                        <div className="space-y-3">
                             <label className="text-xs text-indigo-300 uppercase font-bold tracking-wider">Number of Questions</label>
                             <div className="flex items-center justify-center gap-6 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                                 <button 
                                    onClick={decreaseQuestions}
                                    disabled={targetTotal <= 5}
                                    className="p-2 rounded-lg bg-slate-700 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition"
                                 >
                                     <MinusIcon className="w-5 h-5" />
                                 </button>
                                 <span className="text-2xl font-bold text-white w-8 text-center">{targetTotal}</span>
                                 <button 
                                    onClick={increaseQuestions}
                                    disabled={targetTotal >= 10}
                                    className="p-2 rounded-lg bg-slate-700 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-slate-700 transition"
                                 >
                                     <PlusIcon className="w-5 h-5" />
                                 </button>
                             </div>
                        </div>

                    </div>

                    {words.length < 3 ? (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-yellow-200 text-sm font-thai">
                            ⚠️ ควรบันทึกคำศัพท์อย่างน้อย 3 คำก่อนเริ่มเล่น
                        </div>
                    ) : (
                        <button 
                            onClick={startSession}
                            className="w-full max-w-xs py-4 bg-white text-indigo-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-transform font-thai"
                        >
                            เริ่มทดสอบ
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER SUMMARY SCREEN ---
    if (isFinished) {
        return (
            <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative">
                <div className="absolute top-0 left-0 w-full p-6 z-10 text-left">
                     <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <HomeIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full"></div>
                    <div className="relative bg-slate-800 p-8 rounded-full border border-slate-700">
                        <span className="text-5xl font-bold text-white">{score}/{targetTotal}</span>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 font-thai">สรุปคะแนน</h2>
                <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 inline-block mb-6">
                    <span className="text-sm text-indigo-300 uppercase font-bold tracking-wider">{difficulty} Mode</span>
                </div>
                
                <p className="text-slate-400 font-thai mb-10">
                    {score === targetTotal ? "สุดยอด! คุณทำได้เต็มคะแนน" : 
                     score >= Math.floor(targetTotal/2) ? "ทำได้ดีมาก! ฝึกฝนต่อไปนะ" : "พยายามอีกนิดนะ!"}
                </p>

                <div className="w-full max-w-xs space-y-3">
                    <button 
                        onClick={() => { 
                            setIsFinished(false); 
                            setIsPlaying(false); 
                            setQuestions([]); 
                            setSelectedOption(null);
                            setIsCorrect(null);
                        }}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all font-thai"
                    >
                        เล่นอีกครั้ง
                    </button>
                    <button 
                        onClick={onBack}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all font-thai"
                    >
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER PLAYING SCREEN ---
    const currentQuestion = questions[questionCount];
    
    return (
        <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <button onClick={() => { setIsPlaying(false); setQuestions([]); }} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-end">
                    <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 mb-1">
                        <span className="text-xs font-bold text-indigo-400">Question {questionCount + 1}/{questions.length}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{difficulty}</span>
                </div>
            </div>

            {currentQuestion && (
                <div className="flex-1 overflow-y-auto pb-4">
                    {/* Question Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <SparklesIcon className="w-24 h-24" />
                        </div>
                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                            {currentQuestion.type === 'fill_blank' ? 'Fill the Blank' : 'Spot the Error'}
                        </span>
                        <h2 className="text-xl font-bold text-white leading-relaxed">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((opt, idx) => {
                            let itemClass = "bg-slate-800/50 border-slate-700 hover:bg-slate-700";
                            
                            if (selectedOption !== null) {
                                if (idx === currentQuestion.correctIndex) {
                                    itemClass = "bg-green-500/20 border-green-500 text-green-200";
                                } else if (idx === selectedOption && idx !== currentQuestion.correctIndex) {
                                    itemClass = "bg-red-500/20 border-red-500 text-red-200";
                                } else {
                                    itemClass = "bg-slate-800/30 border-slate-800 text-slate-500 opacity-50";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedOption !== null}
                                    className={`w-full p-4 rounded-xl border text-left transition-all font-medium ${itemClass}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{opt}</span>
                                        {selectedOption !== null && idx === currentQuestion.correctIndex && (
                                            <CheckBadgeIcon className="w-6 h-6 text-green-400" />
                                        )}
                                        {selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctIndex && (
                                            <XMarkIcon className="w-6 h-6 text-red-400" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback / Explanation */}
                    {selectedOption !== null && (
                        <div className={`mt-6 p-5 rounded-2xl border animation-fade-in ${isCorrect ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                            <h3 className={`font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {isCorrect ? 'Correct! 🎉' : 'Oops! Incorrect'}
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {currentQuestion.explanation}
                            </p>
                            
                            <button 
                                onClick={handleNext}
                                className="mt-4 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition font-thai"
                            >
                                {questionCount === questions.length - 1 ? "ดูผลคะแนน" : "ข้อต่อไป"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GrammarQuiz;