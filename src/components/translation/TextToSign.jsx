import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { phrasebookData } from '../../data/phrasebookData';
import { Card, Button, Chip, SignVideoButton } from '../ui';
import {
  ArrowRight,
  Volume2,
  Hand,
  AlertCircle
} from 'lucide-react';

const stripPunct = (s) => s.replace(/[,।.?!]/g, ' ');

// Finds whole phrasebook phrases in the text (longest first), in reading order.
// Everything left over is returned as unrecognized words.
export const matchPhrases = (text) => {
  let rest = ` ${stripPunct(text).replace(/\s+/g, ' ').trim()} `;
  const found = [];
  [...phrasebookData]
    .sort((a, b) => b.gujarati.length - a.gujarati.length)
    .forEach(item => {
      const phrase = stripPunct(item.gujarati).replace(/\s+/g, ' ').trim();
      const i = rest.indexOf(` ${phrase} `);
      if (i === -1) return;
      found.push({ item, i });
      rest = rest.slice(0, i + 1) + ' '.repeat(phrase.length) + rest.slice(i + 1 + phrase.length);
    });
  return {
    matches: found.sort((a, b) => a.i - b.i).map(f => f.item),
    unrecognized: rest.split(' ').filter(Boolean)
  };
};

export const TextToSign = () => {
  const { setActiveVideoModal, speakText, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const [inputText, setInputText] = useState('નમસ્તે, મારું નામ આરવ છે. હું શાળાએ જાઉં છું.');
  const [matchedPhrases, setMatchedPhrases] = useState([]);
  const [fingerspelledTokens, setFingerspelledTokens] = useState([]);
  const [activeSignIdx, setActiveSignIdx] = useState(0);

  const handleTranslate = (text = inputText) => {
    if (!text.trim()) return;
    const { matches, unrecognized } = matchPhrases(text);
    // No guessing: words without an approved sign are only listed for fingerspelling
    setMatchedPhrases(matches);
    setFingerspelledTokens(unrecognized);
    setActiveSignIdx(0);
  };

  const current = matchedPhrases[activeSignIdx];

  return (
    <div className="space-y-4">
      {/* Gujarati Text Input Box */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="text-to-sign-input" className="text-lg font-bold font-heading">
            {isEn ? 'Type Gujarati text' : 'ગુજરાતી લખાણ દાખલ કરો'}
          </label>
          <Button variant="ghost" onClick={() => speakText(inputText)}>
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            {isEn ? 'Listen' : 'સાંભળો'}
          </Button>
        </div>

        <textarea
          id="text-to-sign-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isEn ? "Type Gujarati word or sentence here..." : "અહીં ગુજરાતી શબ્દ અથવા વાક્ય લખો..."}
          rows={3}
          className="w-full p-3 rounded-xl border border-line bg-surface text-lg resize-none focus:outline-none focus:border-action focus:ring-2 focus:ring-action/30"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-muted">{isEn ? 'Try:' : 'ઝડપી વાક્યો:'}</span>
          {['નમસ્તે', 'મને મદદ જોઈએ છે', 'હું વિદ્યાર્થી છું', 'આભાર'].map(txt => (
            <Chip key={txt} active={inputText === txt} onClick={() => { setInputText(txt); }}>
              {txt}
            </Chip>
          ))}
        </div>

        <Button onClick={() => handleTranslate()} className="w-full sm:w-auto min-h-[52px] text-base">
          {isEn ? 'Show in sign language' : 'સાઇન લેંગ્વેજમાં રૂપાંતર કરો'}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Button>
      </Card>

      {/* ISL Output Player / Sequence Display */}
      {(matchedPhrases.length > 0 || fingerspelledTokens.length > 0) && (
        <Card className="space-y-4" aria-live="polite">
          {matchedPhrases.length === 0 && (
            <p className="font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-action" aria-hidden="true" />
              {isEn
                ? 'No approved sign found for this text in the phrasebook.'
                : 'આ લખાણ માટે શબ્દકોષમાં માન્ય સંકેત મળ્યો નથી.'}
            </p>
          )}
          {matchedPhrases.length > 0 && (<>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-muted">{isEn ? 'Sign' : 'ISL સંકેત પરિણામ'}</p>
                <h2 className="text-2xl font-bold">{current?.gujarati || 'સાઇન'}</h2>
              </div>
              <span className="text-sm font-semibold text-ink-muted tabular-nums shrink-0">
                {activeSignIdx + 1} / {matchedPhrases.length}
              </span>
            </div>

            <SignVideoButton
              label={isEn ? 'Play the sign' : 'વિડીયો ક્લિપ પ્લે કરો'}
              sublabel={current?.gujarati}
              onClick={() => {
                const cur = matchedPhrases[activeSignIdx];
                setActiveVideoModal({
                  title: cur.gujarati,
                  gujarati: cur.gujarati,
                  english: cur.english,
                  signDescription: cur.signDescription,
                  category: cur.category,
                  videoUrl: cur.videoUrl,
                  verifiedBy: cur.verifiedBy
                });
              }}
            />

            <div className="rounded-xl bg-canvas border border-line p-3 space-y-1">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-action" aria-hidden="true" />
                {isEn ? 'How to sign' : 'સંકેત કેવી રીતે કરવો'}
              </p>
              <p>{current?.signDescription}</p>
              <p className="text-sm text-ink-muted">
                {current?.verifiedBy
                  ? `${isEn ? 'Reviewed by:' : 'ચકાસણી:'} ${current.verifiedBy}`
                  : (isEn ? 'Draft sign description – not yet reviewed by an ISL educator' : 'ડ્રાફ્ટ વર્ણન – ISL શિક્ષક દ્વારા હજુ ચકાસાયેલ નથી')}
              </p>
            </div>

            {/* Sign Sequence Stepper */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label={isEn ? 'Signs in order' : 'સંકેતોનો ક્રમ'}>
              {matchedPhrases.map((phrase, idx) => (
                <Chip key={idx} active={activeSignIdx === idx} onClick={() => setActiveSignIdx(idx)}>
                  {idx + 1}. {phrase.gujarati}
                </Chip>
              ))}
            </div>
          </>)}

          {/* Fallback Fingerspelling Notice */}
          {fingerspelledTokens.length > 0 && (
            <div className="rounded-xl bg-action-soft p-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>{isEn ? 'Fingerspelling:' : 'ફિંગર-સ્પેલિંગ:'}</strong>{' '}
                {isEn ? 'Words ' : 'શબ્દો '}
                <span className="font-bold underline">{fingerspelledTokens.join(', ')}</span>{' '}
                {isEn
                  ? 'are not in the curated dictionary and will be fingerspelled letter-by-letter.'
                  : 'સીધા શબ્દકોષમાં નથી, તેથી ISL નિયમ મુજબ એક-એક અક્ષરથી હસ્તમુદ્રા દ્વારા રજૂ થશે.'}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
