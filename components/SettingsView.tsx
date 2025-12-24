import React from 'react';
import { SunIcon, MoonIcon, GlobeIcon, SparklesIcon } from './Icons';
import { Language } from '../types';

interface SettingsViewProps {
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onThemeChange, language, onLanguageChange }) => {
    const t = {
        th: {
            title: 'ตั้งค่า',
            sub: 'ปรับแต่งการใช้งานในแบบของคุณ',
            appearance: 'รูปลักษณ์ & ภาษา',
            light: 'โหมดสว่าง',
            dark: 'โหมดมืด',
            langLabel: 'ภาษาของแอป (Language)',
            langTh: 'ภาษาไทย',
            langEn: 'English',
            about: 'เกี่ยวกับ',
            version: 'เวอร์ชัน',
            aiLang: 'ภาษา AI',
            footer: '© 2024 ThaiSnap Lingo • พลังขับเคลื่อนโดย Gemini AI'
        },
        en: {
            title: 'Settings',
            sub: 'Customize your experience',
            appearance: 'Appearance & Language',
            light: 'Light Mode',
            dark: 'Dark Mode',
            langLabel: 'App Language',
            langTh: 'Thai (ไทย)',
            langEn: 'English',
            about: 'About',
            version: 'Version',
            aiLang: 'AI Language',
            footer: '© 2024 ThaiSnap Lingo • Powered by Gemini AI'
        }
    }[language];

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 pb-24 px-6 overflow-hidden transition-colors duration-500">
            <h1 className={`text-2xl font-bold text-slate-900 dark:text-white mb-2 ${language === 'th' ? 'font-thai' : ''}`}>{t.title}</h1>
            <p className={`text-slate-500 dark:text-slate-400 text-sm mb-8 ${language === 'th' ? 'font-thai' : ''}`}>{t.sub}</p>

            <div className="space-y-6">
                
                {/* Appearance Section */}
                <div className="space-y-3">
                    <label className={`text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 px-1 ${language === 'th' ? 'font-thai' : ''}`}>
                        {t.appearance}
                    </label>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors duration-500">
                        {/* Theme Toggle */}
                        <div className="p-2 flex gap-1">
                             <button 
                                onClick={() => onThemeChange('light')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                                <SunIcon className="w-4 h-4" />
                                <span className={`text-sm font-bold ${language === 'th' ? 'font-thai' : ''}`}>{t.light}</span>
                             </button>
                             <button 
                                onClick={() => onThemeChange('dark')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 dark:hover:text-slate-200'}`}
                             >
                                <MoonIcon className="w-4 h-4" />
                                <span className={`text-sm font-bold ${language === 'th' ? 'font-thai' : ''}`}>{t.dark}</span>
                             </button>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4"></div>

                        {/* Language Selection */}
                        <div className="p-4 space-y-3">
                            <span className={`text-xs text-slate-400 dark:text-slate-500 font-bold block ${language === 'th' ? 'font-thai' : ''}`}>{t.langLabel}</span>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                <button 
                                    onClick={() => onLanguageChange('th')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'th' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.langTh}
                                </button>
                                <button 
                                    onClick={() => onLanguageChange('en')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t.langEn}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3">
                    <label className={`text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 px-1 ${language === 'th' ? 'font-thai' : ''}`}>
                        {t.about}
                    </label>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm transition-colors duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <span className={`text-slate-900 dark:text-white ${language === 'th' ? 'font-thai' : 'font-medium'}`}>{t.version}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-sm">1.3.0</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <GlobeIcon className="w-5 h-5" />
                                </div>
                                <span className={`text-slate-900 dark:text-white ${language === 'th' ? 'font-thai' : 'font-medium'}`}>{t.aiLang}</span>
                            </div>
                            <span className={`text-sm text-slate-400 ${language === 'th' ? 'font-thai' : ''}`}>English - Thai</span>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-auto pb-6 text-center">
                <p className={`text-[10px] text-slate-400 font-thai`}>
                    {t.footer}
                </p>
            </div>
        </div>
    );
};

export default SettingsView;