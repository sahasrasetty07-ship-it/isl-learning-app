import React, { useState, useId } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  normalizeGujarati,
  splitSentences,
  toSignSequence,
  calculateCoverage,
} from '../../utils/signMatcher';
import { speak, stopSpeaking } from '../../utils/speech';
import { logTranslationHistory } from '../../utils/translationHistory';
import { supabase } from '../../lib/supabase';
import { SignSequencePlayer } from './SignSequencePlayer';
import {
  Sparkles,
  Volume2,
  Copy,
  Trash2,
  ArrowRight,
  Layers,
  FileText,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Wand2,
  Check,
} from 'lucide-react';

const MAX_CHARS = 5000;

export const TextToSign = () => {
  const { uiLanguage, showToast } = useApp();
  const { user } = useAuth();
  const isEn = uiLanguage === 'en';
  const textareaId = useId();

  // Mode: 'quick' vs 'article'
  const [mode, setMode] = useState('quick');
  const [inputText, setInputText] = useState('નમસ્તે, મારું નામ શું છે? હું વિદ્યાર્થી છું.');

  // Quick mode sequence
  const [sequence, setSequence] = useState([]);
  const [coverage, setCoverage] = useState(null);

  // Article mode state
  const [sentences, setSentences] = useState([]);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifiedReview, setSimplifiedReview] = useState(null);

  // Audio speaking state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check if Simplify feature is enabled via environment
  const isSimplifyEnabled = import.meta.env.VITE_ENABLE_SIMPLIFY === 'true';

  // Perform translation
  const handleTranslate = (text = inputText) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setSequence([]);
      setCoverage(null);
      setSentences([]);
      return;
    }

    // Optional non-blocking translation log
    logTranslationHistory('text-to-sign', trimmed, user?.id);

    if (mode === 'quick') {
      const seq = toSignSequence(trimmed);
      setSequence(seq);
      setCoverage(calculateCoverage(seq));
    } else {
      // Article mode: split into sentences
      const rawSentences = splitSentences(trimmed);
      const processed = rawSentences.map((s, idx) => {
        const seq = toSignSequence(s);
        const cov = calculateCoverage(seq);
        return {
          id: idx,
          text: s,
          sequence: seq,
          coverage: cov,
        };
      });

      setSentences(processed);
      if (processed.length > 0) {
        setActiveSentenceIdx(0);
        setSequence(processed[0].sequence);
        setCoverage(processed[0].coverage);
      }
    }
  };

  // Play a specific sentence in Article mode
  const handlePlaySentence = (idx) => {
    if (sentences[idx]) {
      setActiveSentenceIdx(idx);
      setSequence(sentences[idx].sequence);
      setCoverage(sentences[idx].coverage);
    }
  };

  // "Play all" in Article mode: concatenate all sentence sequences
  const handlePlayAll = () => {
    if (sentences.length === 0) return;
    const combinedSeq = sentences.flatMap((s) => s.sequence);
    setActiveSentenceIdx(-1); // -1 indicates all sentences
    setSequence(combinedSeq);
    setCoverage(calculateCoverage(combinedSeq));
  };

  // Listen: speak input text aloud with TTS
  const handleListen = async () => {
    if (!inputText.trim()) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const result = await speak(inputText, { lang: 'gu-IN', rate: 0.9 });
    setIsSpeaking(false);

    if (!result.ok) {
      if (result.reason === 'no-voice') {
        showToast(
          isEn
            ? 'No Gujarati text-to-speech voice found on your system/browser.'
            : 'તમારા ઉપકરણ કે બ્રાઉઝરમાં ગુજરાતી ભાષાનો અવાજ (TTS) ઉપલબ્ધ નથી.',
          'info'
        );
      } else if (result.reason === 'unsupported') {
        showToast(
          isEn
            ? 'Text-to-speech is not supported in this browser.'
            : 'આ બ્રાઉઝરમાં અવાજ વાંચન (TTS) સપોર્ટેડ નથી.',
          'info'
        );
      }
    }
  };

  // Copy text to clipboard
  const handleCopy = async () => {
    if (!inputText) return;
    try {
      await navigator.clipboard.writeText(inputText);
      showToast(isEn ? 'Copied to clipboard!' : 'ક્લિપબોર્ડ પર કોપી થઈ ગયું!');
    } catch {
      showToast(isEn ? 'Could not copy text.' : 'કોપી થઈ શક્યું નથી.', 'error');
    }
  };

  // Clear input and state
  const handleClear = () => {
    setInputText('');
    setSequence([]);
    setCoverage(null);
    setSentences([]);
    setActiveSentenceIdx(null);
    setSimplifiedReview(null);
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Call Supabase Edge Function to simplify Gujarati
  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    setIsSimplifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('simplify-gujarati', {
        body: { text: inputText },
      });

      if (error || !data?.ok) {
        throw new Error(error?.message || data?.error || 'Simplification failed');
      }

      setSimplifiedReview(data.simplifiedText);
      showToast(
        isEn
          ? 'Article simplified! You can review or edit it below.'
          : 'લેખ સરળ કરવામાં આવ્યો! નીચે સમીક્ષા કરો.'
      );
    } catch (err) {
      showToast(
        isEn
          ? `Simplify error: ${err.message}`
          : `સરળીકરણ ઉપલબ્ધ નથી: ${err.message}`,
        'info'
      );
    } finally {
      setIsSimplifying(false);
    }
  };

  // Accept reviewed simplified text
  const applySimplifiedText = () => {
    if (simplifiedReview) {
      setInputText(simplifiedReview);
      setSimplifiedReview(null);
      handleTranslate(simplifiedReview);
    }
  };

  // Set of unsupported words in current sequence for visual text highlighting
  const unsupportedWordsSet = new Set(
    (sequence || [])
      .filter((item) => item.type === 'unsupported')
      .map((item) => normalizeGujarati(item.word))
  );

  return (
    <div className="space-y-4">
      {/* Input & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5">
        {/* Top Controls: Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
          {/* Mode Switcher */}
          <div
            className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl"
            role="radiogroup"
            aria-label={isEn ? 'Translation mode' : 'અનુવાદ મોડ'}
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === 'quick'}
              onClick={() => {
                setMode('quick');
                if (inputText.trim()) handleTranslate(inputText);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                mode === 'quick'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEn ? 'Quick Mode' : 'ઝડપી મોડ'}</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={mode === 'article'}
              onClick={() => {
                setMode('article');
                if (inputText.trim()) handleTranslate(inputText);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 ${
                mode === 'article'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isEn ? 'Article Mode' : 'લેખ મોડ'}</span>
            </button>
          </div>

          {/* Additional Tool Buttons: Listen, Copy, Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleListen}
              title={isEn ? 'Listen to text (TTS)' : 'ટેક્સ્ટ સાંભળો'}
              aria-label={isEn ? 'Listen to text' : 'ટેક્સ્ટ સાંભળો'}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isSpeaking
                  ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">{isSpeaking ? (isEn ? 'Speaking...' : 'બોલી રહ્યા છીએ...') : (isEn ? 'Listen' : 'સાંભળો')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={isEn ? 'Copy input text' : 'કોપી કરો'}
              aria-label={isEn ? 'Copy text' : 'ટેક્સ્ટ કોપી કરો'}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{isEn ? 'Copy' : 'કોપી'}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              title={isEn ? 'Clear all' : 'સાફ કરો'}
              aria-label={isEn ? 'Clear input' : 'ખાલી કરો'}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-bold flex items-center gap-1 transition focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Clear' : 'સાફ'}</span>
            </button>
          </div>
        </div>

        {/* Textarea Input */}
        <div>
          <label
            htmlFor={textareaId}
            className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1"
          >
            {isEn
              ? mode === 'article'
                ? 'Enter or paste Gujarati article (max 5,000 characters):'
                : 'Enter Gujarati text or sentence:'
              : mode === 'article'
              ? 'ગુજરાતી લેખ અથવા ફકરો દાખલ કરો (મહત્તમ ૫,૦૦૦ અક્ષર):'
              : 'ગુજરાતી શબ્દ કે વાક્ય દાખલ કરો:'}
          </label>

          <textarea
            id={textareaId}
            lang="gu"
            value={inputText}
            maxLength={MAX_CHARS}
            onChange={(e) => setInputText(e.target.value)}
            rows={mode === 'article' ? 6 : 3}
            placeholder={
              isEn
                ? 'Type or paste Gujarati text here...'
                : 'અહીં ગુજરાતી શબ્દો, વાક્યો અથવા લેખ લખો કે પેસ્ટ કરો...'
            }
            className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium leading-relaxed resize-y"
          />

          {/* Character counter & quick sample phrases */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400">{isEn ? 'Quick samples:' : 'ઝડપી નમૂના:'}</span>
              {['નમસ્તે', 'શુભ સવાર', 'તમારું નામ શું છે?', 'કમળ અને ઘર'].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => {
                    setInputText(txt);
                    handleTranslate(txt);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 transition border border-slate-200"
                >
                  <span lang="gu">{txt}</span>
                </button>
              ))}
            </div>

            <span
              className={`font-semibold shrink-0 ml-2 ${
                inputText.length > MAX_CHARS * 0.9 ? 'text-rose-500 font-bold' : ''
              }`}
            >
              {inputText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Simplify for Signing Section (Article Mode Only) */}
        {mode === 'article' && isSimplifyEnabled && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={isSimplifying || !inputText.trim()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold inline-flex items-center gap-2 transition focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span>
                {isSimplifying
                  ? isEn
                    ? 'Simplifying with AI...'
                    : 'સરળીકરણ થઈ રહ્યું છે...'
                  : isEn
                  ? 'Simplify for signing (AI)'
                  : 'સાઇનિંગ માટે સરળ બનાવો'}
              </span>
            </button>
          </div>
        )}

        {/* Simplified Review Banner */}
        {simplifiedReview && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {isEn ? 'Review Simplified Text:' : 'સરળ કરેલ ટેક્સ્ટની સમીક્ષા કરો:'}
              </span>
              <button
                type="button"
                onClick={() => setSimplifiedReview(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {isEn ? 'Cancel' : 'રદ કરો'}
              </button>
            </div>
            <textarea
              lang="gu"
              value={simplifiedReview}
              onChange={(e) => setSimplifiedReview(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg border border-purple-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={applySimplifiedText}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? 'Apply & Translate' : 'લાગુ કરો અને રૂપાંતર કરો'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Translate Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => handleTranslate()}
            className="min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span>{isEn ? 'Convert to Sign Language' : 'સાઇન લેંગ્વેજમાં રૂપાંતર કરો'}</span>
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
              <Layers className="w-4 h-4 text-amber-500" />
              {isEn ? 'Sign Translation Coverage Summary' : 'સાઇન અનુવાદ કવરેજ સારાંશ'}
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {coverage.coveragePercent}% {isEn ? 'Covered' : 'સંપૂર્ણ'}
            </span>
          </div>

          {/* Coverage Stat Badges */}
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

          {/* Highlighted Original Text Showing Unsupported Words */}
          {coverage.unsupportedWords > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {isEn
                    ? 'Highlighted words currently lack approved ISL signs (shown in pink):'
                    : 'ગુલાબી રંગમાં દર્શાવેલા શબ્દો માટે માન્ય સંકેત ઉપલબ્ધ નથી:'}
                </span>
              </div>
              <p lang="gu" className="text-slate-800 leading-relaxed font-medium">
                {inputText.split(/\s+/).map((word, i) => {
                  const isUnsupported = unsupportedWordsSet.has(normalizeGujarati(word));
                  return (
                    <span
                      key={i}
                      className={
                        isUnsupported
                          ? 'bg-rose-200 text-rose-950 font-bold px-1 py-0.5 rounded mx-0.5 border border-rose-300'
                          : 'mx-0.5'
                      }
                    >
                      {word}
                    </span>
                  );
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Article Mode: Sentence List & Controls */}
      {mode === 'article' && sentences.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              {isEn ? 'Article Sentences Breakdown' : 'વાક્ય અનુસાર વિભાજન'}
            </span>
            <button
              type="button"
              onClick={handlePlayAll}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeSentenceIdx === -1
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isEn ? 'Play All Sentences' : 'બધા વાક્યો ચલાવો'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {sentences.map((sent, idx) => {
              const isActive = activeSentenceIdx === idx;
              const covered = sent.coverage.matchedWords + sent.coverage.fingerspelledWords;
              const total = sent.coverage.totalWords;

              return (
                <div
                  key={sent.id}
                  className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isActive
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sent.coverage.coveragePercent === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {covered}/{total} {isEn ? 'words covered' : 'શબ્દો ઉપલબ્ધ'}
                      </span>
                    </div>
                    <p lang="gu" className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {sent.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlaySentence(idx)}
                    aria-label={`Play sentence ${idx + 1}`}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isActive ? (isEn ? 'Playing' : 'ચાલુ') : isEn ? 'Play' : 'પ્લે'}</span>
                  </button>
                </div>
              );
            })}
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
