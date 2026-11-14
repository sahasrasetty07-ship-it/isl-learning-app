import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gujaratiAlphabets, sampleSentences } from '../../data/gujaratiAlphabets';
import { gujaratiNumbers } from '../../data/gujaratiNumbers';
import { getSignVideo } from '../../data/signVideos';
import { WritingPad } from './WritingPad';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { LessonClipButtons } from '../common/LessonClipButtons';
import { LessonClipModal } from '../common/LessonClipModal';
import { letterClipItem, numberClipItem } from '../../data/lessonClips';
import { PageHeader, Tabs, Chip, Card, IconButton, SignVideoButton, Button, buttonClass } from '../ui';
import {
  BookOpen,
  Hash,
  MessageSquare,
  Video,
  Hand,
  Volume2,
  PenLine
} from 'lucide-react';

export const GujaratiModule = () => {
  const { setActiveVideoModal, speakText, uiLanguage, markClipWatched, setActiveTab } = useApp();
  const isEn = uiLanguage === 'en';
  
  // Sub-tabs: 'alphabets' | 'numbers' | 'sentences'
  const [subTab, setSubTab] = useState('alphabets');
  
  // Selected items
  const [selectedLetter, setSelectedLetter] = useState(gujaratiAlphabets[0]);
  const [selectedNumber, setSelectedNumber] = useState(gujaratiNumbers[0]);
  const [filterCategory, setFilterCategory] = useState('all');
  // Open lesson clip: { item, type: 'write' | 'say' } or null
  const [openClip, setOpenClip] = useState(null);
  const letterClip = letterClipItem(selectedLetter);
  const numberClip = numberClipItem(selectedNumber);

  const filteredAlphabets = gujaratiAlphabets.filter(item => {
    if (filterCategory === 'all') return true;
    return item.type === filterCategory;
  });

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const letterIndex = filteredAlphabets.findIndex(item => item.id === selectedLetter.id);
  const numberIndex = gujaratiNumbers.findIndex(item => item.id === selectedNumber.id);

  const handlePreviousLetter = () => {
    const idx = letterIndex > 0 ? letterIndex - 1 : 0;
    const item = filteredAlphabets[idx];
    setSelectedLetter(item);
    speakText(item.letter);
  };

  const handleNextLetter = () => {
    const idx = letterIndex < filteredAlphabets.length - 1 ? letterIndex + 1 : filteredAlphabets.length - 1;
    const item = filteredAlphabets[idx];
    setSelectedLetter(item);
    speakText(item.letter);
  };

  const handlePreviousNumber = () => {
    const idx = numberIndex > 0 ? numberIndex - 1 : 0;
    const item = gujaratiNumbers[idx];
    setSelectedNumber(item);
    speakText(item.word);
  };

  const handleNextNumber = () => {
    const idx = numberIndex < gujaratiNumbers.length - 1 ? numberIndex + 1 : gujaratiNumbers.length - 1;
    const item = gujaratiNumbers[idx];
    setSelectedNumber(item);
    speakText(item.word);
  };

  const openSignModal = (item) => {
    const videoEntry = getSignVideo(item?.id);
    // Opening the sign clip counts as watching it for lesson progress
    const clipItem = item.letter ? letterClipItem(item) : item.number ? numberClipItem(item) : null;
    if (clipItem) markClipWatched(clipItem, 'sign');
    setActiveVideoModal({
      title: `${item.name || item.word} - ISL Sign`,
      gujarati: item.letter || item.number || item.word,
      english: item.wordEnglish || item.englishWord,
      signDescription: item.signDescription,
      handShape: item.handShape,
      meaning: item.meaning,
      category: item.category || 'Gujarati Learning',
      videoUrl: item.videoUrl || null,
      youtubeId: videoEntry?.youtubeId || null,
      startTime: videoEntry?.startTime ?? null,
      endTime: videoEntry?.endTime ?? null,
      status: videoEntry?.status || 'pending',
      source: videoEntry?.source || 'ISLRTC',
      verifiedBy: videoEntry?.verifiedBy || null
    });
  };

  // Lesson card: sign video first (largest), then letter and word, then the next step
  const lessonCard = ({ item, glyph, title, subtitle, tag, speak, signLabel, children, clip }) => (
    <Card className="space-y-4">
      <SignVideoButton
        onClick={() => openSignModal(item)}
        glyph={glyph}
        label={signLabel}
        sublabel={`${glyph} · ${title}`}
      />
      <div className="flex items-center gap-4">
        <span className="w-20 h-20 shrink-0 rounded-2xl bg-gujarati-soft text-gujarati flex items-center justify-center font-heading font-bold text-5xl leading-none pt-2">
          {glyph}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold leading-tight">{title}</h2>
          <p className="text-ink-muted">{subtitle}</p>
          {tag && <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-canvas border border-line">{tag}</span>}
        </div>
        <IconButton onClick={speak} label={isEn ? 'Listen to pronunciation' : 'અવાજ સાંભળો'}>
          <Volume2 className="w-5 h-5" aria-hidden="true" />
        </IconButton>
      </div>
      <a href="#writing-pad" className={buttonClass('primary', 'w-full min-h-[52px] text-base')}>
        <PenLine className="w-5 h-5" aria-hidden="true" />
        {isEn ? 'Practise writing' : 'લખવાનો મહાવરો કરો'}
      </a>
      <LessonClipButtons item={clip} onOpen={type => setOpenClip({ item: clip, type })} />
      {children}
    </Card>
  );

  const howToSign = (text, extra) => (
    <div className="rounded-xl bg-canvas border border-line p-3 space-y-1">
      <p className="text-sm font-bold flex items-center gap-1.5">
        <Hand className="w-4 h-4 text-action" aria-hidden="true" />
        {isEn ? 'How to sign' : 'સંકેત કેવી રીતે કરવો'}
      </p>
      <p className="text-sm leading-relaxed">{text}</p>
      {extra}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        onBack={() => setActiveTab('learn')}
        backLabel={isEn ? 'Learn' : 'શીખો'}
        icon={BookOpen}
        tone="gujarati"
        title={isEn ? 'Gujarati' : 'ગુજરાતી'}
        subtitle={isEn ? 'Letters, numbers and sentences with signs' : 'સંકેતો સાથે અક્ષરો, અંકો અને વાક્યો'}
      />
      <AssignmentBanner subjectKey="gujarati" />

      <Tabs
        label={isEn ? 'Gujarati lessons' : 'ગુજરાતી પાઠ'}
        value={subTab}
        onChange={setSubTab}
        items={[
          { id: 'alphabets', icon: BookOpen, label: isEn ? 'Letters' : 'મૂળાક્ષરો' },
          { id: 'numbers', icon: Hash, label: isEn ? 'Numbers' : 'અંકો' },
          { id: 'sentences', icon: MessageSquare, label: isEn ? 'Sentences' : 'વાક્યો' }
        ]}
      />

      {/* ===================== SUBTAB 1: ALPHABETS ===================== */}
      {subTab === 'alphabets' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={isEn ? 'Letter type' : 'અક્ષર પ્રકાર'}>
            {[
              { id: 'all', label: isEn ? 'All' : 'બધા' },
              { id: 'consonant', label: isEn ? 'Consonants' : 'વ્યંજન' },
              { id: 'vowel', label: isEn ? 'Vowels' : 'સ્વર' },
            ].map(f => (
              <Chip key={f.id} active={filterCategory === f.id} onClick={() => setFilterCategory(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>

          {/* Letter picker */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label={isEn ? 'Choose a letter' : 'અક્ષર પસંદ કરો'}>
            {filteredAlphabets.map(item => {
              const isSelected = selectedLetter.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedLetter(item);
                    speakText(item.letter);
                  }}
                  className={`shrink-0 w-[72px] min-h-[76px] flex flex-col items-center justify-center rounded-2xl border-2 transition ${
                    isSelected
                      ? 'bg-gujarati border-gujarati text-white'
                      : 'bg-surface border-line hover:border-gujarati'
                  }`}
                >
                  <span className="font-heading font-bold text-3xl leading-none pt-1">{item.letter}</span>
                  <span className={`text-xs truncate w-full text-center px-1 ${isSelected ? 'font-bold' : 'text-ink-muted'}`}>{item.word}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {lessonCard({
              item: selectedLetter,
              glyph: selectedLetter.letter,
              title: selectedLetter.word,
              subtitle: selectedLetter.wordEnglish,
              tag: isEn ? selectedLetter.english : selectedLetter.category,
              speak: () => speakText(`${selectedLetter.letter} એટલે ${selectedLetter.word}`),
              signLabel: isEn ? 'Watch the sign' : 'સંકેત જુઓ',
              clip: letterClip,
              children: howToSign(
                selectedLetter.signDescription,
                <p className="text-sm text-ink-muted">{isEn ? 'Hand shape:' : 'હસ્તમુદ્રા:'} {selectedLetter.handShape}</p>
              )
            })}

            <div id="writing-pad" className="scroll-mt-20">
              <WritingPad
                targetLetter={selectedLetter.letter}
                targetWord={selectedLetter.word}
                letterMeaning={selectedLetter.meaning}
                onSignClick={() => openSignModal(selectedLetter)}
                traceGuide={selectedLetter.traceGuide || ''}
                currentIndex={letterIndex >= 0 ? letterIndex : 0}
                totalItems={filteredAlphabets.length}
                onPrevious={handlePreviousLetter}
                onNext={handleNextLetter}
                hasPrevious={letterIndex > 0}
                hasNext={letterIndex < filteredAlphabets.length - 1}
                onOpenClip={type => setOpenClip({ item: letterClip, type })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: NUMBERS ===================== */}
      {subTab === 'numbers' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label={isEn ? 'Choose a number' : 'અંક પસંદ કરો'}>
            {gujaratiNumbers.map(item => {
              const isSelected = selectedNumber.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedNumber(item);
                    speakText(item.word);
                  }}
                  className={`shrink-0 w-[72px] min-h-[76px] flex flex-col items-center justify-center rounded-2xl border-2 transition ${
                    isSelected
                      ? 'bg-gujarati border-gujarati text-white'
                      : 'bg-surface border-line hover:border-gujarati'
                  }`}
                >
                  <span className="font-heading font-bold text-3xl leading-none pt-1">{item.number}</span>
                  <span className={`text-xs ${isSelected ? 'font-bold' : 'text-ink-muted'}`}>{item.word}</span>
                  <span className={`text-xs tabular-nums ${isSelected ? '' : 'text-ink-muted'}`}>{item.englishNumber}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {lessonCard({
              item: selectedNumber,
              glyph: selectedNumber.number,
              title: `${selectedNumber.word} (${selectedNumber.englishWord})`,
              subtitle: isEn ? `Gujarati numeral for ${selectedNumber.englishNumber}` : `સંખ્યા અંક ${selectedNumber.englishNumber}`,
              speak: () => speakText(selectedNumber.word),
              signLabel: isEn ? 'Watch the number sign' : 'સંખ્યાનો સંકેત જુઓ',
              clip: numberClip,
              children: (
                <>
                  {/* Counting picture: one dot per unit */}
                  <div className="rounded-xl bg-gujarati-soft p-3 text-center space-y-2">
                    <p className="text-sm font-bold">{selectedNumber.objectName}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2" role="img" aria-label={`${selectedNumber.englishNumber}`}>
                      {[...Array(selectedNumber.dots)].map((_, i) => (
                        <span key={i} className="w-6 h-6 rounded-full bg-gujarati" />
                      ))}
                    </div>
                  </div>
                  {howToSign(selectedNumber.signDescription)}
                </>
              )
            })}

            <div id="writing-pad" className="scroll-mt-20">
              <WritingPad
                targetLetter={selectedNumber.number}
                targetWord={`${selectedNumber.word} (${selectedNumber.englishNumber})`}
                letterMeaning={selectedNumber.signDescription}
                onSignClick={() => openSignModal(selectedNumber)}
                traceGuide={selectedNumber.traceGuide || ''}
                currentIndex={numberIndex >= 0 ? numberIndex : 0}
                totalItems={gujaratiNumbers.length}
                onPrevious={handlePreviousNumber}
                onNext={handleNextNumber}
                hasPrevious={numberIndex > 0}
                hasNext={numberIndex < gujaratiNumbers.length - 1}
                onOpenClip={type => setOpenClip({ item: numberClip, type })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 3: SENTENCES ===================== */}
      {subTab === 'sentences' && (
        <div className="space-y-3">
          <p className="text-ink-muted">
            {isEn
              ? 'Everyday sentences for school and home, signed word by word.'
              : 'શાળા અને ઘર માટેનાં રોજિંદાં વાક્યો, શબ્દ પ્રમાણે સંકેત સાથે.'}
          </p>
          {sampleSentences.map(s => (
            <Card key={s.id} as="article" className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold leading-tight">{s.gujarati}</h3>
                  <p className="text-ink-muted">{s.english}</p>
                </div>
                <IconButton onClick={() => speakText(s.gujarati)} label={isEn ? 'Listen' : 'સાંભળો'}>
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                </IconButton>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-ink-muted font-semibold mr-1">{isEn ? 'Signs in order:' : 'સંકેતોનો ક્રમ:'}</span>
                {s.signBreakdown.map((item, idx) => (
                  <span key={idx} className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-canvas border border-line">
                    {item}
                  </span>
                ))}
              </div>

              {howToSign(s.signDescription)}

              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  const videoEntry = getSignVideo(s.id);
                  setActiveVideoModal({
                    title: s.gujarati,
                    gujarati: s.gujarati,
                    english: s.english,
                    signDescription: s.signDescription,
                    handShape: 'Sentence Sign Sequence',
                    category: s.category,
                    youtubeId: s.youtubeId || videoEntry?.youtubeId || null,
                    startTime: s.startTime ?? videoEntry?.startTime ?? null,
                    endTime: s.endTime ?? videoEntry?.endTime ?? null,
                    status: videoEntry?.status || 'approved'
                  });
                }}
              >
                <Video className="w-4 h-4" aria-hidden="true" />
                {isEn ? 'Watch the sign' : 'સંકેત જુઓ'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <LessonClipModal
        clip={openClip}
        onClose={() => setOpenClip(null)}
        onSwitch={type => setOpenClip(c => ({ ...c, type }))}
      />
    </div>
  );
};
