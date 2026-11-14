import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  isSTTSupported,
  isTTSSupported,
  startListening,
  speak,
  stopSpeaking,
  getSpeechErrorMessage,
} from '../../utils/speech';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Download,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Type,
  Users2,
  Radio,
  Send,
  RotateCcw,
} from 'lucide-react';

const MAX_CUSTOM_PHRASES = 20;
const STORAGE_KEY = 'saket_custom_phrases_v1';

export const VoiceTools = () => {
  const { uiLanguage, showToast } = useApp();
  const isEn = uiLanguage === 'en';

  // Sub-tabs: 'captions' | 'tts' | 'conversation'
  const [subTab, setSubTab] = useState('captions');

  // ============================================================================
  // 4A. LIVE CAPTIONS STATE
  // ============================================================================
  const [isCapturing, setIsCapturing] = useState(false);
  const isCapturingRef = useRef(false);
  const listenerRef = useRef(null);

  const [captionHistory, setCaptionHistory] = useState('');
  const [interimCaption, setInterimCaption] = useState('');
  const [captionFontSize, setCaptionFontSize] = useState('text-xl'); // text-lg, text-xl, text-2xl
  const [captionError, setCaptionError] = useState(null);

  // ============================================================================
  // 4B. TYPE-TO-SPEAK & CUSTOM PHRASES STATE
  // ============================================================================
  const [speakInput, setSpeakInput] = useState('');
  const [speakingRate, setSpeakingRate] = useState(0.9);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [currentlySpokenText, setCurrentlySpokenText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState(null);

  // Custom phrases in localStorage
  const [customPhrases, setCustomPhrases] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_CUSTOM_PHRASES);
      }
    } catch {
      // Storage unavailable fallback
    }
    return [
      { id: '1', text: 'નમસ્તે, મારું નામ શું છે?' },
      { id: '2', text: 'હું બધિર છું, કૃપા કરીને લખીને વાત કરો.' },
    ];
  });

  const [newPhraseInput, setNewPhraseInput] = useState('');
  const [editingPhraseId, setEditingPhraseId] = useState(null);
  const [editingPhraseText, setEditingPhraseText] = useState('');

  // Persist custom phrases safely
  const persistCustomPhrases = (phrases) => {
    setCustomPhrases(phrases);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
    } catch {
      showToast(isEn ? 'Storage unavailable.' : 'લોકલ સ્ટોરેજ ઉપલબ્ધ નથી.', 'error');
    }
  };

  // Preset quick phrases
  const PRESET_PHRASES = [
    { text: 'નમસ્તે, કેમ છો?', label: isEn ? 'Namaste, how are you?' : 'નમસ્તે, કેમ છો?' },
    { text: 'હું બધિર છું.', label: isEn ? 'I am deaf.' : 'હું બધિર છું.' },
    { text: 'કૃપા કરીને ફરીથી કહો.', label: isEn ? 'Please repeat.' : 'ફરીથી કહો.' },
    { text: 'ખૂબ ખૂબ આભાર.', label: isEn ? 'Thank you very much.' : 'ખૂબ આભાર.' },
    { text: 'મને સમજાઈ ગયું.', label: isEn ? 'I understood.' : 'સમજાઈ ગયું.' },
  ];

  // ============================================================================
  // 4C. CONVERSATION MODE STATE
  // ============================================================================
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'speaker',
      text: 'નમસ્તે! હું તમારી સાથે વાત કરવા તૈયાર છું.',
      timestamp: '10:00 AM',
    },
    {
      id: 'init-2',
      sender: 'deaf',
      text: 'નમસ્તે! હું બોલી શકતો નથી, પરંતુ વાંચી શકું છું.',
      timestamp: '10:01 AM',
    },
  ]);

  const [deafInput, setDeafInput] = useState('');
  const [speakerListening, setSpeakerListening] = useState(false);
  const [speakerDraft, setSpeakerDraft] = useState('');
  const speakerListenerRef = useRef(null);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      isCapturingRef.current = false;
      if (listenerRef.current) listenerRef.current.stop();
      if (speakerListenerRef.current) speakerListenerRef.current.stop();
      stopSpeaking();
    };
  }, []);

  // ----------------------------------------------------------------------------
  // Live Captions: Start / Stop with auto-restart loop
  // ----------------------------------------------------------------------------
  const startCaptionsSession = () => {
    if (!isSTTSupported()) {
      setCaptionError(
        isEn
          ? 'Speech recognition is not supported in this browser. Please use Google Chrome.'
          : 'આ બ્રાઉઝરમાં સ્પીચ રેકગ્નિશન ઉપલબ્ધ નથી. કૃપા કરીને Google Chrome વાપરો.'
      );
      return;
    }

    setCaptionError(null);
    setIsCapturing(true);
    isCapturingRef.current = true;

    const runSession = () => {
      if (!isCapturingRef.current) return;

      listenerRef.current = startListening({
        lang: 'gu-IN',
        onInterim: (text) => {
          setInterimCaption(text);
        },
        onFinal: (text) => {
          setCaptionHistory((prev) => (prev ? `${prev} ${text}` : text));
          setInterimCaption('');
        },
        onError: (err) => {
          if (err.error === 'not-allowed') {
            isCapturingRef.current = false;
            setIsCapturing(false);
            setCaptionError(getSpeechErrorMessage('not-allowed', uiLanguage));
            return;
          }
          if (err.error === 'network') {
            setCaptionError(getSpeechErrorMessage('network', uiLanguage));
          }
        },
        onEnd: () => {
          // Auto-restart if user still has continuous captions enabled
          if (isCapturingRef.current) {
            setTimeout(runSession, 250);
          } else {
            setIsCapturing(false);
            setInterimCaption('');
          }
        },
      });
    };

    runSession();
  };

  const stopCaptionsSession = () => {
    isCapturingRef.current = false;
    setIsCapturing(false);
    setInterimCaption('');
    if (listenerRef.current) {
      listenerRef.current.stop();
      listenerRef.current = null;
    }
  };

  const handleCopyCaptions = async () => {
    if (!captionHistory) return;
    try {
      await navigator.clipboard.writeText(captionHistory);
      showToast(isEn ? 'Transcript copied!' : 'ટ્રાન્સક્રિપ્ટ કોપી થઈ ગયું!');
    } catch {
      showToast(isEn ? 'Failed to copy.' : 'કોપી થઈ શક્યું નથી.', 'error');
    }
  };

  const handleDownloadCaptions = () => {
    if (!captionHistory) return;
    const blob = new Blob([captionHistory], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saket-captions-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(isEn ? 'Transcript downloaded!' : 'ટ્રાન્સક્રિપ્ટ ડાઉનલોડ થઈ ગયું!');
  };

  // ----------------------------------------------------------------------------
  // Type-to-Speak handlers
  // ----------------------------------------------------------------------------
  const handleSpeakText = async (textToSpeak) => {
    const text = (textToSpeak ?? speakInput).trim();
    if (!text) return;

    setVoiceNotice(null);
    setCurrentlySpokenText(text);
    setIsSpeakingNow(true);

    const result = await speak(text, { lang: 'gu-IN', rate: speakingRate });
    setIsSpeakingNow(false);

    if (!result.ok) {
      if (result.reason === 'no-voice') {
        setVoiceNotice(
          isEn
            ? 'No Gujarati text-to-speech voice installed in your browser/OS.'
            : 'તમારા બ્રાઉઝર કે સિસ્ટમમાં ગુજરાતી વાણી અવાજ (TTS) ઉપલબ્ધ નથી.'
        );
      } else {
        setVoiceNotice(
          isEn
            ? 'Speech playback failed or unsupported.'
            : 'વાણી વાંચન નિષ્ફળ રહ્યું અથવા ઉપલબ્ધ નથી.'
        );
      }
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeakingNow(false);
    setCurrentlySpokenText('');
  };

  // Custom phrases CRUD
  const handleAddCustomPhrase = () => {
    const trimmed = newPhraseInput.trim();
    if (!trimmed) return;
    if (customPhrases.length >= MAX_CUSTOM_PHRASES) {
      showToast(
        isEn
          ? `Maximum limit of ${MAX_CUSTOM_PHRASES} custom phrases reached.`
          : `મહત્તમ ${MAX_CUSTOM_PHRASES} વાક્યોની મર્યાદા પૂર્ણ થઈ ગઈ છે.`,
        'info'
      );
      return;
    }

    const updated = [
      ...customPhrases,
      { id: `phrase-${Date.now()}`, text: trimmed },
    ];
    persistCustomPhrases(updated);
    setNewPhraseInput('');
    showToast(isEn ? 'Phrase saved!' : 'વાક્ય સેવ થયું!');
  };

  const handleSaveEditPhrase = (id) => {
    const trimmed = editingPhraseText.trim();
    if (!trimmed) return;
    const updated = customPhrases.map((p) => (p.id === id ? { ...p, text: trimmed } : p));
    persistCustomPhrases(updated);
    setEditingPhraseId(null);
    setEditingPhraseText('');
  };

  const handleDeletePhrase = (id) => {
    const updated = customPhrases.filter((p) => p.id !== id);
    persistCustomPhrases(updated);
    showToast(isEn ? 'Phrase removed.' : 'વાક્ય હટાવ્યું.');
  };

  // ----------------------------------------------------------------------------
  // Conversation mode handlers
  // ----------------------------------------------------------------------------
  const handleToggleSpeakerListening = () => {
    if (speakerListening) {
      if (speakerListenerRef.current) speakerListenerRef.current.stop();
      setSpeakerListening(false);
      return;
    }

    setSpeakerListening(true);
    speakerListenerRef.current = startListening({
      lang: 'gu-IN',
      onInterim: (text) => setSpeakerDraft(text),
      onFinal: (text) => setSpeakerDraft(text),
      onError: (err) => {
        setSpeakerListening(false);
        showToast(getSpeechErrorMessage(err.error, uiLanguage), 'error');
      },
      onEnd: () => setSpeakerListening(false),
    });
  };

  const handleConfirmSpeakerMessage = () => {
    const trimmed = speakerDraft.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'speaker', text: trimmed, timestamp: time },
    ]);
    setSpeakerDraft('');
  };

  const handleSendDeafMessage = async () => {
    const trimmed = deafInput.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'deaf', text: trimmed, timestamp: time },
    ]);
    setDeafInput('');

    // Speak aloud for the hearing speaker
    await speak(trimmed, { lang: 'gu-IN', rate: speakingRate });
  };

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Selector */}
      <div
        className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl"
        role="tablist"
        aria-label={isEn ? 'Voice Tools modes' : 'વાણી સાધનો મોડ'}
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'captions'}
          onClick={() => setSubTab('captions')}
          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'captions'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isEn ? 'Live Captions' : 'લાઇવ કૅપ્શન્સ'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'tts'}
          onClick={() => setSubTab('tts')}
          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'tts'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isEn ? 'Type-to-Speak' : 'લખો અને બોલો'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'conversation'}
          onClick={() => setSubTab('conversation')}
          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'conversation'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isEn ? 'Conversation Mode' : 'સંવાદ મોડ'}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 4A. LIVE CAPTIONS TAB */}
      {/* ==================================================================== */}
      {subTab === 'captions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {isEn ? 'Continuous STT' : 'સતત વાણી ટ્રાન્સક્રિપ્શન'}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {isEn ? 'Real-Time Spoken Gujarati Captions' : 'રીઅલ-ટાઇમ ગુજરાતી કૅપ્શન્સ'}
              </h3>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 px-1">{isEn ? 'Size:' : 'કદ:'}</span>
              {[
                { size: 'text-base', label: 'A' },
                { size: 'text-xl', label: 'A+' },
                { size: 'text-2xl', label: 'A++' },
              ].map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setCaptionFontSize(s.size)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                    captionFontSize === s.size ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Large Listening Button & Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isCapturing ? stopCaptionsSession : startCaptionsSession}
                aria-label={isCapturing ? (isEn ? 'Stop listening' : 'કૅપ્શન્સ બંધ કરો') : isEn ? 'Start Live Captions' : 'કૅપ્શન્સ શરૂ કરો'}
                className={`min-h-[48px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 ${
                  isCapturing
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isCapturing ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>
                  {isCapturing
                    ? isEn
                      ? 'Stop Listening'
                      : 'સાંભળવાનું બંધ કરો'
                    : isEn
                    ? 'Start Live Captions'
                    : 'કૅપ્શન્સ શરૂ કરો'}
                </span>
              </button>

              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  {isCapturing
                    ? isEn
                      ? 'Listening continuously...'
                      : 'સતત સાંભળી રહ્યા છીએ...'
                    : isEn
                    ? 'Microphone is idle'
                    : 'માઇક્રોફોન બંધ છે'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isEn ? 'Locale: gu-IN (Gujarati)' : 'ભાષા: ગુજરાતી (gu-IN)'}
                </span>
              </div>
            </div>

            {/* Actions: Copy, Download, Clear */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={handleCopyCaptions}
                disabled={!captionHistory}
                aria-label={isEn ? 'Copy transcript' : 'ટ્રાન્સક્રિપ્ટ કોપી કરો'}
                title={isEn ? 'Copy transcript' : 'કોપી કરો'}
                className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDownloadCaptions}
                disabled={!captionHistory}
                aria-label={isEn ? 'Download transcript as text' : 'ટ્રાન્સક્રિપ્ટ ડાઉનલોડ કરો'}
                title={isEn ? 'Download transcript' : 'ડાઉનલોડ કરો'}
                className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCaptionHistory('')}
                disabled={!captionHistory}
                aria-label={isEn ? 'Clear transcript' : 'સાફ કરો'}
                title={isEn ? 'Clear transcript' : 'સાફ કરો'}
                className="min-h-[38px] min-w-[38px] p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 disabled:opacity-40 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {captionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{captionError}</span>
            </div>
          )}

          {/* Rolling Captions Viewport (High contrast, Large text) */}
          <div
            role="region"
            aria-live="polite"
            className="p-5 rounded-2xl bg-slate-950 text-white min-h-[240px] max-h-[420px] overflow-y-auto space-y-2 border border-slate-800 shadow-inner"
          >
            {captionHistory ? (
              <p
                lang="gu"
                className={`${captionFontSize} leading-relaxed font-semibold text-slate-100 whitespace-pre-wrap select-text`}
              >
                {captionHistory}
                {interimCaption && (
                  <span className="text-amber-400 font-bold ml-1.5 animate-pulse">
                    {interimCaption}
                  </span>
                )}
              </p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <Radio className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-400">
                  {isEn ? 'No captions yet. Click "Start Live Captions" and speak.' : 'હજુ સુધી કોઈ કૅપ્શન્સ નથી. "કૅપ્શન્સ શરૂ કરો" દબાવો.'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {isEn
                    ? 'Captions will appear continuously in real-time with automatic pause resumption.'
                    : 'બોલાયેલા શબ્દો અહીં આપોઆપ લાઈવ દેખાશે.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4B. TYPE-TO-SPEAK & CUSTOM PHRASES TAB */}
      {/* ==================================================================== */}
      {subTab === 'tts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isEn ? 'Type to Speak in Gujarati' : 'લખો અને ગુજરાતીમાં સાંભળો (TTS)'}
              </h3>
              {/* Playback Rate Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 px-1">{isEn ? 'Speed:' : 'ઝડપ:'}</span>
                {[0.7, 0.9, 1.0, 1.2].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSpeakingRate(r)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                      speakingRate === r ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Input Textarea */}
            <div>
              <textarea
                lang="gu"
                value={speakInput}
                onChange={(e) => setSpeakInput(e.target.value)}
                placeholder={isEn ? 'Type Gujarati text to speak aloud...' : 'અહીં જે બોલાવવું હોય તે ગુજરાતીમાં લખો...'}
                rows={3}
                className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />

              {/* Action Buttons: Speak & Stop */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSpeakText()}
                    disabled={!speakInput.trim() || isSpeakingNow}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-40"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isEn ? 'Speak Text' : 'અવાજમાં બોલો'}</span>
                  </button>

                  {isSpeakingNow && (
                    <button
                      type="button"
                      onClick={handleStopSpeaking}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>{isEn ? 'Stop' : 'બંધ કરો'}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSpeakInput('')}
                  disabled={!speakInput}
                  className="text-xs text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  {isEn ? 'Clear' : 'સાફ કરો'}
                </button>
              </div>
            </div>

            {/* Spoken Text Feedback Card */}
            {currentlySpokenText && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1" aria-live="polite">
                <span className="font-bold text-indigo-900 block">
                  {isEn ? 'Currently Speaking:' : 'હમણાં બોલાઈ રહ્યું છે:'}
                </span>
                <p lang="gu" className="text-slate-800 font-semibold">{currentlySpokenText}</p>
              </div>
            )}

            {voiceNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{voiceNotice}</span>
              </div>
            )}

            {/* Quick Common Phrases */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                {isEn ? 'Preset Quick Phrases (click to speak):' : 'ઝડપી સામાન્ય વાક્યો (બોલાવવા ક્લિક કરો):'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_PHRASES.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSpeakInput(p.text);
                      handleSpeakText(p.text);
                    }}
                    className="min-h-[36px] px-3 py-1 rounded-lg text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 border border-slate-200 transition"
                  >
                    <span lang="gu">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Phrases Box (up to 20 saved phrases in localStorage) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {isEn ? 'Custom Saved Phrases' : 'તમારા સાચવેલા વાક્યો'}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {customPhrases.length} / {MAX_CUSTOM_PHRASES} {isEn ? 'saved' : 'સેવ કરેલ'}
                </span>
              </div>
            </div>

            {/* Add New Phrase Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                lang="gu"
                value={newPhraseInput}
                onChange={(e) => setNewPhraseInput(e.target.value)}
                placeholder={isEn ? 'Add new custom phrase in Gujarati...' : 'નવું વાક્ય ઉમેરો...'}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomPhrase}
                disabled={!newPhraseInput.trim() || customPhrases.length >= MAX_CUSTOM_PHRASES}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Save' : 'ઉમેરો'}</span>
              </button>
            </div>

            {/* List of Saved Phrases */}
            <div className="space-y-1.5 pt-1">
              {customPhrases.map((phrase) => {
                const isEditing = editingPhraseId === phrase.id;

                return (
                  <div
                    key={phrase.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          lang="gu"
                          value={editingPhraseText}
                          onChange={(e) => setEditingPhraseText(e.target.value)}
                          className="flex-1 p-1.5 rounded-lg border border-indigo-400 text-xs font-semibold bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditPhrase(phrase.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhraseId(null)}
                          className="p-1.5 rounded-lg bg-slate-200 text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSpeakText(phrase.text)}
                          className="flex-1 text-left text-xs font-bold text-slate-800 hover:text-indigo-600 transition truncate"
                        >
                          <span lang="gu">{phrase.text}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSpeakText(phrase.text)}
                            aria-label={`Speak ${phrase.text}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPhraseId(phrase.id);
                              setEditingPhraseText(phrase.text);
                            }}
                            aria-label={`Edit ${phrase.text}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhrase(phrase.id)}
                            aria-label={`Delete ${phrase.text}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4C. CONVERSATION MODE TAB (Split-Screen / Dual Role) */}
      {/* ==================================================================== */}
      {subTab === 'conversation' && (
        <div className="space-y-4">
          {/* Conversation Log Viewport */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {isEn ? 'Live Conversation Stream' : 'વાર્તાલાપ પ્રવાહ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
                className="text-xs text-slate-400 hover:text-rose-600 transition disabled:opacity-30"
              >
                {isEn ? 'Clear history' : 'ઇતિહાસ સાફ કરો'}
              </button>
            </div>

            {/* Scrolling Messages Stream */}
            <div className="min-h-[220px] max-h-[360px] overflow-y-auto space-y-2.5 p-2 bg-slate-50/60 rounded-xl border border-slate-200/80">
              {messages.map((msg) => {
                const isSpeaker = msg.sender === 'speaker';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSpeaker ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
                      {isSpeaker ? (isEn ? '🗣️ Speaker (STT)' : '🗣️ બોલનાર') : isEn ? '🤟 Deaf User (Type)' : '🤟 બધિર વપરાશકર્તા'} • {msg.timestamp}
                    </span>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                        isSpeaker
                          ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                          : 'bg-indigo-600 text-white rounded-tr-xs'
                      }`}
                    >
                      <p lang="gu">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split-Screen Interactive Two-Sides Input Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Side 1: Hearing Speaker (STT) */}
            <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {isEn ? 'Hearing Speaker' : 'સાંભળનાર પક્ષ (અવાજ)'}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-1">
                  {isEn ? 'Speak into Mic' : 'માઇકમાં બોલો'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEn ? 'Speech is converted to text for the deaf person to read.' : 'બોલાયેલા શબ્દો બધિર વ્યક્તિ વાંચી શકશે.'}
                </p>

                {/* Speaker Mic Action */}
                <div className="pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSpeakerListening}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      speakerListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {speakerListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{speakerListening ? (isEn ? 'Stop' : 'બંધ') : isEn ? 'Speak Mic' : 'માઇક શરૂ'}</span>
                  </button>

                  <span className="text-xs text-slate-600 font-semibold truncate">
                    {speakerListening ? (isEn ? 'Listening...' : 'સાંભળી રહ્યા છીએ...') : (isEn ? 'Idle' : 'નિષ્ક્રિય')}
                  </span>
                </div>

                {/* Draft Transcript */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-h-[50px] text-xs font-medium text-slate-800">
                  {speakerDraft || (isEn ? 'Recognized text appears here...' : 'બોલેલા શબ્દો અહીં દેખાશે...')}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmSpeakerMessage}
                  disabled={!speakerDraft.trim()}
                  className="min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Post Message' : 'વાર્તાલાપમાં ઉમેરો'}</span>
                </button>
              </div>
            </div>

            {/* Side 2: Deaf User (Type & Speak) */}
            <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {isEn ? 'Deaf / Hard of Hearing' : 'બધિર પક્ષ (લખાણ)'}
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-1">
                  {isEn ? 'Type Response' : 'પ્રત્યુત્તર લખો'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEn ? 'Your text is displayed and spoken aloud to the hearing person.' : 'તમારું લખાણ બોલીને સંભળાવવામાં આવશે.'}
                </p>

                <textarea
                  lang="gu"
                  value={deafInput}
                  onChange={(e) => setDeafInput(e.target.value)}
                  placeholder={isEn ? 'Type reply here in Gujarati...' : 'જવાબ અહીં લખો...'}
                  rows={3}
                  className="w-full mt-2 p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendDeafMessage}
                  disabled={!deafInput.trim()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-40"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isEn ? 'Send & Speak Aloud' : 'મોકલો અને બોલાવો'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
