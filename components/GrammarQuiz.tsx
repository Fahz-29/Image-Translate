import React, { useState } from 'react';
import { SavedWord, QuizQuestion } from '../types';
import { generateBatchGrammarQuiz } from '../services/geminiService';
import { savePracticeResult } from '../services/storageService';
import { ArrowLeftIcon, CheckBadgeIcon, XMarkIcon, SparklesIcon, HomeIcon, PlusIcon, MinusIcon } from './Icons';

interface GrammarQuizProps {
    words: SavedWord[];
    onBack: () => void;
}

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ words, onBack }) => {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [targetTotal, setTargetTotal] = useState(5);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
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
            let chosenWords: string[] = [];
            const shuffled = [...words].sort(() => 0.5 - Math.random());
            chosenWords = shuffled.slice(0, targetTotal).map(w => w.english);
            const quizSet = await generateBatchGrammarQuiz(chosenWords, difficulty);
            setQuestions(quizSet);
            setIsPlaying(true);
        } catch (e) {
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
        if (correct) setScore(prev => prev + 1);
    };

    const handleNext = async () => {
        const nextCount = questionCount + 1;
        if (nextCount >= questions.length) {
            setIsFinished(true);
            await savePracticeResult(score + (isCorrect ? 1 : 0), targetTotal, difficulty);
        } else {
            setQuestionCount(nextCount);
            setSelectedOption(null);
            setIsCorrect(null);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in transition-colors">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                   <SparklesIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400 relative z-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Generating Quiz</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-thai">กำลังสร้างโจทย์ {targetTotal} ข้อ...</p>
                </div>
                <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600 animate-progress"></div>
                </div>
            </div>
        );
    }

    if (!isPlaying && !isFinished) {
        return (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 px-6 pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full p-6 z-10">
                     <button onClick={onBack} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 animate-fade-in">
                    <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-3">
                         <SparklesIcon className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-thai">Grammar Challenge</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-thai text-sm">ทดสอบความแม่นยำทางไวยากรณ์</p>
                    </div>
                    <div className="w-full max-w-sm space-y-6 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="space-y-3">
                            <label className="text-xs text-indigo-600 dark:text-indigo-300 uppercase font-bold tracking-wider">Difficulty Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                                    <button key={level} onClick={() => setDifficulty(level)} className={`py-2 px-1 rounded-lg text-sm font-bold transition-all border ${difficulty === level ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>{level}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-xs text-indigo-600 dark:text-indigo-300 uppercase font-bold tracking-wider">Number of Questions</label>
                             <div className="flex items-center justify-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                 <button onClick={() => setTargetTotal(p => Math.max(3, p-1))} disabled={targetTotal <= 3} className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-indigo-600 hover:text-white transition shadow-sm"><MinusIcon className="w-5 h-5" /></button>
                                 <span className="text-2xl font-bold text-slate-900 dark:text-white w-8 text-center">{targetTotal}</span>
                                 <button onClick={() => setTargetTotal(p => Math.min(10, p+1))} disabled={targetTotal >= 10} className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-indigo-600 hover:text-white transition shadow-sm"><PlusIcon className="w-5 h-5" /></button>
                             </div>
                        </div>
                    </div>
                    <button onClick={startSession} className="w-full max-w-xs py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-xl hover:scale-105 transition-transform font-thai">เริ่มทดสอบ</button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in transition-colors">
                <div className="absolute top-0 left-0 w-full p-6 text-left">
                     <button onClick={onBack} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><HomeIcon className="w-6 h-6" /></button>
                </div>
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 rounded-full"></div>
                    <div className="relative bg-white dark:bg-slate-800 p-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl">
                        <span className="text-5xl font-bold text-slate-900 dark:text-white">{score}/{targetTotal}</span>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-thai">สรุปคะแนน</h2>
                <div className="bg-indigo-100 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-indigo-200 dark:border-slate-700 inline-block mb-6">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300 uppercase font-bold tracking-wider">{difficulty} Mode</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-thai mb-10">บันทึกคะแนนลงฐานข้อมูลแล้ว!</p>
                <div className="w-full max-w-xs space-y-3">
                    <button onClick={startSession} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition-all font-thai">เล่นอีกครั้ง</button>
                    <button onClick={onBack} className="w-full py-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition-all font-thai shadow-sm">กลับหน้าหลัก</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[questionCount];
    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative transition-colors">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <button onClick={() => setIsPlaying(false)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Question {questionCount + 1}/{questions.length}</span>
                </div>
            </div>
            {currentQuestion && (
                <div className="flex-1 overflow-y-auto pb-4 no-scrollbar">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6 shadow-md">
                        <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">{currentQuestion.type === 'fill_blank' ? 'Fill the Blank' : 'Spot the Error'}</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">{currentQuestion.question}</h2>
                    </div>
                    <div className="space-y-3">
                        {currentQuestion.options.map((opt, idx) => {
                            let itemClass = "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white";
                            if (selectedOption !== null) {
                                if (idx === currentQuestion.correctIndex) itemClass = "bg-green-100 dark:bg-green-500/20 border-green-500 text-green-700 dark:text-green-200";
                                else if (idx === selectedOption) itemClass = "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-200";
                                else itemClass = "opacity-50";
                            }
                            return (
                                <button key={idx} onClick={() => handleAnswer(idx)} disabled={selectedOption !== null} className={`w-full p-4 rounded-xl border text-left transition-all font-medium shadow-sm ${itemClass}`}>
                                    <div className="flex items-center justify-between">
                                        <span>{opt}</span>
                                        {selectedOption !== null && idx === currentQuestion.correctIndex && <CheckBadgeIcon className="w-6 h-6 text-green-500" />}
                                        {selectedOption !== null && idx === selectedOption && idx !== currentQuestion.correctIndex && <XMarkIcon className="w-6 h-6 text-red-500" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {selectedOption !== null && (
                        <div className={`mt-6 p-5 rounded-2xl border animate-fade-in transition-colors ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-500/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30'}`}>
                            <h3 className={`font-bold mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isCorrect ? 'Correct! 🎉' : 'Oops! Incorrect'}</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                            <button onClick={handleNext} className="mt-4 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg font-thai">
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