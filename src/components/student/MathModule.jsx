import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mathLessons, generateProblem } from '../../data/mathLessons';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { 
  Calculator, 
  Table, 
  HelpCircle, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Video, 
  Plus, 
  Minus, 
  X, 
  Divide 
} from 'lucide-react';

export const MathModule = () => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, recordExerciseAttempt, activeAssignment, uiLanguage } = useApp();
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
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
            {isEn ? 'Math & Tables Curriculum' : 'ગણિત શિક્ષણ અને ઘડિયા'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {isEn ? 'Gujarati Mathematics & Arithmetic' : 'ગુજરાતી ગણિત અને ક્રિયાઓ'}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-md mt-1">
            {isEn 
              ? 'Tables (ઘડિયા), addition, subtraction, multiplication & division with ISL signs and visual counters.' 
              : 'ઘડિયા, સરવાળો, બાદબાકી, ગુણાકાર અને ભાગાકાર ISL સંકેતો અને વિઝ્યુઅલ દાખલા સાથે.'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 select-none">
          +−×÷
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setSubTab('tables')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'tables' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>{isEn ? 'Tables (ઘડિયા)' : 'ઘડિયા'}</span>
        </button>

        <button
          onClick={() => setSubTab('operations')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'operations' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{isEn ? 'Operations (+ - × ÷)' : 'ક્રિયાઓ'}</span>
        </button>

        <button
          onClick={() => setSubTab('practice')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'practice' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isEn ? 'Assessment Quiz' : 'દાખલા મહાવરો'}</span>
        </button>
      </div>

      {/* ===================== SUBTAB 1: TABLES (ઘડિયા) ===================== */}
      {subTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {mathLessons.tables.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  selectedTable.id === t.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{t.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedTable.title}</h3>
                <p className="text-xs text-slate-500">{selectedTable.signOverview}</p>
              </div>
              <button
                onClick={() => {
                  // Math tables don't have a dedicated signVideos key yet –
                  // pass no videoUrl so the modal shows the text fallback gracefully.
                  setActiveVideoModal({
                    title: selectedTable.title,
                    gujarati: selectedTable.gujaratiNumeral,
                    english: `Table of ${selectedTable.number}`,
                    signDescription: selectedTable.signOverview,
                    handShape: 'Finger counting and grouping gesture',
                    category: 'Mathematics Tables',
                    videoUrl: null,
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold transition"
              >
                <Video className="w-4 h-4 text-blue-600" />
                <span>{isEn ? 'Watch Sign Video' : 'ઘડિયા સાઇન વિડીયો'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedTable.rows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-base text-slate-900">{row.exp}</span>
                      <p className="text-xs text-slate-500 font-medium">"{row.speech}" ({row.eng})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {row.result}
                    </span>
                    <button
                      onClick={() => speakText(row.speech)}
                      className="p-1.5 rounded-lg bg-white hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-200 transition"
                      title={isEn ? "Pronounce" : "બોલો"}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 2: OPERATIONS ===================== */}
      {subTab === 'operations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mathLessons.operations.map(op => {
              const isSelected = selectedOp.id === op.id;
              return (
                <button
                  key={op.id}
                  onClick={() => setSelectedOp(op)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-400/30 font-bold' 
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-3xl font-black text-blue-600 mb-1">{op.symbol}</span>
                  <span className="text-xs font-bold text-slate-800 text-center">{op.title}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {isEn ? 'Arithmetic Concept' : 'મૂળભૂત ક્રિયા'}
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedOp.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedOp.concept}</p>
              </div>
              <button
                onClick={() => speakText(selectedOp.title)}
                className="p-2 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase">
                {isEn ? 'Visual Representation' : 'વિઝ્યુઅલ ઉદાહરણ'}
              </span>
              <p className="text-lg font-bold text-slate-800 tracking-wide">{selectedOp.example}</p>
              <div className="text-2xl pt-1">{selectedOp.visual}</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <Video className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase">
                  {isEn ? 'ISL Sign Method' : 'ISL સાઇન સંકેત પદ્ધતિ'}
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-800 mt-1">
                  {selectedOp.signDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBTAB 3: PRACTICE ASSESSMENT ===================== */}
      {subTab === 'practice' && (
        <div className="space-y-4">
          <AssignmentBanner subjectKey="math" />
          {!assignedType && <div className="flex flex-wrap gap-2">
            {[{ id: 'mixed', title: isEn ? 'Mixed' : 'મિશ્ર' }, ...mathLessons.operations].map(op => (
              <button
                key={op.id}
                onClick={() => { setPracticeType(op.id); newProblem(op.id); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  practiceType === op.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {op.title}
              </button>
            ))}
          </div>}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {isEn ? `Question ${problemCount}` : `પ્રશ્ન ${problemCount}`}
                </span>
                <span className="text-xs text-slate-500 font-medium">{isEn ? 'Math Assessment' : 'ગણિત મૂલ્યાંકન'}</span>
              </div>
              <button
                onClick={() => speakText(currentProblem.questionGujarati)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                title={isEn ? "Listen to Question" : "પ્રશ્ન બોલો"}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-wider">
                {currentProblem.question}
              </div>
              <p className="text-sm font-bold text-slate-600 mt-2">
                {currentProblem.questionGujarati}
              </p>
              <p className="text-xs text-amber-800 font-medium bg-amber-100/70 py-1 px-3 rounded-full inline-block mt-1">
                💡 {isEn ? 'Sign Hint:' : 'સંકેત:'} {currentProblem.signHint}
              </p>
            </div>

            {/* Answer box + Gujarati digit keypad */}
            <div className="flex items-center justify-center gap-2">
              <div className={`min-w-[120px] px-4 py-3 rounded-2xl border-2 text-3xl font-black text-center ${
                !isAnswered ? 'border-blue-400 bg-white text-slate-900'
                  : isCorrect ? 'border-emerald-600 bg-emerald-500 text-white' : 'border-rose-600 bg-rose-500 text-white'
              }`}>
                {answerInput || <span className="text-slate-300">?</span>}
              </div>
              {isAnswered && (isCorrect
                ? <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                : <XCircle className="w-7 h-7 text-rose-600" />)}
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {'૧૨૩૪૫૬૭૮૯૦'.split('').map(d => (
                <button
                  key={d}
                  disabled={isAnswered || answerInput.length >= 3}
                  onClick={() => setAnswerInput(v => v + d)}
                  className="py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 text-2xl font-black text-slate-800 transition active:scale-95 disabled:opacity-40"
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isAnswered || !answerInput}
                onClick={() => setAnswerInput(v => v.slice(0, -1))}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40"
              >
                {isEn ? '⌫ Delete' : '⌫ ભૂંસો'}
              </button>
              <button
                disabled={isAnswered || !answerInput}
                onClick={handleAnswerSubmit}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-40"
              >
                {isEn ? 'Check Answer' : 'જવાબ તપાસો'}
              </button>
            </div>

            {isAnswered && (
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in ${
                isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div>
                  <h4 className="text-sm font-bold">
                    {isCorrect ? (isEn ? 'Correct Answer! Well done! (+10 Stars)' : 'સાચો જવાબ! શાબાશ! (+૧૦ પોઇન્ટ્સ)') : (isEn ? 'Incorrect.' : 'ખોટો જવાબ.')}
                  </h4>
                  <p className="text-xs mt-0.5">{currentProblem.explanation}</p>
                </div>
                <button
                  onClick={handleNextProblem}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition self-end sm:self-auto shrink-0"
                >
                  {isEn ? 'Next Problem →' : 'આગળનો દાખલો →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
