import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { scienceLessons } from '../../data/scienceLessons';
import { WritingPad } from './WritingPad';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { getSignVideo } from '../../utils/video.js';
import { 
  Atom, 
  Video, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  PenTool, 
  Lightbulb 
} from 'lucide-react';

export const ScienceModule = () => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, recordExerciseAttempt, activeAssignment, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  
  // A science assignment opens straight into that lesson's quiz
  const assignedLesson = activeAssignment?.subjectKey === 'science'
    ? scienceLessons.find(l => l.id === activeAssignment.exerciseType)
    : null;
  const [selectedLesson, setSelectedLesson] = useState(assignedLesson || scienceLessons[0]);
  const [activeTab, setActiveTab] = useState(assignedLesson ? 'quiz' : 'concept');
  
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const exercise = selectedLesson.exercises[questionIdx % selectedLesson.exercises.length];

  const openSignModal = () => {
    setActiveVideoModal({
      title: `${selectedLesson.title} - Science ISL Sign`,
      gujarati: selectedLesson.title,
      english: selectedLesson.subtitle,
      signDescription: selectedLesson.signTutorial.description,
      handShape: 'Scientific Concept Sign Sequence',
      category: selectedLesson.category,
      // Science lessons embed a direct mp4 URL from the data file
      videoUrl: selectedLesson.signTutorial?.videoUrl || null,
      videoStart: null,
      videoEnd: null,
    });
  };

  const handleQuizAnswer = (opt) => {
    if (quizSubmitted) return;
    setSelectedAnswer(opt);
    setQuizSubmitted(true);
    const correct = opt === exercise.correctAnswer;
    if (correct) {
      recordExerciseSuccess('science', 10, `Science: ${selectedLesson.title}`, selectedLesson.id);
      speakText('Great job! Correct science answer.');
    } else {
      recordExerciseAttempt('science', false, `Science: ${selectedLesson.title}`, 0, selectedLesson.id);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const nextQuestion = () => {
    setQuestionIdx(i => i + 1);
    resetQuiz();
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
            {isEn ? 'Applied Science Education' : 'પ્રાયોગિક વિજ્ઞાન શિક્ષણ'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {isEn ? 'General Science with ISL Signs' : 'સામાન્ય વિજ્ઞાન અને પ્રકૃતિ'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mt-1">
            {isEn 
              ? 'Key science concepts explained through certified ISL sign tutorials, diagrams, and writing practice.' 
              : 'વિજ્ઞાનના અગત્યના નિયમો ISL સાઇન ટ્યુટોરિયલ્સ, ચિત્રો અને લેખન અભ્યાસ સાથે સમજો.'}
          </p>
        </div>
        <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 select-none">
          🔬
        </div>
      </div>

      {/* Lesson Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {scienceLessons.map(lesson => {
          const isSelected = selectedLesson.id === lesson.id;
          return (
            <button
              key={lesson.id}
              onClick={() => {
                setSelectedLesson(lesson);
                setQuestionIdx(0);
                resetQuiz();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{lesson.icon}</span>
              <span>{lesson.title}</span>
            </button>
          );
        })}
      </div>

      {/* Lesson View Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('concept')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'concept'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isEn ? 'Concept & Signs' : 'ખ્યાલ અને સંકેતો'}</span>
        </button>

        <button
          onClick={() => setActiveTab('write')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'write'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>{isEn ? 'Writing Practice' : 'લેખન કસોટી'}</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'quiz'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>{isEn ? 'Comprehension Quiz' : 'મૂલ્યાંકન (Quiz)'}</span>
        </button>
      </div>

      {/* ===================== TAB 1: CONCEPT & SIGNS ===================== */}
      {activeTab === 'concept' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedLesson.icon}</span>
                  <h3 className="text-xl font-black text-slate-900">{selectedLesson.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedLesson.subtitle}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => speakText(selectedLesson.summary)}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                  title={isEn ? "Pronounce Summary" : "સારાંશ બોલો"}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={openSignModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>{isEn ? 'Watch Sign Video' : 'ટ્યુટોરિયલ વિડીયો'}</span>
                </button>
              </div>
            </div>

            {/* Concept Summary */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                {isEn ? 'Scientific Concept Overview' : 'મુખ્ય વિજ્ઞાન ખ્યાલ'}
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {selectedLesson.summary}
              </p>
            </div>

            {/* ISL Sign Description Tutorial */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {selectedLesson.signTutorial.title}
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded text-amber-800 border border-amber-300 font-bold">
                  {isEn ? 'Sign Tutorial' : 'સાઇન ટ્યુટોરિયલ'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {selectedLesson.signTutorial.description}
              </p>
            </div>

            {/* Key Terminology with Signs Grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {isEn ? 'Key Terminology & ISL Gestures:' : 'અગત્યના પારિભાષિક શબ્દો અને સંકેતો:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedLesson.keyTerms.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="text-2xl">{term.icon}</span>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{term.gujarati}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sign: {term.sign}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Facts */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Key Scientific Facts:' : 'રસપ્રદ વૈજ્ઞાનિક તથ્યો:'}
              </h4>
              <ul className="space-y-1">
                {selectedLesson.facts.map((fact, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: WRITING PRACTICE ===================== */}
      {activeTab === 'write' && (
        <div className="space-y-4">
          <WritingPad
            targetLetter={selectedLesson.title.split(' ')[0]}
            targetWord={selectedLesson.title}
            letterMeaning={selectedLesson.subtitle}
            onSignClick={openSignModal}
            subject="science"
          />
        </div>
      )}

      {/* ===================== TAB 3: QUIZ ===================== */}
      {activeTab === 'quiz' && <AssignmentBanner subjectKey="science" />}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {isEn ? 'Science Comprehension Check' : 'વિજ્ઞાન સમજણ કસોટી'} · {(questionIdx % selectedLesson.exercises.length) + 1}/{selectedLesson.exercises.length}
            </span>
            <button
              onClick={() => speakText(exercise.question)}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
            <h4 className="text-lg font-black text-slate-900">
              {exercise.question}
            </h4>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {exercise.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              let btnStyle = 'bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-800';

              if (quizSubmitted) {
                if (opt === exercise.correctAnswer) {
                  btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold shadow-md';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 border-rose-600 text-white font-bold shadow-md';
                } else {
                  btnStyle = 'bg-slate-100 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={quizSubmitted}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`py-3.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {quizSubmitted && opt === exercise.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                  {quizSubmitted && isSelected && opt !== exercise.correctAnswer && (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
              <div>
                <h5 className="text-sm font-bold text-emerald-900">
                  {selectedAnswer === exercise.correctAnswer 
                    ? (isEn ? 'Awesome! Correct Answer! (+10 Stars ⭐)' : 'અદ્ભુત! સાચો જવાબ! (+૧૦ તારા ⭐)')
                    : (isEn ? 'Review the correct answer below:' : 'સાચો ઉત્તર જુઓ.')}
                </h5>
                <p className="text-xs text-emerald-800 mt-0.5">{exercise.explanation}</p>
              </div>
              <button
                onClick={nextQuestion}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition self-end sm:self-auto"
              >
                {isEn ? 'Next Question →' : 'આગળનો પ્રશ્ન →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
