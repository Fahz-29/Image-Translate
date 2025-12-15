import React from 'react';
import { Tab } from '../types';
import { HomeIcon, ListIcon, CardsIcon } from './Icons';

interface NavBarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className="absolute bottom-0 w-full px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 z-50">
      <div className="flex justify-around items-center">
        <button
          onClick={() => onTabChange(Tab.HOME)}
          className={`flex flex-col items-center space-y-1 transition-all ${
            currentTab === Tab.HOME ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">หน้าหลัก</span>
        </button>

        <button
          onClick={() => onTabChange(Tab.SAVED)}
          className={`flex flex-col items-center space-y-1 transition-all ${
            currentTab === Tab.SAVED ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ListIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">คำศัพท์</span>
        </button>

        <button
          onClick={() => onTabChange(Tab.FLASHCARDS)}
          className={`flex flex-col items-center space-y-1 transition-all ${
            currentTab === Tab.FLASHCARDS ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <CardsIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">แฟลชการ์ด</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;