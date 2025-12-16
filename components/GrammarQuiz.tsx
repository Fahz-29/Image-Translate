import React, { useState, useEffect } from 'react';
import { SavedWord, QuizQuestion } from '../types';
import { generateGrammarQuiz } from '../services/geminiService';
import { ArrowLeftIcon, CheckBadgeIcon, XMarkIcon, SparklesIcon, HomeIcon } from './Icons';

interface GrammarQuizProps {
    words: SavedWord[];
    onBack: () => void;
}

const TOTAL_QUESTIONS = 5;

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ words, onBack }) => {
    // Session State
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Question State
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [wordUsed, setWordUsed] = useState<string>('');

    const startSession = () => {
        setScore(0);
        setQuestionCount(0);
        setIsFinished(false);
        setIsPlaying(true);
        loadNextQuestion();
    };

    const loadNextQuestion = async () => {
        if (words.length === 0) return;
        
        // Reset question state
        setIsLoading(true);
        setSelectedOption(null);
        setIsCorrect(null);
        setCurrentQuestion(null);

        // Pick random word
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setWordUsed(randomWord.english);

        try {
            const quiz = await generateGrammarQuiz(randomWord.english);
            setCurrentQuestion(quiz);
        } catch (e) {
            console.error(e);
            alert("ไม่สามารถสร้างคำถามได้ กรุณาลองใหม่");
            // If error, maybe try again or go back, for now simple alert
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (selectedOption !== null || !currentQuestion) return;
        setSelectedOption(index);
        
        const correct = index === currentQuestion.correctIndex;
        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);

        if (nextCount >= TOTAL_QUESTIONS) {
            setIsFinished(true);
        } else {
            loadNextQuestion();
        }
    };

    // --- RENDER START SCREEN ---
    if (!isPlaying && !isFinished) {
        return (
            <div className="h-full w-full bg-slate-900 flex flex-col pt-10 px-6 pb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full p-6 z-10">
                     <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6">
                    <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-3">
                         <SparklesIcon className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white font-thai">Grammar Challenge</h1>
                        <p className="text-slate-400 font-thai">ทดสอบความแม่นยำทางไวยากรณ์</p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-full max-w-xs">
                         <p className="text-sm text-slate-300 font-thai">
                             จำนวนข้อ: <span className="font-bold text-white">{TOTAL_QUESTIONS} ข้อ</span><br/>
                             คำศัพท์ในคลัง: <span className="font-bold text-white">{words.length} คำ</span>
                         </p>
                    </div>

                    {words.length < 3 ? (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-yellow-200 text-sm font-thai">
                            ⚠️ ควรบันทึกคำศัพท์อย่างน้อย 3 คำก่อนเริ่มเล่น
                        </div>
                    ) : (
                        <button 
                            onClick={startSession}
                            className="w-full max-w-xs py-3.5 bg-white text-indigo-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-transform font-thai"
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
                        <span className="text-5xl font-bold text-white">{score}/{TOTAL_QUESTIONS}</span>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 font-thai">สรุปคะแนน</h2>
                <p className="text-slate-400 font-thai mb-10">
                    {score === TOTAL_QUESTIONS ? "สุดยอด! คุณทำได้เต็มคะแนน" : 
                     score >= 3 ? "ทำได้ดีมาก! ฝึกฝนต่อไปนะ" : "พยายามอีกนิดนะ!"}
                </p>

                <div className="w-full max-w-xs space-y-3">
                    <button 
                        onClick={startSession}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all font-thai"
                    >
                        เริ่มรอบใหม่
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
    return (
        <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <span className="text-xs font-bold text-indigo-400">Question {questionCount + 1}/{TOTAL_QUESTIONS}</span>
                </div>
                <div className="w-8"></div>
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-thai animate-pulse">กำลังสร้างโจทย์จากคำว่า "{wordUsed}"...</p>
                </div>
            )}

            {!isLoading && currentQuestion && (
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
                                {questionCount === TOTAL_QUESTIONS - 1 ? "ดูผลคะแนน" : "ข้อต่อไป"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GrammarQuiz;