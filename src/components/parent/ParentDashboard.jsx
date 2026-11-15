import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { computeReportStats } from '../../lib/reportStats';
import { WritingAttemptsPanel } from '../common/WritingAttemptsPanel';
import { LessonVideoProgress } from '../common/LessonVideoProgress';
import { Card, CardTitle, IconButton, PageHeader, ProgressBar, SUBJECT_STYLES } from '../ui';
import {
  Heart,
  Play,
  Volume2,
  Flame,
  Users
} from 'lucide-react';

export const ParentDashboard = () => {
  const { student, setActiveVideoModal, speakText, uiLanguage } = useApp();
  const { profile } = useAuth();
  const isEn = uiLanguage === 'en';
  // Same numbers as the student report and the header pills
  const stats = computeReportStats(student, profile);
  const childName = stats.studentName || (isEn ? 'Student' : 'વિદ્યાર્થી');

  const homePhrases = [
    {
      gujarati: 'જમવા માટે આવો',
      english: 'Come to eat food',
      signDescription: isEn 
        ? 'Bring hand to mouth to sign eating, then wave with the other hand to call.' 
        : 'મોં પાસે હાથ લઈ જઈ જમવાનો સંકેત કરો અને બીજા હાથે બોલાવવાનો સંકેત કરો.',
      category: isEn ? 'Daily Routine' : 'ઘર વપરાશ'
    },
    {
      gujarati: 'હોમવર્ક પૂર્ણ કરો',
      english: 'Complete your homework',
      signDescription: isEn 
        ? 'Sign opening a book and writing with a pencil.' 
        : 'પુસ્તક વાંચવાનો અભિનય કરી પેન્સિલથી લખવાનો સંકેત કરો.',
      category: isEn ? 'Study' : 'અભ્યાસ'
    },
    {
      gujarati: 'શું તરસ લાગી છે?',
      english: 'Are you thirsty? Want water?',
      signDescription: isEn 
        ? 'Touch throat, then form W-shape near lips to ask for water.' 
        : 'ગળા પર હાથ ફેરવો અને હોઠ પાસે W આકારથી પાણી પીવાનો પ્રશ્નાર્થ સંકેત કરો.',
      category: isEn ? 'Needs' : 'જરૂરિયાત'
    },
    {
      gujarati: 'સુઈ જવાનો સમય થયો',
      english: 'Time to sleep',
      signDescription: isEn 
        ? 'Place palms together beside cheek and tilt head with eyes closed.' 
        : 'બંને હથેળીઓ જોડી ગાલની બાજુમાં માથું ઢાળી આંખો બંધ કરો.',
      category: isEn ? 'Bedtime' : 'દિનચર્યા'
    },
    {
      gujarati: 'ખૂબ સરસ! શાબાશ!',
      english: 'Well done! Proud of you!',
      signDescription: isEn 
        ? 'Show thumbs up with both hands and clap with a smiling expression.' 
        : 'બંને હાથના થમ્બ્સ અપ કરી ચહેરા પર સ્મિત સાથે તાળી પાડો.',
      category: isEn ? 'Encouragement' : 'પ્રોત્સાહન'
    }
  ];

  const subjectBars = stats.subjects.map(s => ({
    key: s.key,
    en: SUBJECT_STYLES[s.key].en,
    gu: SUBJECT_STYLES[s.key].gu,
    progress: s.progress,
    noteEn: s.lessonsCompleted === 0
      ? 'No lessons completed yet'
      : `Lessons ${s.lessonsCompleted} of ${s.lessonsTotal}${s.accuracy === null ? '' : ` · ${s.accuracy}% accuracy`}`,
    noteGu: s.lessonsCompleted === 0
      ? 'હજુ કોઈ પાઠ પૂરો નથી'
      : `પાઠ ${s.lessonsTotal} માંથી ${s.lessonsCompleted}${s.accuracy === null ? '' : ` · ${s.accuracy}% ચોકસાઈ`}`
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={isEn ? 'Welcome, parent' : 'નમસ્તે, વાલીશ્રી'}
        subtitle={isEn
          ? "Your child's progress and signs to use at home."
          : 'તમારા બાળકની પ્રગતિ અને ઘરે વાપરવાના સંકેતો.'}
      />

      {/* Child's progress: three bars */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">{childName}</h2>
            {(stats.grade || stats.school) && (
              <p className="text-sm text-ink-muted">{[stats.grade, stats.school].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-canvas border border-line text-sm font-semibold">
            <Flame className="w-4 h-4 text-action" aria-hidden="true" />
            {stats.streakDays} {isEn ? 'day streak' : 'દિવસથી નિયમિત'}
          </span>
        </div>
        {subjectBars.map(b => {
          const st = SUBJECT_STYLES[b.key];
          return (
            <div key={b.key} className="space-y-1">
              <ProgressBar
                label={isEn ? b.en : b.gu}
                value={b.progress}
                color={st.bg}
              />
              <p className="text-sm text-ink-muted">{isEn ? b.noteEn : b.noteGu}</p>
            </div>
          );
        })}
      </Card>

      {/* Home signs: tap a row to play the sign */}
      <Card className="space-y-3">
        <CardTitle
          icon={Heart}
          iconClass="text-action"
          title={isEn ? 'Signs to use at home' : 'ઘર વપરાશની સરળ સાઇન શબ્દાવલિ'}
          subtitle={isEn
            ? 'Tap a sign to watch it. No sign language course needed.'
            : 'સંકેત જોવા માટે દબાવો. સાઇન ભાષા શીખ્યા વગર બાળક સાથે વાતચીત કરો.'}
        />
        <ul className="divide-y divide-line">
          {homePhrases.map((phrase, idx) => (
            <li key={idx} className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => {
                  setActiveVideoModal({
                    title: phrase.gujarati,
                    gujarati: phrase.gujarati,
                    english: phrase.english,
                    signDescription: phrase.signDescription,
                    category: phrase.category
                  });
                }}
                className="flex-1 min-w-0 flex items-center gap-3 min-h-[60px] -ml-2 px-2 rounded-xl text-left hover:bg-canvas transition"
              >
                <span className="w-11 h-11 shrink-0 rounded-full bg-action text-white flex items-center justify-center">
                  <Play className="w-5 h-5 fill-white" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-lg font-bold leading-tight">{phrase.gujarati}</span>
                  <span className="block text-sm text-ink-muted">{phrase.english} · {phrase.category}</span>
                </span>
              </button>
              <IconButton onClick={() => speakText(phrase.gujarati)} label={isEn ? `Say "${phrase.english}"` : 'બોલો'}>
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      </Card>

      <LessonVideoProgress
        subtitle={isEn
          ? 'Letters and numbers where your child has watched the sign, how-to-write and how-to-say videos.'
          : 'જે અક્ષરો અને સંખ્યાઓના સાઇન, લખવાના અને બોલવાના વિડીયો તમારા બાળકે જોયા છે.'}
      />

      <WritingAttemptsPanel
        limit={5}
        subtitle={isEn
          ? "Your child's latest letter-writing attempts and how close each one was."
          : 'તમારા બાળકના તાજેતરના અક્ષર-લેખન પ્રયત્નો અને દરેક કેટલો સાચો હતો.'}
      />
    </div>
  );
};
