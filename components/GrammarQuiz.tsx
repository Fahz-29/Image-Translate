import React, { useState, useEffect } from 'react';
import { SavedWord, QuizQuestion } from '../types';
import { generateGrammarQuiz } from '../services/geminiService';
import { ArrowLeftIcon, CheckBadgeIcon, XMarkIcon, SparklesIcon } from './Icons';

interface GrammarQuizProps {
    words: SavedWord[];
    onBack: () => void;
}

const GrammarQuiz: React.FC<GrammarQuizProps> = ({ words, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [wordUsed, setWordUsed] = useState<string>('');

    const startNewQuiz = async () => {
        if (words.length === 0) return;
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
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startNewQuiz();
    }, []);

    const handleAnswer = (index: number) => {
        if (selectedOption !== null || !currentQuestion) return;
        setSelectedOption(index);
        setIsCorrect(index === currentQuestion.correctIndex);
    };

    if (words.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
                <p className="font-thai mb-4">คุณต้องบันทึกคำศัพท์ก่อนเพื่อเริ่มเล่นเกม</p>
                <button onClick={onBack} className="text-indigo-400 font-bold">กลับ</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-900 flex flex-col pt-6 pb-24 px-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-white font-thai">Grammar Challenge</h1>
            </div>

            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-thai animate-pulse">กำลังสร้างโจทย์จากคำว่า "{wordUsed}"...</p>
                </div>
            )}

            {!isLoading && currentQuestion && (
                <div className="flex-1 overflow-y-auto">
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
                                onClick={startNewQuiz}
                                className="mt-4 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition"
                            >
                                โจทย์ข้อต่อไป
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GrammarQuiz;