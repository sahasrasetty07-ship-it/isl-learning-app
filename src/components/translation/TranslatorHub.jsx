import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SignRecognition } from './SignRecognition';
import { SpeechToSign } from './SpeechToSign';
import { 
  Mic, 
  Camera, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const TranslatorHub = () => {
  const { uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const [activeTab, setActiveTab] = useState('speech-to-sign');

  const tabs = [
    {
      id: 'speech-to-sign',
      label: isEn ? 'Speech → Text' : 'વાણી → ટેક્સ્ટ',
      sub: isEn ? 'Spoken voice to ISL' : 'ગુજરાતી બોલીમાંથી સંકેત',
      icon: Mic,
    },
    {
      id: 'sign-to-text',
      label: isEn ? 'Sign → Text/Speech' : 'સાઇન → ટેક્સ્ટ/વાણી',
      sub: isEn ? 'Camera recognition practice' : 'કેમેરા સંકેત મહાવરો',
      icon: Camera,
    },
  ];

  return (
    <div className="space-y-4 pb-6" role="region" aria-label={isEn ? 'Translation Hub' : 'અનુવાદ કેન્દ્ર'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {isEn ? 'Two-Way ISL Hub' : 'દ્વિ-માર્ગીય સંવાદ અને અનુવાદ'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {isEn ? 'Inclusive Sign & Speech Translator' : 'સમાવેશી સંકેત અને વાણી અનુવાદ'}
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl mt-1">
            {isEn 
              ? 'Translate between Gujarati text, spoken voice, and Indian Sign Language (ISL) using verified educator sign models.' 
              : 'ગુજરાતી ટેક્સ્ટ, બોલાયેલી વાણી અને ભારતીય સંકેત ભાષા (ISL) વચ્ચે અધિકૃત સંકેતો સાથે અનુવાદ.'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 select-none pointer-events-none">
          🤟
        </div>
      </div>

      {/* Tab Switcher */}
      <div
        className="grid grid-cols-2 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl"
        role="tablist"
        aria-label={isEn ? 'Translation Modes' : 'અનુવાદ મોડ'}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center py-2 px-2.5 rounded-xl text-xs font-bold transition text-center focus-visible:ring-2 focus-visible:ring-purple-600 ${
                isActive
                  ? 'bg-white text-purple-800 shadow-md ring-1 ring-purple-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal truncate mt-0.5 hidden sm:block">
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Views */}
      <div role="tabpanel" className="mt-2">
        {activeTab === 'speech-to-sign' && <SpeechToSign />}
        {activeTab === 'sign-to-text' && <SignRecognition />}
      </div>
    </div>
  );
};
