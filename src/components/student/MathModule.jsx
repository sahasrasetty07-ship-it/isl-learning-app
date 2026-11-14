import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mathLessons, generateProblem } from '../../data/mathLessons';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { PageHeader, Tabs, Chip, Card, IconButton, SignVideoButton, Button } from '../ui';
import {
  Calculator,
  Table,
  HelpCircle,
  Volume2,
  CheckCircle2,
  XCircle,
  Hand,
  Delete,
  ArrowRight
} from 'lucide-react';

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
            <SignVideoButton
              glyph={selectedTable.gujaratiNumeral}
              label={isEn ? 'Watch the table in sign' : 'ઘડિયાનો સંકેત જુઓ'}
              sublabel={selectedTable.title}
              onClick={() => {
                setActiveVideoModal({
                  title: selectedTable.title,
                  gujarati: selectedTable.gujaratiNumeral,
                  english: `Table of ${selectedTable.number}`,
                  signDescription: selectedTable.signOverview,
                  handShape: 'Finger counting and grouping gesture',
                  category: 'Mathematics Tables'
                });
              }}
            />
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
