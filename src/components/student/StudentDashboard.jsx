import { useApp } from '../../context/AppContext';
import { SubjectList } from './LearnHub';
import { Card, CardTitle, ProgressBar, Button, SUBJECT_STYLES } from '../ui';
import {
  Star,
  Flame,
  ArrowRight,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';

// Subject names stored on recent attempts -> subject key
const SUBJECT_KEY_BY_LABEL = { 'ગુજરાતી': 'gujarati', 'ગણિત': 'math', 'વિજ્ઞાન': 'science' };

export const StudentDashboard = () => {
  const { student, setActiveTab, startAssignment, uiLanguage } = useApp();
  const openAssignments = student.pendingAssignments.filter(a => a.status !== 'પૂર્ણ');
  const isEn = uiLanguage === 'en';

  // Continue where the student last practised
  const continueKey = SUBJECT_KEY_BY_LABEL[student.recentAttempts[0]?.subject] || 'gujarati';
  const continueSubject = student.subjects[continueKey];
  const cs = SUBJECT_STYLES[continueKey];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{isEn ? 'Welcome back' : 'ફરી સ્વાગત છે'}</p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
            {isEn ? `Hello, ${student.name.split(' ')[0]}` : `નમસ્તે, ${student.name.split(' ')[0]}`}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-surface border border-line">
            <Star className="w-4 h-4 fill-current text-action" aria-hidden="true" />
            {student.totalStars} {isEn ? 'stars' : 'તારા'}
          </span>
          <span className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-surface border border-line">
            <Flame className="w-4 h-4 text-action" aria-hidden="true" />
            {isEn ? `${student.currentStreak}-day streak` : `${student.currentStreak} દિવસ સતત`}
          </span>
        </div>
      </div>

      {/* Continue */}
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${cs.soft} ${cs.text}`}>
            <cs.icon className="w-7 h-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-muted">{isEn ? 'Continue' : 'ચાલુ રાખો'}</p>
            <h2 className="text-xl font-bold leading-tight">{isEn ? cs.en : cs.gu}</h2>
            <p className="text-sm text-ink-muted">
              {isEn ? 'Last practised:' : 'છેલ્લે:'} {continueSubject.lastPracticed}
            </p>
          </div>
        </div>
        <ProgressBar
          value={continueSubject.progress}
          color={cs.bg}
          label={isEn ? 'Progress' : 'પ્રગતિ'}
        />
        <Button onClick={() => setActiveTab(continueKey)} className="w-full min-h-[52px] text-base">
          {isEn ? 'Continue learning' : 'શીખવાનું ચાલુ રાખો'}
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Button>
      </Card>

      {/* Homework from the teacher */}
      <Card className="space-y-4">
        <CardTitle
          icon={ClipboardList}
          title={isEn ? 'Homework' : 'ગૃહકાર્ય'}
          action={
            <span className="shrink-0 text-sm font-semibold text-ink-muted">
              {openAssignments.length} {isEn ? 'to do' : 'બાકી'}
            </span>
          }
        />
        <ul className="space-y-3">
          {student.pendingAssignments.map(asg => {
            const done = asg.status === 'પૂર્ણ';
            return (
              <li
                key={asg.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-canvas border border-line"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans text-base font-semibold">{asg.title}</h3>
                  <p className="text-sm text-ink-muted">
                    {asg.subject} · {isEn ? 'Due' : 'મુદત'} {asg.dueDate} · {asg.teacher}
                  </p>
                  {asg.count > 0 && (
                    <ProgressBar
                      className="mt-2 max-w-xs"
                      value={(100 * asg.done) / asg.count}
                      color={done ? 'bg-success' : 'bg-action'}
                      label={null}
                      valueText={`${asg.done}/${asg.count}${done ? ` · ${isEn ? 'Score' : 'સ્કોર'} ${asg.correct}/${asg.count}` : ''}`}
                    />
                  )}
                </div>

                {done ? (
                  <span className="inline-flex items-center gap-1.5 min-h-tap px-3 rounded-xl bg-success-soft text-success text-sm font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    {isEn ? 'Done' : 'પૂર્ણ'}
                  </span>
                ) : (
                  <Button
                    onClick={() => {
                      if (asg.subjectKey) return startAssignment(asg);
                      // older free-text assignments: just open the subject
                      if (asg.subject.includes('ગુજરાતી')) setActiveTab('gujarati');
                      else if (asg.subject.includes('ગણિત')) setActiveTab('math');
                      else if (asg.subject.includes('વિજ્ઞાન')) setActiveTab('science');
                    }}
                    className="shrink-0"
                  >
                    {asg.done > 0 ? (isEn ? 'Continue' : 'ચાલુ રાખો') : (isEn ? 'Start' : 'શરૂ કરો')}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Subjects */}
      <section className="space-y-3" aria-labelledby="subjects-title">
        <div className="flex items-center justify-between">
          <h2 id="subjects-title" className="text-xl font-bold">{isEn ? 'Subjects' : 'વિષયો'}</h2>
          <span className="text-sm text-ink-muted">{isEn ? 'Overall' : 'કુલ'} {student.overallProgress}%</span>
        </div>
        <SubjectList />
      </section>
    </div>
  );
};
