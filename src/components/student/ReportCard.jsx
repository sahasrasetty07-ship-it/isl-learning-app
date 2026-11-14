import { useApp } from '../../context/AppContext';
import { WritingAttemptsPanel } from '../common/WritingAttemptsPanel';
import { LessonVideoProgress } from '../common/LessonVideoProgress';
import { PageHeader, Card, CardTitle, Button, SUBJECT_STYLES } from '../ui';
import {
  Star,
  MessageSquareText,
  Download,
  Printer,
  BarChart3,
  History
} from 'lucide-react';

export const ReportCard = () => {
  const { student, showToast, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast(isEn ? 'Student Report Card PDF downloaded successfully!' : 'પ્રગતિ પત્રક (Report Card) PDF સફળતાપૂર્વક ડાઉનલોડ થયું!');
  };

  // Per-subject display text; thresholds are the ones the report has always used
  const subjectCards = [
    { key: 'gujarati', en: 'Gujarati Alphabets, Words & Handwriting', enStatus: t => (t.mastery >= 90 ? 'Mastered' : 'In Progress') },
    { key: 'math', en: 'Mathematics & Gujarati Tables', enStatus: t => (t.mastery >= 85 ? 'Mastered' : 'Needs Practice') },
    { key: 'science', en: 'General Science with ISL Videos', enStatus: t => (t.mastery >= 80 ? 'Mastered' : 'New Topic') }
  ];

  const tiles = [
    { label: isEn ? 'Overall progress' : 'કુલ સિદ્ધિ દર', value: `${student.overallProgress}%` },
    { label: isEn ? 'Stars' : 'તારા', value: student.totalStars, star: true },
    { label: isEn ? 'Streak' : 'સતત અભ્યાસ', value: `${student.currentStreak} ${isEn ? 'days' : 'દિવસ'}` },
    { label: isEn ? 'This week' : 'આ અઠવાડિયે', value: `${student.weeklyHours} ${isEn ? 'hours' : 'કલાક'}` }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BarChart3}
        title={isEn ? 'Report' : 'પ્રગતિ પત્રક'}
        subtitle={`${student.name} · ${student.grade}`}
        actions={
          <>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'Print' : 'પ્રિન્ટ'}
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'Download PDF' : 'PDF ડાઉનલોડ'}
            </Button>
          </>
        }
      />
      <p className="text-sm text-ink-muted -mt-2">{student.school}</p>

      {/* Summary */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="bg-surface border border-line rounded-2xl p-4">
            <dt className="text-sm text-ink-muted">{t.label}</dt>
            <dd className="font-heading text-3xl font-bold tabular-nums flex items-center gap-1.5">
              {t.value}
              {t.star && <Star className="w-5 h-5 fill-action text-action" aria-hidden="true" />}
            </dd>
          </div>
        ))}
      </dl>

      {/* Subject mastery */}
      <section className="space-y-3" aria-labelledby="subject-mastery">
        <h2 id="subject-mastery" className="text-xl font-bold">{isEn ? 'Subjects' : 'વિષયવાર ગુણવત્તા અને ચોકસાઈ'}</h2>
        {subjectCards.map(c => {
          const subj = student.subjects[c.key];
          const st = SUBJECT_STYLES[c.key];
          return (
            <Card key={c.key} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${st.soft} ${st.text}`}>
                    <st.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight">{isEn ? c.en : subj.name}</h3>
                    <p className="text-sm text-ink-muted">
                      {subj.completedLessons} / {subj.totalLessons} {isEn ? 'lessons completed' : 'પ્રકરણ પૂર્ણ'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-heading text-2xl font-bold ${st.text}`}>{subj.accuracy}%</p>
                  <p className="text-xs text-ink-muted">{isEn ? 'Accuracy' : 'ચોકસાઈ દર'}</p>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subj.topics.map((t, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-canvas border border-line">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                        <div className={`h-full rounded-full ${st.bg}`} style={{ width: `${t.mastery}%` }} />
                      </div>
                      <span className="text-sm font-bold tabular-nums">{t.mastery}%</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">{isEn ? c.enStatus(t) : t.status}</p>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>

      {/* Teacher Recommendations */}
      <Card className="space-y-2 border-action">
        <CardTitle icon={MessageSquareText} iconClass="text-action" title={isEn ? "Teacher's recommendation" : 'શિક્ષકની ભલામણ અને સુધારણા માર્ગદર્શન'} />
        <p className="leading-relaxed">
          {isEn 
            ? 'Aarav exhibits exceptional handwriting skills in Gujarati alphabets and strong grasp of Solar System signs. In Mathematics, additional practice in Subtraction and Division is recommended. Parents are advised to spend 10 minutes daily on the Subtraction Writing Pad exercises.' 
            : 'આરવ ગુજરાતી મૂળાક્ષરો અને સૂર્યમંડળના સાઇન સંકેતોમાં ખૂબ જ કુશળ છે. ગણિતમાં બાદબાકી અને ભાગાકાર માં થોડા વધુ મહાવરાની જરૂર છે. આગામી અઠવાડિયે દરરોજ ૧૦ મિનિટ બાદબાકી પેડ પ્રેક્ટિસ કરવા ભલામણ છે.'}
        </p>
      </Card>

      <LessonVideoProgress />

      <WritingAttemptsPanel />

      {/* Recent activity (moved here from the Home screen) */}
      <Card className="space-y-3">
        <CardTitle icon={History} title={isEn ? 'Recent activity' : 'તાજેતરના પ્રયત્નો'} />
        <ul className="divide-y divide-line">
          {student.recentAttempts.map(att => (
            <li key={att.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{att.topic}</p>
                <p className="text-sm text-ink-muted">{att.date} · {att.time}</p>
              </div>
              <span className="shrink-0 font-bold tabular-nums px-2.5 py-1 rounded-lg bg-canvas border border-line">{att.score}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
