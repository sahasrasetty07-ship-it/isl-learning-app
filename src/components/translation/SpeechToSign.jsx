import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { phrasebookData } from '../../data/phrasebookData';
import { gujaratiAlphabets } from '../../data/gujaratiAlphabets';
import { gujaratiNumbers } from '../../data/gujaratiNumbers';
import {
  Mic,
  MicOff,
  Volume2,
  Video,
  AlertCircle,
  Hand
} from 'lucide-react';
import { Card, Button, Chip } from '../ui';

// Normalize text for consistent matching: Unicode NFC, strip punctuation, collapse whitespace
const stripPunct = (s) =>
  (s || '')
    .normalize('NFC')
    .replace(/[,।.?!:;"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Pre-compiled list of verified dictionary items from project data.
// Note: Individual alphabet letters (ક, ખ, ગ) are intentionally omitted because
// gujaratiAlphabets only contains concept signs for example words (કમળ, ખલ), not ISL letter signs.
const buildApprovedDictionary = () => {
  const dict = [];
  const seen = new Set();

  // 1. Curated Multi-word & Single-word Phrases (highest priority)
  phrasebookData.forEach(p => {
    const key = stripPunct(p.gujarati);
    if (key && !seen.has(key)) {
      seen.add(key);
      dict.push({
        gujarati: p.gujarati,
        english: p.english,
        signDescription: p.signDescription,
        handShape: p.handShape || null,
        meaning: p.meaning || null,
        category: p.category || 'અભિવાદન/વાક્ય',
        matchType: 'phrase'
      });
    }
  });

  // 2. Verified ISL Number Signs (words like એક, બે and numerals ૧, ૨)
  gujaratiNumbers.forEach(n => {
    const keyWord = stripPunct(n.word);
    if (keyWord && !seen.has(keyWord)) {
      seen.add(keyWord);
      dict.push({
        gujarati: n.word,
        english: n.englishWord,
        signDescription: n.signDescription,
        handShape: n.handShape || null,
        meaning: `${n.englishNumber} - ${n.objectName || ''}`,
        category: 'સંખ્યા (Numbers)',
        matchType: 'number'
      });
    }
    const keyNum = stripPunct(n.number);
    if (keyNum && !seen.has(keyNum)) {
      seen.add(keyNum);
      dict.push({
        gujarati: n.number,
        english: `${n.word} (${n.englishNumber})`,
        signDescription: n.signDescription,
        handShape: n.handShape || null,
        meaning: n.objectName || null,
        category: 'સંખ્યા (Numbers)',
        matchType: 'number'
      });
    }
  });

  // 3. Verified Concept Words from Alphabet curriculum (e.g. કમળ, ખલ, ગણપતિ, ઘર)
  // Only the concept word is added since signDescription represents the object, not the letter.
  gujaratiAlphabets.forEach(a => {
    if (a.word) {
      const keyWord = stripPunct(a.word);
      if (keyWord && !seen.has(keyWord)) {
        seen.add(keyWord);
        dict.push({
          gujarati: a.word,
          english: a.wordEnglish || a.word,
          signDescription: a.signDescription,
          handShape: a.handShape || null,
          meaning: a.meaning || null,
          category: a.category || 'શબ્દ (Word)',
          matchType: 'word'
        });
      }
    }
  });

  // Sort longest first so multi-word phrases match before individual words
  return dict.sort((a, b) => stripPunct(b.gujarati).length - stripPunct(a.gujarati).length);
};

const APPROVED_DICTIONARY = buildApprovedDictionary();

// Reliable longest-phrase matcher with exact boundary matching (prevents false matches like "ના" inside "નામ")
export const matchSpeechToSigns = (rawText) => {
  if (!rawText || !rawText.trim()) {
    return { matches: [], unmatchedWords: [] };
  }

  const normalized = stripPunct(rawText);
  let rest = ` ${normalized} `;
  const found = [];

  APPROVED_DICTIONARY.forEach(item => {
    const phrase = stripPunct(item.gujarati);
    if (!phrase) return;
    const target = ` ${phrase} `;
    let pos = rest.indexOf(target);
    while (pos !== -1) {
      found.push({ item, pos });
      // Mask out the matched portion with spaces so it cannot be re-matched
      rest = rest.slice(0, pos + 1) + ' '.repeat(phrase.length) + rest.slice(pos + 1 + phrase.length);
      pos = rest.indexOf(target);
    }
  });

  // Preserve the order of speech in the sentence
  const matches = found.sort((a, b) => a.pos - b.pos).map(f => f.item);
  const unmatchedWords = rest.split(/\s+/).filter(Boolean);

  return { matches, unmatchedWords };
};

export const SpeechToSign = () => {
  const { setActiveVideoModal, speakText, showToast, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [matchedSigns, setMatchedSigns] = useState([]);
  const [unmatchedWords, setUnmatchedWords] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);
  // Recognition handlers are created once; read the latest language/toast through a ref
  const latestRef = useRef({ isEn, showToast });
  latestRef.current = { isEn, showToast };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'gu-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        processSpeech(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        const { isEn, showToast } = latestRef.current;
        showToast(
          isEn
            ? 'Microphone or online STT unavailable in this browser. Try the quick test phrases below.'
            : 'માઈક્રોફોન અથવા વાણી ઓળખ ઉપલબ્ધ નથી. નીચે આપેલા પ્રીસેટ વાક્યો વાપરો.',
          'info'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      return () => recognition.abort();
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(false);
        }
      } else {
        showToast(
          isEn
            ? 'Browser speech recognition (gu-IN) is not supported in this browser. Please use quick test phrases below or Text to Sign.'
            : 'આ બ્રાઉઝરમાં ગુજરાતી સ્પીચ રેકગ્નિશન સપોર્ટેડ નથી. નીચે આપેલા ટેસ્ટ વાક્યો અથવા ટેક્સ્ટ-ટુ-સાઇન વાપરો.',
          'info'
        );
      }
    }
  };

  const handleSelectTestPhrase = (text) => {
    setSpokenText(text);
    processSpeech(text);
  };

  const processSpeech = (text) => {
    if (!text || !text.trim()) {
      setMatchedSigns([]);
      setUnmatchedWords([]);
      return;
    }
    const { matches, unmatchedWords: unmatched } = matchSpeechToSigns(text);
    setMatchedSigns(matches);
    setUnmatchedWords(unmatched);
  };

  return (
    <div className="space-y-4">
      {/* Mic Input Container */}
      <Card className="text-center space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            {isEn ? 'Speak Gujarati, see the signs' : 'ગુજરાતીમાં બોલો અને સાઇન સંકેત મેળવો'}
          </h2>
          <p className="text-sm text-ink-muted max-w-sm mx-auto mt-1">
            {isEn
              ? 'Spoken Gujarati is written out as text and matched to approved ISL sign guides.'
              : 'ગુજરાતી અવાજ આપોઆપ લખાણમાં રૂપાંતરિત થઈને અધિકૃત ISL સંકેતો દર્શાવશે.'}
          </p>
        </div>

        {/* Mic button: state shown by icon and text, not colour alone */}
        <div className="py-2">
          <button
            type="button"
            onClick={toggleListening}
            aria-pressed={isListening}
            aria-label={isListening ? (isEn ? 'Stop listening' : 'સાંભળવાનું બંધ કરો') : (isEn ? 'Start listening' : 'સાંભળવાનું શરૂ કરો')}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition active:scale-95 ${
              isListening
                ? 'bg-ink text-white ring-8 ring-action-soft animate-record-pulse'
                : 'bg-action hover:bg-action-hover text-white'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" aria-hidden="true" /> : <Mic className="w-10 h-10" aria-hidden="true" />}
          </button>
          <p className="font-semibold mt-3" aria-live="polite">
            {isListening
              ? (isEn ? 'Listening in Gujarati... speak now' : 'સાંભળી રહ્યા છીએ... બોલો')
              : (isEn ? 'Tap the mic and speak Gujarati' : 'માઇક દબાવી ગુજરાતીમાં બોલો')}
          </p>
        </div>

        {!speechSupported && (
          <p className="text-sm p-3 rounded-xl bg-canvas border border-line text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {isEn
                ? 'Browser speech recognition (gu-IN) is not available in this browser. You can click the test phrases below to test sign matching.'
                : 'તમારા બ્રાઉઝરમાં ગુજરાતી વાણી ઓળખ ઉપલબ્ધ નથી. સાઇન સંકેત જોવા માટે નીચેના ટેસ્ટ વાક્યો વાપરો.'}
            </span>
          </p>
        )}

        {/* Quick Test Phrases */}
        <div className="border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink-muted mb-2">
            {isEn ? 'Or try a phrase:' : 'ઝડપી ટેસ્ટ વાક્યો:'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              'નમસ્તે, તમારું નામ શું છે?',
              'મને મદદ જોઈએ છે',
              'હું વિદ્યાર્થી છું',
              'શુભ સવાર',
              'કમળ અને ઘર',
              'એક બે ત્રણ'
            ].map(txt => (
              <Chip key={txt} active={spokenText === txt} onClick={() => handleSelectTestPhrase(txt)}>
                {txt}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* Recognized Speech Result */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isEn ? 'What was said' : 'ઓળખાયેલ ગુજરાતી વાણી'}</h2>
          {spokenText && (
            <Button variant="secondary" onClick={() => speakText(spokenText)}>
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'Replay' : 'ફરી સાંભળો'}
            </Button>
          )}
        </div>
        {spokenText ? (
          <p className="text-xl font-bold p-3 rounded-xl bg-canvas border border-line">{spokenText}</p>
        ) : (
          <p className="text-sm text-ink-muted p-3 rounded-xl border border-dashed border-line">
            {isEn
              ? 'No speech captured yet. Tap the mic or choose a test phrase above.'
              : 'હજુ કોઈ વાણી પકડાઈ નથી. માઇક દબાવો અથવા ઉપરથી ટેસ્ટ વાક્ય પસંદ કરો.'}
          </p>
        )}
      </Card>

      {/* Matched Sign Language Sequences */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-action" aria-hidden="true" />
            {isEn ? 'Signs' : 'મેળવાયેલા સાઇન સંકેતો'}
          </h2>
          <span className="text-sm text-ink-muted">
            {matchedSigns.length} {isEn ? 'found' : 'સાઇન ઉપલબ્ધ'}
          </span>
        </div>

        {/* No Direct Match State */}
        {matchedSigns.length === 0 && spokenText && (
          <div className="p-5 rounded-xl bg-canvas border border-line text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-action mx-auto" aria-hidden="true" />
            <p className="font-bold">
              {isEn ? 'No matching signs found in dictionary.' : 'આ વાણી માટે શબ્દકોષમાં કોઈ સંકેત મળ્યો નથી.'}
            </p>
            {unmatchedWords.length > 0 && (
              <p className="text-sm max-w-sm mx-auto">
                {isEn ? 'Unsupported words: ' : 'ઉપલબ્ધ ન હોય તેવા શબ્દો: '}
                <span className="font-semibold">{unmatchedWords.join(', ')}</span>
              </p>
            )}
            <p className="text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
              {isEn
                ? 'The current dictionary covers curated greetings, school phrases, numbers (1-10), and select vocabulary words. Additional signs will be added in future updates.'
                : 'હાલનો શબ્દકોષ મુખ્ય અભિવાદન, શાળા વાક્યો, અંકો (૧-૧૦) અને પસંદગીના શબ્દો આવરી લે છે. વધુ સંકેતો ભવિષ્યમાં ઉમેરવામાં આવશે.'}
            </p>
          </div>
        )}

        {/* Idle prompt before speech */}
        {matchedSigns.length === 0 && !spokenText && (
          <p className="p-5 rounded-xl bg-canvas border border-line text-center text-sm text-ink-muted">
            {isEn
              ? 'Speak into the mic or select a test phrase to display matching ISL signs.'
              : 'સાઇન સંકેતો જોવા માટે માઇકમાં બોલો અથવા ટેસ્ટ વાક્ય પસંદ કરો.'}
          </p>
        )}

        {/* Matched Sign Grid */}
        {matchedSigns.length > 0 && (
          <div className="space-y-3">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchedSigns.map((item, idx) => (
                <li key={idx} className="p-4 rounded-xl bg-canvas border border-line flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-bold leading-tight">{item.gujarati}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-surface border border-line shrink-0">
                        {item.matchType === 'phrase'
                          ? (isEn ? 'Full phrase' : 'વાક્ય સંકેત')
                          : item.matchType === 'number'
                          ? (isEn ? 'Number' : 'સંખ્યા સંકેત')
                          : (isEn ? 'Word' : 'શબ્દ સંકેત')}
                      </span>
                    </div>
                    <p className="text-sm text-ink-muted">{item.english} · {item.category}</p>
                    <p className="text-sm leading-relaxed">{item.signDescription}</p>
                    {item.handShape && (
                      <p className="text-sm text-ink-muted flex items-start gap-1.5">
                        <Hand className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        {item.handShape}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setActiveVideoModal({
                        title: item.gujarati,
                        gujarati: item.gujarati,
                        english: item.english,
                        signDescription: item.signDescription,
                        handShape: item.handShape,
                        meaning: item.meaning,
                        category: item.category
                      });
                    }}
                    className="w-full"
                  >
                    <Video className="w-4 h-4" aria-hidden="true" />
                    {isEn ? 'Watch the sign' : 'સાઇન માર્ગદર્શિકા જુઓ'}
                  </Button>
                </li>
              ))}
            </ul>

            {/* Notice for unsupported words in an otherwise matched sentence */}
            {unmatchedWords.length > 0 && (
              <div className="p-3 rounded-xl bg-canvas border border-line text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold">{isEn ? 'Unsupported words:' : 'શબ્દકોષમાં ઉપલબ્ધ ન હોય તેવા શબ્દો:'}</span>{' '}
                  <span className="font-semibold">{unmatchedWords.join(', ')}</span>
                  <p className="text-ink-muted mt-0.5">
                    {isEn
                      ? 'These words are currently not in the curated sign dictionary.'
                      : 'આ શબ્દો માટે હાલના શબ્દકોષમાં સંકેત ઉપલબ્ધ નથી.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
