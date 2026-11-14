import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TextToSign } from './TextToSign';
import { SignRecognition } from './SignRecognition';
import { SpeechToSign } from './SpeechToSign';
import { PageHeader, Tabs } from '../ui';
import {
  FileText,
  Camera,
  Mic,
  Languages
} from 'lucide-react';

export const TranslatorHub = () => {
  const { uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const [mode, setMode] = useState('text-to-sign');

  const modes = [
    { id: 'text-to-sign', label: isEn ? 'Text → Sign' : 'ટેક્સ્ટ → સાઇન', sub: 'Text to ISL', icon: FileText },
    { id: 'sign-to-text', label: isEn ? 'Sign → Text' : 'સાઇન → ટેક્સ્ટ', sub: 'Sign to Text', icon: Camera },
    { id: 'speech-to-sign', label: isEn ? 'Speech → Sign' : 'અવાજ → સાઇન', sub: 'Speech to ISL', icon: Mic },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Languages}
        title={isEn ? 'Translate' : 'અનુવાદ'}
        subtitle={isEn ? 'Between Gujarati text or speech and sign language' : 'ગુજરાતી ટેક્સ્ટ, વાણી અને સાઇન લેંગ્વેજ વચ્ચે અનુવાદ'}
      />

      <Tabs
        label={isEn ? 'Translation mode' : 'અનુવાદ પ્રકાર'}
        value={mode}
        onChange={setMode}
        items={modes.map(m => ({ id: m.id, icon: m.icon, label: m.label }))}
      />

      {mode === 'text-to-sign' && <TextToSign />}
      {mode === 'sign-to-text' && <SignRecognition />}
      {mode === 'speech-to-sign' && <SpeechToSign />}
    </div>
  );
};
