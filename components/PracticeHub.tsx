import React, { useState } from 'react';
import { SavedWord } from '../types';
import GrammarQuiz from './GrammarQuiz';
import AccentCoach from './AccentCoach';
import { PuzzleIcon, MicrophoneIcon, ChevronDownIcon } from './Icons';

interface PracticeHubProps {
  words: SavedWord[];
}

type Mode = 'MENU' | 'QUIZ' | 'ACCENT';

const PracticeHub: React.FC<PracticeHubProps> = ({ words }) => {
  const [mode, setMode] = useState<Mode>('MENU');

  if (mode === 'QUIZ') return <GrammarQuiz words={words} onBack={() => setMode('MENU')} />;
  if (mode === 'ACCENT') return <AccentCoach words={words} onBack={() => setMode('MENU')} />;

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 pb-24 px-6 overflow-hidden transition-colors duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-thai mb-2">Practice Arena</h1>
      <p className="text-slate-500 dark:text-slate-400 font-thai text-sm mb-8">พัฒนาทักษะภาษาอังกฤษของคุณให้ดียิ่งขึ้น</p>

      <div className="space-y-4">
        
        {/* Quiz Card */}
        <button 
            onClick={() => setMode('QUIZ')}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-500/20 flex items-center justify-between group transition-transform active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl text-white">
                    <PuzzleIcon className="w-8 h-8" />
                </div>
                <div className="text-left text-white">
                    <h2 className="text-xl font-bold font-thai">Grammar Quiz</h2>
                    <p className="text-indigo-100 text-xs mt-1">ทดสอบไวยากรณ์ จับผิดประโยค</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                <ChevronDownIcon className="w-6 h-6 -rotate-90 text-white" />
            </div>
        </button>

        {/* Accent Coach Card */}
        <button 
            onClick={() => setMode('ACCENT')}
            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 p-6 rounded-3xl shadow-lg shadow-pink-500/20 flex items-center justify-between group transition-transform active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl text-white">
                    <MicrophoneIcon className="w-8 h-8" />
                </div>
                <div className="text-left text-white">
                    <h2 className="text-xl font-bold font-thai">Accent Coach</h2>
                    <p className="text-pink-100 text-xs mt-1">ฝึกพูด เช็คสำเนียงกับ AI</p>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                <ChevronDownIcon className="w-6 h-6 -rotate-90 text-white" />
            </div>
        </button>

      </div>

      <div className="mt-auto bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center font-thai">
            Tip: ยิ่งบันทึกคำศัพท์มาก ยิ่งมีโจทย์ให้เล่นมาก
          </p>
      </div>
    </div>
  );
};

export default PracticeHub;