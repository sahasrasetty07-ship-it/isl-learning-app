import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mathLessons, generateProblem, toGujaratiDigits } from '../../data/mathLessons';
import { gujaratiNumbers } from '../../data/gujaratiNumbers';
import { getSignVideo } from '../../data/signVideos';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { PageHeader, Tabs, Chip, Card, IconButton, Button } from '../ui';
import {
  Calculator,
  Table,
  HelpCircle,
  Volume2,
  CheckCircle2,
  XCircle,
  Hand,
  Delete,
  ArrowRight,
  Video,
  RotateCcw,
  Trophy,
  AlertCircle
} from 'lucide-react';

// Generates 3 options: 1 correct and 2 unique reasonable distractors, shuffled
const generateOptions = (tableNum, multiplier) => {
  const correct = tableNum * multiplier;
  const candidates = [
    correct + tableNum,
    correct - tableNum,
    correct + tableNum * 2,
    correct - tableNum * 2,
    tableNum * (multiplier + 1),
    tableNum * (multiplier - 1),
    correct + (correct % 2 === 0 ? 2 : 1),
    correct - (correct % 2 === 0 ? 2 : 1),
    correct + 10,
    correct - 10,
    correct + 4,
    correct - 4
  ].filter(v => v > 0 && v !== correct);

  const pool = Array.from(new Set(candidates));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const d1 = pool[0];
  const d2 = pool[1] || (correct + 3);
  const options = [correct, d1, d2];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { correct, options };
};

const createQuestionsForTable = (tableNum) => {
  return Array.from({ length: 10 }, (_, idx) => {
    const multiplier = idx + 1;
    const { correct, options } = generateOptions(tableNum, multiplier);
    return {
      tableNum,
      multiplier,
      correct,
      options
    };
  });
};

