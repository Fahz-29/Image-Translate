
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, GlobeIcon, SparklesIcon, Cog6ToothIcon, CheckBadgeIcon } from './Icons';
import { Language } from '../types';

interface SettingsViewProps {
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, onThemeChange, language, onLanguageChange }) => {
    const [hasPersonalKey, setHasPersonalKey] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasPersonalKey(hasKey);
            }
        };
        checkKey();
    }, []);

    const handleManageKey = async () => {
        // FIX: Mitigate race condition by assuming successful key selection after openSelectKey returns.
        await window.aistudio.openSelectKey();
        setHasPersonalKey(true);
    };

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
            footer: '© 2024 ThaiSnap Lingo • พลังขับเคลื่อนโดย Gemini AI',
            apiKey: 'การจัดการ API Key',
            apiKeyDesc: 'ใช้ Key ส่วนตัวเพื่อเลี่ยงการจำกัดโควตาฟรี',
            manageKey: 'ตั้งค่า API Key ของคุณ'
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
            footer: '© 2024 ThaiSnap Lingo • Powered by Gemini AI',
            apiKey: 'API Key Management',
            apiKeyDesc: 'Use your own key to bypass free quota limits',
            manageKey: 'Manage Personal Key'
        }
    }[language];

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col pt-10 pb-24 px-6 overflow-hidden transition-colors duration-500">
            <h1 className={`text-2xl font-bold text-slate-900 dark:text-white mb-2 ${language === 'th' ? 'font-thai' : ''}`}>{t.title}</h1>
            <p className={`text-slate-500 dark:text-slate-400 text-sm mb-8 ${language === 'th' ? 'font-thai' : ''}`}>{t.sub}</p>

            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-6">
                
                {/* API Key Section */}
                <div className="space-y-3">
                    <label className={`text-[10px] uppercase font-black tracking-widest text-indigo-500 px-1 ${language === 'th' ? 'font-thai' : ''}`}>
                        {t.apiKey}
                    </label>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className={`text-xs text-slate-500 dark:text-slate-400 font-medium ${language === 'th' ? 'font-thai' : ''}`}>{t.apiKeyDesc}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${hasPersonalKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {hasPersonalKey ? 'Personal Key Active' : 'Using System Key (Shared Quota)'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Cog6ToothIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <button 
                            onClick={handleManageKey}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all font-thai"
                        >
                            {t.manageKey}
                        </button>
                        <p className="text-[10px] text-slate-400 font-medium text-center italic">
                            Required to bypass "429 Quota Exceeded" errors. <br/>
                            Get one at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-500 underline">ai.google.dev</a>
                        </p>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="space-y-3">
                    <label className={`text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 px-1 ${language === 'th' ? 'font-thai' : ''}`}>
                        {t.appearance}
                    </label>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors duration-500">
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
                    <label className={`text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 px-1 ${language === 'th' ? 'font-thai' : ''}`}>
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
                            <span className="text-slate-400 font-mono text-sm">1.4.0</span>
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

            <div className="pt-4 text-center">
                <p className={`text-[10px] text-slate-400 font-thai`}>
                    {t.footer}
                </p>
            </div>
        </div>
    );
};

export default SettingsView;
