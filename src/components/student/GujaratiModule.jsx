import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { gujaratiAlphabets, sampleSentences } from '../../data/gujaratiAlphabets';
import { gujaratiNumbers } from '../../data/gujaratiNumbers';
import { getSignVideo } from '../../data/signVideos';
import { WritingPad } from './WritingPad';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { 
  BookOpen, 
  Hash, 
  MessageSquare, 
  Video, 
  Sparkles, 
  Volume2, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const GujaratiModule = () => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  
  // Sub-tabs: 'alphabets' | 'numbers' | 'sentences'
  const [subTab, setSubTab] = useState('alphabets');
  
  // Selected items
  const [selectedLetter, setSelectedLetter] = useState(gujaratiAlphabets[0]);
  const [selectedNumber, setSelectedNumber] = useState(gujaratiNumbers[0]);
  const [filterCategory, setFilterCategory] = useState('all');

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
    // Determine the signVideos key depending on the item type.
    // The registry resolves both the prefixed keys and the bare item id.
    let videoKey = null;
    if (item.id && item.letter) {
      videoKey = `letter-${item.id}`;                 // alphabet
    } else if (item.id && item.number) {
      videoKey = `number-${item.id}`;                 // number
    }
    const videoEntry = getSignVideo(videoKey || item?.id);

    setActiveVideoModal({
      title: `${item.name || item.word} - ISL Sign`,
      gujarati: item.letter || item.number || item.word,
      english: item.wordEnglish || item.englishWord,
      signDescription: item.signDescription,
      handShape: item.handShape,
      meaning: item.meaning,
      category: item.category || 'Gujarati Learning',
      // Prefer the signVideos registry; fall back to the data-file field
      videoUrl: item.videoUrl || videoEntry?.url || null,
      youtubeId: videoEntry?.youtubeId || null,
      startTime: videoEntry?.startTime ?? null,
      endTime: videoEntry?.endTime ?? null,
      status: videoEntry?.status || 'pending',
      source: videoEntry?.source || 'ISLRTC',
      verifiedBy: videoEntry?.verifiedBy || null,
    });
  };

  return (
    <div className="space-y-4 pb-6">
      <AssignmentBanner subjectKey="gujarati" />
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
            {isEn ? 'Language Learning Module' : 'પ્રાથમિક ભાષા શિક્ષણ'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {isEn ? 'Gujarati Alphabets & Numbers' : 'ગુજરાતી મૂળાક્ષરો અને અંકો'}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-md mt-1">
            {isEn 
              ? 'Learn with verified Indian Sign Language (ISL) videos, audio speech, and interactive tracing pad.' 
              : 'ઇન્ડિયન સાઇન લેંગ્વેજ (ISL) વિડીયો, બોલતા શબ્દો અને ટ્રેસિંગ લેખન પેડ દ્વારા શીખો.'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 select-none">
          ક
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setSubTab('alphabets')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'alphabets' 
              ? 'bg-white text-amber-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isEn ? 'Alphabets (ક-જ્ઞ)' : 'મૂળાક્ષરો'}</span>
        </button>

        <button
          onClick={() => setSubTab('numbers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'numbers' 
              ? 'bg-white text-amber-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>{isEn ? 'Numbers (૧-૧૦)' : 'અંકો (૧-૧૦)'}</span>
        </button>

        <button
          onClick={() => setSubTab('sentences')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'sentences' 
              ? 'bg-white text-amber-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isEn ? 'Sentences (વાક્યો)' : 'વાક્યો'}</span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: ALPHABETS ===================== */}
      {subTab === 'alphabets' && (
        <div className="space-y-4">
          {/* Vowel / Consonant Filter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Select Letter:' : 'અક્ષર પસંદ કરો:'}
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: isEn ? 'All' : 'બધા' },
                { id: 'consonant', label: isEn ? 'Consonants (ક-જ્ઞ)' : 'વ્યંજન (ક-જ)' },
                { id: 'vowel', label: isEn ? 'Vowels (અ-ઔ)' : 'સ્વર (અ-આ)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                    filterCategory === f.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letters Horizontal Carousel / Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filteredAlphabets.map(item => {
              const isSelected = selectedLetter.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedLetter(item);
                    speakText(item.letter);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/30 font-bold' 
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 shadow-sm'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                    {item.letter}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center mt-0.5">
                    {item.word}
                  </span>
                  <span className="text-xs mt-0.5">{item.icon}</span>
                </button>
              );
            })}
          </div>

          {/* Active Letter Detail & Writing Pad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Letter Overview & Sign Video Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-4xl font-black shadow-lg">
                      {selectedLetter.letter}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{selectedLetter.word}</h3>
                        <span className="text-2xl">{selectedLetter.icon}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{selectedLetter.wordEnglish}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {isEn ? selectedLetter.english : selectedLetter.category}
                      </span>
                    </div>
                  </div>

                  {/* Audio button */}
                  <button
                    onClick={() => speakText(`${selectedLetter.letter} એટલે ${selectedLetter.word}`)}
                    className="p-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                    title={isEn ? "Listen to Pronunciation" : "અવાજ સાંભળો"}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* ISL Sign Description Box */}
                <div className="mt-4 bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      {isEn ? 'ISL Sign Description' : 'ISL સાઇન સંકેત'}
                    </span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded text-amber-800 border border-amber-300">
                      {selectedLetter.handShape}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {selectedLetter.signDescription}
                  </p>
                </div>

                {/* Tracing Tip */}
                <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <strong>{isEn ? 'Tracing Guide:' : 'લેખન સૂચના:'}</strong> {selectedLetter.traceGuide}
                </div>
              </div>

              {/* Action: Open Sign Video Modal */}
              <button
                onClick={() => openSignModal(selectedLetter)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition"
              >
                <Video className="w-4 h-4 text-amber-400" />
                <span>{isEn ? 'Watch Sign Video Clip (ISL)' : 'સાઇન લેંગ્વેજ વિડીયો જુઓ'}</span>
              </button>
            </div>

            {/* Right: Interactive Canvas Writing Pad */}
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
            />
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: NUMBERS ===================== */}
      {subTab === 'numbers' && (
        <div className="space-y-4">
          {/* Numbers Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {gujaratiNumbers.map(item => {
              const isSelected = selectedNumber.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedNumber(item);
                    speakText(item.word);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/30 font-bold' 
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 shadow-sm'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                    {item.number}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {item.word}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    ({item.englishNumber})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Number Detail & Writing Pad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-lg">
                      {selectedNumber.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {selectedNumber.word} ({selectedNumber.englishWord})
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {isEn ? `Gujarati Numeral for ${selectedNumber.englishNumber}` : `સંખ્યા અંક ${selectedNumber.englishNumber}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakText(selectedNumber.word)}
                    className="p-2 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Visual Representation */}
                <div className="mt-4 bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-blue-900 mb-1">{selectedNumber.objectName}</p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-2xl py-1">
                    {[...Array(selectedNumber.dots)].map((_, i) => (
                      <span key={i} className="animate-bounce-short">{selectedNumber.objectIcon}</span>
                    ))}
                  </div>
                </div>

                {/* ISL Gesture Description */}
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900">
                    {isEn ? 'ISL Hand Gesture:' : 'ISL હસ્તમુદ્રા:'}
                  </span>
                  <p className="text-xs text-slate-800 font-medium">{selectedNumber.signDescription}</p>
                </div>
              </div>

              <button
                onClick={() => openSignModal(selectedNumber)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition"
              >
                <Video className="w-4 h-4 text-amber-400" />
                <span>{isEn ? 'Watch Number Sign Clip' : 'સંખ્યાનો સાઇન વિડીયો જુઓ'}</span>
              </button>
            </div>

            {/* Writing Pad for Numbers */}
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
            />
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 3: SENTENCES ===================== */}
      {subTab === 'sentences' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {isEn ? 'Basic Gujarati Sentences with ISL Sign Breakdown' : 'સરળ ગુજરાતી વાક્યો અને સાઇન સંકેત'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isEn 
                ? 'Word-by-word sign translation for school and daily home communication.' 
                : 'દૈનિક જીવન અને શાળામાં ઉપયોગી વાક્યોનું શબ્દશઃ ISL વિશ્લેષણ.'}
            </p>

            <div className="space-y-3">
              {sampleSentences.map(s => (
                <div
                  key={s.id}
                  className="bg-slate-50 hover:bg-amber-50/40 p-4 rounded-xl border border-slate-200 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{s.gujarati}</h4>
                      <p className="text-xs text-slate-500">{s.english}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakText(s.gujarati)}
                        className="p-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // sentences don't have a signVideos key; pass through any videoUrl on the item
                          setActiveVideoModal({
                            title: s.gujarati,
                            gujarati: s.gujarati,
                            english: s.english,
                            signDescription: s.signDescription,
                            handShape: 'Sentence Sign Sequence',
                            category: s.category,
                            videoUrl: s.videoUrl || null,
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                      >
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isEn ? 'Sign Clip' : 'સાઇન ક્લિપ'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sign breakdown chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold mr-1">
                      {isEn ? 'Tokens:' : 'શબ્દો:'}
                    </span>
                    {s.signBreakdown.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-700 shadow-2xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-amber-900 bg-amber-100/60 p-2 rounded-lg font-medium">
                    💡 <strong>{isEn ? 'Sign Instructions:' : 'સાઇન સંકેત પદ્ધતિ:'}</strong> {s.signDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
