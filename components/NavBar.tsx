import React from 'react';
import { Tab, Language } from '../types';
import { HomeIcon, ListIcon, CardsIcon, PuzzleIcon, Cog6ToothIcon } from './Icons';

interface NavBarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  language: Language;
}

const NavBar: React.FC<NavBarProps> = ({ currentTab, onTabChange, language }) => {
  const labels = {
    th: {
      [Tab.HOME]: 'หน้าหลัก',
      [Tab.SAVED]: 'คำศัพท์',
      [Tab.FLASHCARDS]: 'การ์ด',
      [Tab.PRACTICE]: 'ฝึกฝน',
      [Tab.SETTINGS]: 'ตั้งค่า',
    },
    en: {
      [Tab.HOME]: 'Home',
      [Tab.SAVED]: 'Words',
      [Tab.FLASHCARDS]: 'Cards',
      [Tab.PRACTICE]: 'Practice',
      [Tab.SETTINGS]: 'Settings',
    }
  };

  return (
    <div className="absolute bottom-0 w-full px-2 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 transition-colors duration-500">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {(Object.values(Tab) as Tab[]).map((tab) => {
          const Icon = tab === Tab.HOME ? HomeIcon :
                       tab === Tab.SAVED ? ListIcon :
                       tab === Tab.FLASHCARDS ? CardsIcon :
                       tab === Tab.PRACTICE ? PuzzleIcon : Cog6ToothIcon;
          
          const isActive = currentTab === tab;

          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex flex-col items-center space-y-1 transition-all w-14 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-[9px] font-medium tracking-wide ${language === 'th' ? 'font-thai' : ''}`}>
                {labels[language][tab]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavBar;