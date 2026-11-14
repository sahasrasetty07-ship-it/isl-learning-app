import React, { useState, useEffect, useRef, useId } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  isSTTSupported,
  startListening,
  getSpeechErrorMessage,
} from '../../utils/speech';
import {
  toSignSequence,
  calculateCoverage,
  normalizeGujarati,
} from '../../utils/signMatcher';
import { logTranslationHistory } from '../../utils/translationHistory';
import { SignSequencePlayer } from './SignSequencePlayer';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Layers,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Globe,
  Radio,
  FileEdit,
  CheckCircle2,
} from 'lucide-react';

export const SpeechToSign = () => {
  const { uiLanguage, showToast } = useApp();
  const { user } = useAuth();
  const isEn = uiLanguage === 'en';
  const inputId = useId();

  // Language options
  const LANGUAGES = [
    { code: 'gu-IN', label: isEn ? 'Gujarati (ગુજરાતી)' : 'ગુજરાતી (gu-IN)' },
    { code: 'hi-IN', label: isEn ? 'Hindi (हिन्दी)' : 'હિન્દી (hi-IN)' },
    { code: 'en-IN', label: isEn ? 'English (Indian)' : 'અંગ્રેજી (en-IN)' },
  ];

  const [selectedLang, setSelectedLang] = useState('gu-IN');

  // STT States: 'idle' | 'listening' | 'processing' | 'error'
  const [sttState, setSttState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  // Transcript states
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  // Sign Sequence and Coverage
  const [sequence, setSequence] = useState([]);
  const [coverage, setCoverage] = useState(null);

  // Fallback Whisper recording
  const fallbackUrl = import.meta.env.VITE_STT_FALLBACK_URL || '';
  const [isRecordingFallback, setIsRecordingFallback] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Active listener session reference
  const listenerRef = useRef(null);

  const browserSupportsSTT = isSTTSupported();

  // Stop listening when unmounting
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.stop();
      }
    };
  }, []);

  // Handle native Web Speech API listening
  const handleToggleListening = () => {
    if (sttState === 'listening') {
      if (listenerRef.current) {
        listenerRef.current.stop();
        listenerRef.current = null;
      }
      setSttState('idle');
      return;
    }

    if (!browserSupportsSTT) {
      setErrorMessage(
        isEn
          ? 'Browser speech recognition is not supported in this browser. Please use Google Chrome or Edge.'
          : 'આ બ્રાઉઝરમાં સ્પીચ રેકગ્નિશન ઉપલબ્ધ નથી. કૃપા કરીને Google Chrome અથવા Edge વાપરો.'
      );
      setSttState('error');
      return;
    }

    setErrorMessage(null);
    setInterimTranscript('');
    setSttState('listening');

    listenerRef.current = startListening({
      lang: selectedLang,
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (text) => {
        setFinalTranscript(text);
        setInterimTranscript('');
      },
      onError: (err) => {
        setSttState('error');
        const userMsg = getSpeechErrorMessage(err.error, uiLanguage);
        setErrorMessage(userMsg);
        showToast(userMsg, 'error');
      },
      onEnd: () => {
        setSttState('idle');
        setInterimTranscript('');
      },
    });
  };

  // Convert transcript to sign sequence
  const handleConvert = (text = finalTranscript) => {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast(
        isEn ? 'Please speak or enter text first.' : 'કૃપા કરીને પહેલાં બોલો અથવા ટેક્સ્ટ લખો.',
        'info'
      );
      return;
    }

    // Non-blocking history logging
    logTranslationHistory('speech-to-sign', trimmed, user?.id);

    const seq = toSignSequence(trimmed);
    setSequence(seq);
    setCoverage(calculateCoverage(seq));
  };

  // Preset quick test phrases
  const handleSelectPreset = (phrase) => {
    setFinalTranscript(phrase);
    setInterimTranscript('');
    handleConvert(phrase);
  };

  // Fallback MediaRecorder Whisper audio upload
  const handleToggleFallbackRecording = async () => {
    if (!fallbackUrl) return;

    if (isRecordingFallback) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingFallback(false);
      setSttState('processing');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToFallback(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingFallback(true);
      setSttState('listening');
    } catch (err) {
      setSttState('error');
      setErrorMessage(
        isEn ? 'Microphone permission denied or unavailable.' : 'માઇક્રોફોન મંજૂરી નકારાઈ અથવા ઉપલબ્ધ નથી.'
      );
    }
  };

  const sendAudioToFallback = async (blob) => {
    setSttState('processing');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      formData.append('language', selectedLang.slice(0, 2));

      const res = await fetch(fallbackUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const transcript = data.transcript || data.text || '';

      if (transcript) {
        setFinalTranscript(transcript);
        handleConvert(transcript);
        setSttState('idle');
      } else {
        throw new Error('Empty transcript returned');
      }
    } catch (err) {
      setSttState('error');
      setErrorMessage(
        isEn
          ? `Fallback transcription failed: ${err.message}`
          : `ઓડિયો ટ્રાન્સક્રિપ્શન નિષ્ફળ: ${err.message}`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Microphone Main Control Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center space-y-4">
        {/* Header and Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {isEn ? 'Speech Recognition → ISL' : 'ગુજરાતી વાણી → સાઇન લેંગ્વેજ'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {isEn ? 'Speak to Generate ISL Sign Language' : 'બોલો અને સાઇન સંકેત મેળવો'}
            </h3>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 p-1 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              aria-label={isEn ? 'Select speech recognition language' : 'ભાષા પસંદ કરો'}
              className="bg-transparent text-xs font-bold text-slate-700 py-1 px-2 focus:outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Large Accessible Microphone Button */}
        <div className="py-2">
          <button
            type="button"
            onClick={browserSupportsSTT ? handleToggleListening : handleToggleFallbackRecording}
            aria-label={
              sttState === 'listening'
                ? isEn
                  ? 'Stop listening'
                  : 'સાંભળવાનું બંધ કરો'
                : isEn
                ? 'Start speaking'
                : 'માઇક દબાવી બોલો'
            }
            className={`min-h-[80px] min-w-[80px] w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl active:scale-95 focus-visible:ring-4 focus-visible:ring-purple-400 ${
              sttState === 'listening'
                ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse'
                : sttState === 'processing'
                ? 'bg-amber-500 text-white animate-spin'
                : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-700 text-white hover:opacity-95 shadow-purple-500/30'
            }`}
          >
            {sttState === 'listening' ? (
              <MicOff className="w-8 h-8" />
            ) : sttState === 'processing' ? (
              <RotateCcw className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Dynamic Waveform & State Status Label */}
          <div className="mt-3">
            {sttState === 'listening' && (
              <div className="flex items-center justify-center gap-1 my-2" aria-hidden="true">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-10 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-4 bg-purple-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-8 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.2s]" />
                <span className="w-1.5 h-5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
              </div>
            )}

            <p
              className="text-xs font-bold text-slate-700"
              aria-live="polite"
            >
              {sttState === 'listening'
                ? isEn
                  ? 'Listening... Speak clearly into your microphone'
                  : 'સાંભળી રહ્યા છીએ... કૃપા કરીને માઇકમાં સ્પષ્ટ બોલો'
                : sttState === 'processing'
                ? isEn
                  ? 'Processing audio...'
                  : 'ઓડિયો પ્રોસેસિંગ ચાલુ છે...'
                : isEn
                ? 'Tap microphone to speak'
                : 'માઇક દબાવી ગુજરાતીમાં બોલો'}
            </p>
          </div>
        </div>

        {/* Live Interim Transcript Display */}
        {interimTranscript && (
          <div
            className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-left"
            aria-live="polite"
          >
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              {isEn ? 'Live Interim Transcript:' : 'લાઈવ વચગાળાની વાણી:'}
            </span>
            <p lang="gu" className="text-sm font-semibold text-purple-950 mt-0.5 animate-pulse">
              {interimTranscript} ...
            </p>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2.5"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <strong>{isEn ? 'Speech Error: ' : 'વાણી ભૂલ: '}</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Browser Unsupported Notice */}
        {!browserSupportsSTT && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isEn
                  ? 'Browser Web Speech API not supported in this browser'
                  : 'આ બ્રાઉઝરમાં વેબ સ્પીચ રેકગ્નિશન સપોર્ટેડ નથી'}
              </span>
            </div>
            <p className="text-slate-600">
              {isEn
                ? 'Web Speech API is best supported in Google Chrome and Microsoft Edge on desktop and Android. You can test sign matching using the preset phrases below.'
                : 'Google Chrome અથવા Microsoft Edge વાપરવાની ભલામણ છે. તમે નીચે આપેલા પ્રીસેટ વાક્યો પર ક્લિક કરીને સાઇન મેચિંગ ચકાસી શકો છો.'}
            </p>

            {fallbackUrl && (
              <button
                type="button"
                onClick={handleToggleFallbackRecording}
                className="mt-2 min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>
                  {isRecordingFallback
                    ? isEn
                      ? 'Stop & Transcribe (Whisper)'
                      : 'રેકોર્ડિંગ બંધ કરો (Whisper)'
                    : isEn
                    ? 'Record via Whisper Fallback'
                    : 'Whisper સર્વિસ દ્વારા રેકોર્ડ કરો'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Quick Test Phrases */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
            {isEn ? 'Quick Test Phrases (click to test sign lookup):' : 'ઝડપી ટેસ્ટ વાક્યો (ક્લિક કરી સાઇન મેળવો):'}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {[
              'નમસ્તે, તમારું નામ શું છે?',
              'મને મદદ જોઈએ છે',
              'હું વિદ્યાર્થી છું',
              'શુભ સવાર',
              'કમળ અને ઘર',
              'એક બે ત્રણ',
            ].map((txt) => (
              <button
                key={txt}
                type="button"
                onClick={() => handleSelectPreset(txt)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 transition border border-slate-200"
              >
                <span lang="gu">{txt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Final Transcript Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <label
            htmlFor={inputId}
            className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
          >
            <FileEdit className="w-3.5 h-3.5 text-purple-600" />
            {isEn ? 'Recognized Speech (Editable):' : 'ઓળખાયેલ ગુજરાતી વાણી (તપાસો અને સંપાદિત કરો):'}
          </label>
          <span className="text-[10px] text-slate-400 font-semibold">
            {isEn ? 'Review before converting' : 'રૂપાંતર પહેલાં સુધારી શકો છો'}
          </span>
        </div>

        <textarea
          id={inputId}
          lang="gu"
          value={finalTranscript}
          onChange={(e) => setFinalTranscript(e.target.value)}
          placeholder={
            isEn
              ? 'Spoken transcript appears here. You can edit any word before converting...'
              : 'બોલાયેલ લખાણ અહીં દેખાશે. રૂપાંતર કરતાં પહેલાં તમે કોઈપણ શબ્દ સુધારી શકો છો...'
          }
          rows={3}
          className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium leading-relaxed resize-y"
        />

        {/* Convert Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => handleConvert()}
            disabled={!finalTranscript.trim()}
            className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md disabled:opacity-40 disabled:pointer-events-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <span>{isEn ? 'Convert Speech to Sign' : 'વાણીનું સાઇનમાં રૂપાંતર કરો'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Coverage Summary Banner */}
      {coverage && (
        <div
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              {isEn ? 'Spoken Text Sign Coverage' : 'વાણી લખાણ સાઇન કવરેજ'}
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
              {coverage.coveragePercent}% {isEn ? 'Covered' : 'સંપૂર્ણ'}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">
                {isEn ? 'Total Words' : 'કુલ શબ્દો'}
              </span>
              <span className="text-lg font-black text-slate-900">{coverage.totalWords}</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                {isEn ? 'Matched Signs' : 'માન્ય સંકેતો'}
              </span>
              <span className="text-lg font-black text-emerald-800">{coverage.matchedWords}</span>
            </div>

            <div className="bg-purple-50 border border-purple-200/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-purple-700 font-bold block uppercase">
                {isEn ? 'Fingerspelled' : 'હસ્તમુદ્રા'}
              </span>
              <span className="text-lg font-black text-purple-800">{coverage.fingerspelledWords}</span>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 p-2.5 rounded-xl">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">
                {isEn ? 'Unsupported' : 'અસમર્થિત'}
              </span>
              <span className="text-lg font-black text-rose-800">{coverage.unsupportedWords}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Sign Sequence Player */}
      {sequence.length > 0 && (
        <SignSequencePlayer sequence={sequence} />
      )}
    </div>
  );
};
