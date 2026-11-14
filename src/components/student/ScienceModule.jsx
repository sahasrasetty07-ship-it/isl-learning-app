import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { scienceLessons } from '../../data/scienceLessons';
import { WritingPad } from './WritingPad';
import { AssignmentBanner } from '../common/AssignmentBanner';
import { PageHeader, Tabs, Chip, Card, IconButton, SignVideoButton, Button } from '../ui';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  BookOpen,
  PenTool,
  Lightbulb,
  Hand,
  FlaskConical,
  Orbit,
  Sprout,
  CloudRain,
  Snowflake,
  ArrowRight
} from 'lucide-react';

// Lesson id -> icon (replaces the emoji in the lesson data)
const LESSON_ICONS = { 'solar-system': Orbit, photosynthesis: Sprout, 'water-cycle': CloudRain, 'matter-states': Snowflake };

export const ScienceModule = () => {
  const { setActiveVideoModal, speakText, recordExerciseSuccess, recordExerciseAttempt, activeAssignment, uiLanguage, setActiveTab: setAppTab } = useApp();
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
      videoUrl: selectedLesson.signTutorial.videoUrl,
      youtubeId: selectedLesson.signTutorial.youtubeId ?? null,
      startTime: selectedLesson.signTutorial.startTime ?? null,
      endTime: selectedLesson.signTutorial.endTime ?? null
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

  const LessonIcon = LESSON_ICONS[selectedLesson.id] || FlaskConical;

  return (
    <div className="space-y-5">
      <PageHeader
        onBack={() => setAppTab('learn')}
        backLabel={isEn ? 'Learn' : 'શીખો'}
        icon={FlaskConical}
        tone="science"
        title={isEn ? 'Science' : 'વિજ્ઞાન'}
        subtitle={isEn ? 'Science lessons with signs, writing and a quiz' : 'સંકેતો, લેખન અને ક્વિઝ સાથે વિજ્ઞાનના પાઠ'}
      />

      {/* Lesson picker */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label={isEn ? 'Choose a lesson' : 'પાઠ પસંદ કરો'}>
        {scienceLessons.map(lesson => {
          const Icon = LESSON_ICONS[lesson.id] || FlaskConical;
          return (
            <Chip
              key={lesson.id}
              active={selectedLesson.id === lesson.id}
              onClick={() => {
                setSelectedLesson(lesson);
                setQuestionIdx(0);
                resetQuiz();
              }}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {lesson.title}
            </Chip>
          );
        })}
      </div>

      <Tabs
        label={isEn ? 'Lesson parts' : 'પાઠના ભાગ'}
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'concept', icon: BookOpen, label: isEn ? 'Learn' : 'ખ્યાલ' },
          { id: 'write', icon: PenTool, label: isEn ? 'Write' : 'લેખન' },
          { id: 'quiz', icon: Lightbulb, label: isEn ? 'Quiz' : 'ક્વિઝ' }
        ]}
      />

      {/* ===================== TAB 1: CONCEPT & SIGNS ===================== */}
      {activeTab === 'concept' && (
        <Card className="space-y-5">
          <SignVideoButton
            onClick={openSignModal}
            label={isEn ? 'Watch the sign tutorial' : 'સંકેત ટ્યુટોરિયલ જુઓ'}
            sublabel={selectedLesson.signTutorial.title}
          />

          <div className="flex items-start gap-3">
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-science-soft text-science flex items-center justify-center">
              <LessonIcon className="w-6 h-6" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-tight">{selectedLesson.title}</h2>
              <p className="text-ink-muted">{selectedLesson.subtitle}</p>
            </div>
            <IconButton onClick={() => speakText(selectedLesson.summary)} label={isEn ? 'Listen to summary' : 'સારાંશ સાંભળો'}>
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </IconButton>
          </div>

          <Button onClick={() => setActiveTab('quiz')} className="w-full min-h-[52px] text-base">
            {isEn ? 'Take the quiz' : 'ક્વિઝ આપો'}
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Button>

          <div className="rounded-xl bg-science-soft p-4">
            <h3 className="font-sans text-sm font-bold text-science mb-1">{isEn ? 'What it means' : 'મુખ્ય ખ્યાલ'}</h3>
            <p className="leading-relaxed">{selectedLesson.summary}</p>
          </div>

          <div className="rounded-xl bg-canvas border border-line p-4 space-y-1">
            <h3 className="font-sans text-sm font-bold flex items-center gap-1.5">
              <Hand className="w-4 h-4 text-action" aria-hidden="true" />
              {selectedLesson.signTutorial.title}
            </h3>
            <p className="text-sm leading-relaxed">{selectedLesson.signTutorial.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">{isEn ? 'Key words and their signs' : 'મુખ્ય શબ્દો અને સંકેતો'}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedLesson.keyTerms.map((term, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-canvas border border-line">
                  <p className="font-bold">{term.gujarati}</p>
                  <p className="text-sm text-ink-muted mt-0.5">{isEn ? 'Sign:' : 'સંકેત:'} {term.sign}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="text-lg font-bold mb-2">{isEn ? 'Facts' : 'રસપ્રદ તથ્યો'}</h3>
            <ul className="space-y-1.5">
              {selectedLesson.facts.map((fact, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-science mt-2 shrink-0" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* ===================== TAB 2: WRITING PRACTICE ===================== */}
      {activeTab === 'write' && (
        <WritingPad
          targetLetter={selectedLesson.title.split(' ')[0]}
          targetWord={selectedLesson.title}
          letterMeaning={selectedLesson.subtitle}
          onSignClick={openSignModal}
          subject="science"
        />
      )}

      {/* ===================== TAB 3: QUIZ ===================== */}
      {activeTab === 'quiz' && <AssignmentBanner subjectKey="science" />}
      {activeTab === 'quiz' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold px-3 py-1 rounded-lg bg-science-soft text-science">
              {isEn ? 'Question' : 'પ્રશ્ન'} {(questionIdx % selectedLesson.exercises.length) + 1}/{selectedLesson.exercises.length}
            </span>
            <IconButton onClick={() => speakText(exercise.question)} label={isEn ? 'Listen to question' : 'પ્રશ્ન સાંભળો'}>
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </IconButton>
          </div>

          <div className="rounded-2xl bg-canvas border border-line p-5 text-center">
            <h2 className="text-2xl font-bold">{exercise.question}</h2>
          </div>

          {/* Options: result shown by icon + label, not colour alone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {exercise.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isRight = opt === exercise.correctAnswer;
              let btnStyle = 'bg-surface border-line hover:border-science';
              if (quizSubmitted) {
                if (isRight) btnStyle = 'bg-success-soft border-success text-success font-bold';
                else if (isSelected) btnStyle = 'bg-danger-soft border-danger text-danger font-bold';
                else btnStyle = 'bg-canvas border-line text-ink-muted';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={quizSubmitted}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`min-h-[56px] py-3 px-4 rounded-xl border-2 text-base font-semibold text-left transition flex items-center justify-between gap-2 ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {quizSubmitted && isRight && (
                    <span className="inline-flex items-center gap-1 text-sm shrink-0">
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />{isEn ? 'Correct' : 'સાચું'}
                    </span>
                  )}
                  {quizSubmitted && isSelected && !isRight && (
                    <span className="inline-flex items-center gap-1 text-sm shrink-0">
                      <XCircle className="w-5 h-5" aria-hidden="true" />{isEn ? 'Your answer' : 'તમારો જવાબ'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3 animate-fade-in" aria-live="polite">
              <div>
                <h3 className="text-lg font-bold">
                  {selectedAnswer === exercise.correctAnswer
                    ? (isEn ? 'Correct! (+10 stars)' : 'અદ્ભુત! સાચો જવાબ! (+૧૦ તારા)')
                    : (isEn ? 'Look at the correct answer above.' : 'ઉપર સાચો ઉત્તર જુઓ.')}
                </h3>
                <p className="text-sm text-ink-muted mt-0.5">{exercise.explanation}</p>
              </div>
              <Button onClick={nextQuestion} className="w-full min-h-[52px] text-base">
                {isEn ? 'Next question' : 'આગળનો પ્રશ્ન'}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