// Compact Interactive Multiplication Challenge inside the navy card
const MultiplicationChallenge = ({ selectedTable }) => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, recordExerciseAttempt, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const [questions, setQuestions] = useState(() => createQuestionsForTable(selectedTable.number));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('unanswered'); // 'unanswered' | 'correct' | 'incorrect'
  const [selectedOption, setSelectedOption] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(() => new Set());
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (option) => {
    if (status === 'correct') return;

    setSelectedOption(option);
    if (option === currentQ.correct) {
      setStatus('correct');
      speakText(isEn ? 'Correct answer! Well done!' : 'સાચો જવાબ! ખૂબ સરસ!');
      recordExerciseSuccess(
        'math',
        10,
        `Table ${selectedTable.number}: ${currentQ.tableNum} × ${currentQ.multiplier} = ${currentQ.correct}`,
        'multiplication-tables'
      );
      if (wrongAttempts.size === 0) {
        setScore(s => s + 1);
      }
    } else {
      setStatus('incorrect');
      setWrongAttempts(prev => new Set(prev).add(option));
      speakText(isEn ? 'Try again!' : 'ફરી પ્રયત્ન કરો!');
      recordExerciseAttempt(
        'math',
        false,
        `Table ${selectedTable.number}: ${currentQ.tableNum} × ${currentQ.multiplier}`,
        0,
        'multiplication-tables'
      );
    }
  };

  const handleNext = () => {
    if (currentIndex < 9) {
      setCurrentIndex(i => i + 1);
      setStatus('unanswered');
      setSelectedOption(null);
      setWrongAttempts(new Set());
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setQuestions(createQuestionsForTable(selectedTable.number));
    setCurrentIndex(0);
    setStatus('unanswered');
    setSelectedOption(null);
    setWrongAttempts(new Set());
    setScore(0);
    setIsCompleted(false);
  };

  const handleOpenSignModal = () => {
    const numId = `n${selectedTable.number}`;
    const videoEntry = getSignVideo(numId);
    const numData = gujaratiNumbers.find(item => item.id === numId);

    setActiveVideoModal({
      title: isEn ? `Number ${selectedTable.number} - ISL Sign` : `સંખ્યા ${selectedTable.gujaratiNumeral} - ISL સંકેત`,
      gujarati: selectedTable.gujaratiNumeral,
      english: `Number ${selectedTable.number} (${numData?.englishWord || ''})`,
      signDescription: numData?.signDescription || selectedTable.signOverview,
      handShape: numData?.handShape || 'Finger counting sign',
      meaning: isEn
        ? `ISL sign demonstration for digit ${selectedTable.number} from ISLRTC dictionary. Note: Demonstrates individual numbers, not full multiplication tables.`
        : `ISLRTC શબ્દકોશમાંથી ${selectedTable.gujaratiNumeral} નો અંક સંકેત. નોંધ: આ માત્ર અંકનો સંકેત દર્શાવે છે.`,
      category: isEn ? 'ISL Number Signs' : 'સંખ્યા સંકેતો',
      videoUrl: null,
      youtubeId: videoEntry?.youtubeId || null,
      startTime: videoEntry?.startTime ?? null,
      endTime: videoEntry?.endTime ?? null,
      status: videoEntry?.status || 'approved',
      source: videoEntry?.source || 'ISLRTC Gujarati dictionary',
      verifiedBy: videoEntry?.verifiedBy || null
    });
  };

  // Compact grouped dots visual representation
  const renderGroupedDots = (tableNum, multiplier) => {
    let groups = tableNum;
    let dotsPerGroup = multiplier;

    if (tableNum === 10) {
      groups = multiplier;
      dotsPerGroup = 10;
    } else if (tableNum <= 5) {
      groups = tableNum;
      dotsPerGroup = multiplier;
    } else if (multiplier <= 5) {
      groups = multiplier;
      dotsPerGroup = tableNum;
    } else {
      groups = Math.min(tableNum, 5);
      dotsPerGroup = multiplier;
    }

    return (
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-0.5">
        {Array.from({ length: groups }).map((_, gIdx) => (
          <div key={gIdx} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="bg-white/10 border border-white/10 rounded-lg px-1.5 sm:px-2 py-1 flex items-center justify-center shrink-0">
              {dotsPerGroup <= 5 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: dotsPerGroup }).map((_, dIdx) => (
                    <span
                      key={dIdx}
                      className="w-1.5 h-1.5 rounded-full bg-action shrink-0"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-rows-2 grid-flow-col gap-0.5">
                  {Array.from({ length: dotsPerGroup }).map((_, dIdx) => (
                    <span
                      key={dIdx}
                      className="w-1.5 h-1.5 rounded-full bg-action shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>
            {groups <= 5 && gIdx < groups - 1 && (
              <span className="text-white/30 text-xs font-bold select-none">+</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full rounded-2xl bg-ink text-white overflow-hidden p-3.5 sm:p-4 flex flex-col justify-between select-none h-[285px] sm:h-[295px] border border-white/5">
      {/* Subtle background numeral accent */}
      <span
        className="absolute right-4 bottom-2 font-heading font-bold text-8xl text-white/[0.04] select-none pointer-events-none"
        aria-hidden="true"
      >
        {selectedTable.gujaratiNumeral}
      </span>

      {isCompleted ? (
        /* Completion Screen */
        <div className="h-full flex flex-col justify-between py-1 text-center">
          <div className="h-6 flex items-center justify-between text-xs">
            <span className="font-bold tracking-wider text-action uppercase text-[11px] sm:text-xs">
              LET'S PRACTISE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-bold text-[11px] sm:text-xs">
              {isEn ? '10 / 10 Completed' : '૧૦ / ૧૦ પૂર્ણ'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-action/20 border border-action/40 flex items-center justify-center mx-auto text-action">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-action" aria-hidden="true" />
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
              {isEn ? 'Multiplication Challenge Complete!' : 'મહાવરો સફળતાપૂર્વક પૂર્ણ!'}
            </h3>
            <p className="text-xs sm:text-sm text-white/70">
              {isEn
                ? `Great job practicing the Table of ${selectedTable.number}!`
                : `${selectedTable.title} નો મહાવરો પૂર્ણ થયો!`}
            </p>
            <p className="text-xs text-action font-semibold">
              {isEn ? `Score: ${score} / 10 correct on first try` : `સ્કોર: ૧૦ માંથી ${toGujaratiDigits(score)} સાચા`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs sm:text-sm font-bold transition shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isEn ? 'Practise Again' : 'ફરી મહાવરો કરો'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSignModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs sm:text-sm font-medium transition active:scale-95"
            >
              <Video className="w-3.5 h-3.5 text-action" aria-hidden="true" />
              <span>{isEn ? 'View ISL Number Signs' : 'ISL સંખ્યા સંકેતો'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Active Screen */
        <>
          {/* Header Row: Heading + Table + Progress */}
          <div className="h-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold tracking-wider text-action uppercase text-[11px] sm:text-xs">
                LET'S PRACTISE
              </span>
              <span className="text-white/40 select-none">•</span>
              <span className="font-semibold text-white/90 truncate">
                {isEn ? `Table of ${selectedTable.number}` : `${selectedTable.gujaratiNumeral} નો ઘડિયો`}
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-bold text-[11px] sm:text-xs tabular-nums">
              <span>{isEn ? `Question ${currentIndex + 1}/10` : `પ્રશ્ન ${toGujaratiDigits(currentIndex + 1)}/૧૦`}</span>
            </div>
          </div>

          {/* Large Multiplication Question */}
          <div className="h-10 flex items-center justify-center">
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="font-heading text-3xl sm:text-4xl font-bold tracking-wider text-white">
                {isEn
                  ? `${currentQ.tableNum} × ${currentQ.multiplier} = ?`
                  : `${toGujaratiDigits(currentQ.tableNum)} × ${toGujaratiDigits(currentQ.multiplier)} = ?`}
              </span>
              <span className="text-xs sm:text-sm text-white/40 font-heading select-none">
                ({isEn
                  ? `${toGujaratiDigits(currentQ.tableNum)} × ${toGujaratiDigits(currentQ.multiplier)}`
                  : `${currentQ.tableNum} × ${currentQ.multiplier}`})
              </span>
            </div>
          </div>

          {/* Grouped Dots Visual Representation */}
          <div className="h-8 flex items-center justify-center">
            {renderGroupedDots(currentQ.tableNum, currentQ.multiplier)}
          </div>

          {/* Feedback Slot */}
          <div
            className="h-6 flex items-center justify-center text-xs sm:text-sm font-medium transition-colors"
            aria-live="polite"
          >
            {status === 'correct' && (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden="true" />
                {isEn ? 'Correct! Well done!' : 'સાચો જવાબ! ખૂબ સરસ!'}
              </span>
            )}
            {status === 'incorrect' && (
              <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
                {isEn ? 'Try again! You can do it.' : 'ફરી પ્રયત્ન કરો!'}
              </span>
            )}
            {status === 'unanswered' && (
              <span className="text-white/40 text-[11px] sm:text-xs select-none">
                {isEn ? 'Choose the correct answer' : 'સાચો જવાબ પસંદ કરો'}
              </span>
            )}
          </div>

          {/* Answer Options Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-sm mx-auto h-11 sm:h-12">
            {currentQ.options.map((option, idx) => {
              const isWrong = wrongAttempts.has(option);
              const isCorrectOption = status === 'correct' && option === currentQ.correct;

              let btnStyle = "bg-[#252A50] hover:bg-[#2D3360] border border-white/10 text-white";
              if (isCorrectOption) {
                btnStyle = "bg-emerald-600/30 border-2 border-emerald-400 text-emerald-300 font-bold";
              } else if (isWrong) {
                btnStyle = "bg-rose-500/10 border border-rose-400/40 text-rose-300/60 line-through";
              } else if (status === 'correct') {
                btnStyle = "bg-[#252A50]/40 border border-white/5 text-white/30";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={status === 'correct'}
                  onClick={() => handleSelectOption(option)}
                  className={`h-full rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 px-2 ${btnStyle}`}
                >
                  <span className="font-heading text-lg sm:text-xl font-bold">
                    {isEn ? option : toGujaratiDigits(option)}
                  </span>
                  {!isEn && (
                    <span className="text-[11px] text-white/50 ml-1">({option})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: ISL Sign link + Next Question control */}
          <div className="h-8 flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleOpenSignModal}
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/10"
            >
              <Video className="w-3.5 h-3.5 text-action" aria-hidden="true" />
              <span>{isEn ? 'View ISL Number Signs' : 'ISL સંખ્યા સંકેતો'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold px-3 py-1 rounded-xl transition ${
                status === 'correct'
                  ? 'bg-action hover:bg-action-hover text-white shadow-sm active:scale-95'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
            >
              <span>{currentIndex === 9 ? (isEn ? 'Finish' : 'સમાપ્ત') : (isEn ? 'Next' : 'આગળ')}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const MathModule = () => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, recordExerciseAttempt, activeAssignment, uiLanguage, setActiveTab } = useApp();
  const isEn = uiLanguage === 'en';
  
  // Sub-tabs: 'tables' | 'operations' | 'practice'
  // A math assignment opens straight into practice of the assigned type
  const assignedType = activeAssignment?.subjectKey === 'math' ? activeAssignment.exerciseType : null;
  const [subTab, setSubTab] = useState(assignedType ? 'practice' : 'tables');
  const [selectedTable, setSelectedTable] = useState(mathLessons.tables[0]);
  const [selectedOp, setSelectedOp] = useState(mathLessons.operations[0]);
  
  // Practice quiz state: endless generated problems, answered on a Gujarati digit keypad
  const [practiceType, setPracticeType] = useState(assignedType || 'mixed');
  const [currentProblem, setCurrentProblem] = useState(() =>
    generateProblem(assignedType && assignedType !== 'mixed' ? assignedType : undefined));
  const [problemCount, setProblemCount] = useState(1);
  const [answerInput, setAnswerInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const newProblem = (type = practiceType) => {
    setCurrentProblem(generateProblem(type === 'mixed' ? undefined : type));
    setAnswerInput('');
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleAnswerSubmit = () => {
    if (isAnswered || !answerInput) return;
    setIsAnswered(true);
    const correct = answerInput === currentProblem.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      recordExerciseSuccess('math', 10, `Math: ${currentProblem.question}`, currentProblem.type);
      speakText('Correct answer! Well done!');
    } else {
      recordExerciseAttempt('math', false, `Math: ${currentProblem.question}`, 0, currentProblem.type);
      speakText('Try again. Check the correct answer.');
    }
  };

  const handleNextProblem = () => {
    setProblemCount(c => c + 1);
    newProblem();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        onBack={() => setActiveTab('learn')}
        backLabel={isEn ? 'Learn' : 'શીખો'}
        icon={Calculator}
        tone="math"
        title={isEn ? 'Maths' : 'ગણિત'}
        subtitle={isEn ? 'Tables, operations and practice with signs' : 'સંકેતો સાથે ઘડિયા, ક્રિયાઓ અને મહાવરો'}
      />

      <Tabs
        label={isEn ? 'Maths lessons' : 'ગણિતના પાઠ'}
        value={subTab}
        onChange={setSubTab}
        items={[
          { id: 'tables', icon: Table, label: isEn ? 'Tables' : 'ઘડિયા' },
          { id: 'operations', icon: Calculator, label: isEn ? 'Operations' : 'ક્રિયાઓ' },
          { id: 'practice', icon: HelpCircle, label: isEn ? 'Practice' : 'મહાવરો' }
        ]}
      />

      {/* ===================== SUBTAB 1: TABLES (ઘડિયા) ===================== */}
      {subTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={isEn ? 'Choose a table' : 'ઘડિયો પસંદ કરો'}>
            {mathLessons.tables.map(t => (
              <Chip key={t.id} active={selectedTable.id === t.id} onClick={() => setSelectedTable(t)}>
                {t.title}
              </Chip>
            ))}
          </div>

          <Card className="space-y-4">
            <MultiplicationChallenge key={selectedTable.id} selectedTable={selectedTable} />
            <div>
              <h2 className="text-2xl font-bold">{selectedTable.title}</h2>
              <p className="text-ink-muted">{selectedTable.signOverview}</p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedTable.rows.map((row, idx) => (
                <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-canvas border border-line">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-maths-soft text-maths font-bold flex items-center justify-center tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xl font-bold leading-tight">{row.exp}</p>
                    <p className="text-sm text-ink-muted">{row.speech} ({row.eng})</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums px-2 py-1 rounded-lg bg-surface border border-line">{row.result}</span>
                  <IconButton onClick={() => speakText(row.speech)} label={isEn ? 'Say it' : 'બોલો'}>
                    <Volume2 className="w-5 h-5" aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ===================== SUBTAB 2: OPERATIONS ===================== */}
      {subTab === 'operations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label={isEn ? 'Choose an operation' : 'ક્રિયા પસંદ કરો'}>
            {mathLessons.operations.map(op => {
              const isSelected = selectedOp.id === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedOp(op)}
                  className={`min-h-[88px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                    isSelected ? 'bg-maths border-maths text-white' : 'bg-surface border-line hover:border-maths'
                  }`}
                >
                  <span className={`font-heading text-4xl font-bold leading-none ${isSelected ? '' : 'text-maths'}`}>{op.symbol}</span>
                  <span className={`text-sm text-center ${isSelected ? 'font-bold' : 'font-medium'}`}>{op.title}</span>
                </button>
              );
            })}
          </div>

          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-maths">{isEn ? 'Concept' : 'મૂળભૂત ક્રિયા'}</p>
                <h2 className="text-2xl font-bold">{selectedOp.title}</h2>
                <p className="text-ink-muted mt-1">{selectedOp.concept}</p>
              </div>
              <IconButton onClick={() => speakText(selectedOp.title)} label={isEn ? 'Say it' : 'બોલો'}>
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>

            <div className="rounded-xl bg-maths-soft p-4">
              <p className="text-sm font-semibold text-maths">{isEn ? 'Example' : 'ઉદાહરણ'}</p>
              <p className="font-heading text-3xl font-bold tracking-wide mt-1">{selectedOp.example}</p>
            </div>

            <div className="rounded-xl bg-canvas border border-line p-4 flex items-start gap-3">
              <Hand className="w-5 h-5 text-action shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-sans text-sm font-bold">{isEn ? 'How to sign it' : 'ISL સંકેત પદ્ધતિ'}</h3>
                <p className="text-sm mt-1">{selectedOp.signDescription}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================== SUBTAB 3: PRACTICE ASSESSMENT ===================== */}
      {subTab === 'practice' && (
        <div className="space-y-4">
          <AssignmentBanner subjectKey="math" />
          {!assignedType && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label={isEn ? 'Question type' : 'પ્રશ્ન પ્રકાર'}>
              {[{ id: 'mixed', title: isEn ? 'Mixed' : 'મિશ્ર' }, ...mathLessons.operations].map(op => (
                <Chip key={op.id} active={practiceType === op.id} onClick={() => { setPracticeType(op.id); newProblem(op.id); }}>
                  {op.title}
                </Chip>
              ))}
            </div>
          )}

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold px-3 py-1 rounded-lg bg-maths-soft text-maths">
                {isEn ? `Question ${problemCount}` : `પ્રશ્ન ${problemCount}`}
              </span>
              <IconButton onClick={() => speakText(currentProblem.questionGujarati)} label={isEn ? 'Listen to question' : 'પ્રશ્ન બોલો'}>
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>

            <div className="rounded-2xl bg-canvas border border-line p-6 text-center space-y-2">
              <p className="font-heading text-5xl sm:text-6xl font-bold tracking-wider">{currentProblem.question}</p>
              <p className="font-semibold text-ink-muted">{currentProblem.questionGujarati}</p>
            </div>
            <p className="text-sm flex items-start gap-2">
              <Hand className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
              <span><strong>{isEn ? 'Sign hint:' : 'સંકેત:'}</strong> {currentProblem.signHint}</span>
            </p>

            {/* Answer box + Gujarati digit keypad. Result shown by icon + text, not colour alone. */}
            <div className="flex items-center justify-center gap-3" aria-live="polite">
              <div className={`min-w-[140px] min-h-[64px] px-4 rounded-2xl border-2 font-heading text-4xl font-bold flex items-center justify-center ${
                !isAnswered ? 'border-maths bg-surface'
                  : isCorrect ? 'border-success bg-success-soft text-success' : 'border-danger bg-danger-soft text-danger'
              }`}>
                {answerInput || <span className="text-ink-muted">?</span>}
              </div>
              {isAnswered && (isCorrect
                ? <span className="inline-flex items-center gap-1 font-bold text-success"><CheckCircle2 className="w-7 h-7" aria-hidden="true" />{isEn ? 'Correct' : 'સાચું'}</span>
                : <span className="inline-flex items-center gap-1 font-bold text-danger"><XCircle className="w-7 h-7" aria-hidden="true" />{isEn ? 'Not correct' : 'ખોટું'}</span>)}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {'૧૨૩૪૫૬૭૮૯૦'.split('').map(d => (
                <button
                  key={d}
                  type="button"
                  disabled={isAnswered || answerInput.length >= 3}
                  onClick={() => setAnswerInput(v => v + d)}
                  className="min-h-[56px] rounded-xl bg-surface border-2 border-line hover:border-maths font-heading text-3xl font-bold transition active:scale-95 disabled:opacity-40"
                >
                  {d}
                </button>
              ))}
            </div>

            {!isAnswered ? (
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <Button
                  variant="secondary"
                  disabled={!answerInput}
                  onClick={() => setAnswerInput(v => v.slice(0, -1))}
                  className="min-h-[52px]"
                >
                  <Delete className="w-5 h-5" aria-hidden="true" />
                  {isEn ? 'Delete' : 'ભૂંસો'}
                </Button>
                <Button disabled={!answerInput} onClick={handleAnswerSubmit} className="min-h-[52px] text-base">
                  {isEn ? 'Check answer' : 'જવાબ તપાસો'}
                </Button>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border-2 space-y-3 animate-fade-in ${
                isCorrect ? 'bg-success-soft border-success' : 'bg-danger-soft border-danger'
              }`}>
                <div className="flex items-start gap-2">
                  {isCorrect
                    ? <CheckCircle2 className="w-6 h-6 text-success shrink-0" aria-hidden="true" />
                    : <XCircle className="w-6 h-6 text-danger shrink-0" aria-hidden="true" />}
                  <div>
                    <h3 className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                      {isCorrect ? (isEn ? 'Correct! Well done! (+10 stars)' : 'સાચો જવાબ! શાબાશ! (+૧૦ તારા)') : (isEn ? 'Not correct.' : 'ખોટો જવાબ.')}
                    </h3>
                    <p className="text-sm">{currentProblem.explanation}</p>
                  </div>
                </div>
                <Button onClick={handleNextProblem} className="w-full min-h-[52px] text-base">
                  {isEn ? 'Next question' : 'આગળનો દાખલો'}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
