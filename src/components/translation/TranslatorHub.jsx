import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TextToSign } from './TextToSign';
import { SignRecognition } from './SignRecognition';
import { SpeechToSign } from './SpeechToSign';
import { 
  FileText, 
  Mic, 
  Camera, 
  Volume2, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const TranslatorHub = () => {
  const { uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const [activeTab, setActiveTab] = useState('text-to-sign');

  const tabs = [
    {
      id: 'text-to-sign',
      label: isEn ? 'Text → Sign' : 'ટેક્સ્ટ → સાઇન',
      sub: isEn ? 'Convert words & articles' : 'શબ્દો અને લેખોનું રૂપાંતર',
      icon: FileText,
    },
    {
      id: 'speech-to-sign',
      label: isEn ? 'Speech → Sign' : 'વાણી → સાઇન',
      sub: isEn ? 'Spoken voice to ISL' : 'ગુજરાતી બોલીમાંથી સંકેત',
      icon: Mic,
    },
    {
      id: 'sign-to-text',
      label: isEn ? 'Sign → Text/Speech' : 'સાઇન → ટેક્સ્ટ/વાણી',
      sub: isEn ? 'Camera recognition practice' : 'કેમેરા સંકેત મહાવરો',
      icon: Camera,
    },
    {
      id: 'voice-tools',
      label: isEn ? 'Voice Tools' : 'વાણી સાધનો',
      sub: isEn ? 'Pronunciation & clarity' : 'ઉચ્ચાર અને વાણી સહાય',
      icon: Volume2,
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
        className="grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl"
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
        {activeTab === 'text-to-sign' && <TextToSign />}
        {activeTab === 'speech-to-sign' && <SpeechToSign />}
        {activeTab === 'sign-to-text' && <SignRecognition />}
        {activeTab === 'voice-tools' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <Volume2 className="w-7 h-7" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              {isEn ? 'Subsequent Phase' : 'આગામી તબક્કો'}
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {isEn ? 'Voice Tools & Speech Assistance' : 'વાણી સાધનો અને સ્પીચ સહાયક'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isEn
                ? 'Voice tools including Gujarati TTS practice, pronunciation scoring, and clarity feedback will be enabled in subsequent milestones.'
                : 'ગુજરાતી વાણી ઉચ્ચારણ મહાવરો, સ્પષ્ટતા મૂલ્યાંકન અને વોઈસ ટૂલ્સ આગામી તબક્કામાં સક્રિય કરવામાં આવશે.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
