import { useApp } from '../../context/AppContext';
import { WritingAttemptsPanel } from '../common/WritingAttemptsPanel';
import { LessonVideoProgress } from '../common/LessonVideoProgress';
import { Card, CardTitle, IconButton, PageHeader, ProgressBar, SUBJECT_STYLES } from '../ui';
import {
  Heart,
  Play,
  Volume2,
  Flame,
  MessageSquareText,
  Users
} from 'lucide-react';

export const ParentDashboard = () => {
  const { student, studentsList, setActiveVideoModal, speakText, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

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

  const rosterEntry = studentsList.find(s => s.id === student.id);
  const subjectBars = [
    { key: 'gujarati', en: 'Gujarati', gu: 'ગુજરાતી ભાષા', noteEn: 'Handwriting is excellent', noteGu: 'અક્ષરલેખન ઉત્તમ છે' },
    { key: 'math', en: 'Maths', gu: 'ગણિત શિક્ષણ', noteEn: 'Practice subtraction at home', noteGu: 'બાદબાકીમાં મદદ કરો' },
    { key: 'science', en: 'Science', gu: 'વિજ્ઞાન ખ્યાલો', noteEn: 'Solar system signs mastered', noteGu: 'સૂર્યમંડળ સાઇન પૂર્ણ' }
  ];

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
            <h2 className="text-xl font-bold leading-tight">{student.name}</h2>
            <p className="text-sm text-ink-muted">{student.grade} · {student.school}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-canvas border border-line text-sm font-semibold">
            <Flame className="w-4 h-4 text-action" aria-hidden="true" />
            {student.currentStreak} {isEn ? 'day streak' : 'દિવસથી નિયમિત'}
          </span>
        </div>
        {subjectBars.map(b => {
          const st = SUBJECT_STYLES[b.key];
          return (
            <div key={b.key} className="space-y-1">
              <ProgressBar
                label={isEn ? b.en : b.gu}
                value={student.subjects[b.key].progress}
                color={st.bg}
              />
              <p className="text-sm text-ink-muted">{isEn ? b.noteEn : b.noteGu}</p>
            </div>
          );
        })}
      </Card>

      {/* Teacher's recommendation */}
      <Card className="space-y-2 border-action">
        <CardTitle icon={MessageSquareText} iconClass="text-action" title={isEn ? "Teacher's recommendation" : 'શિક્ષકની ભલામણ'} />
        <p className="leading-relaxed">
          {isEn
            ? 'Aarav exhibits exceptional handwriting skills in Gujarati alphabets and strong grasp of Solar System signs. In Mathematics, additional practice in Subtraction and Division is recommended. Parents are advised to spend 10 minutes daily on the Subtraction Writing Pad exercises.'
            : 'આરવ ગુજરાતી મૂળાક્ષરો અને સૂર્યમંડળના સાઇન સંકેતોમાં ખૂબ જ કુશળ છે. ગણિતમાં બાદબાકી અને ભાગાકાર માં થોડા વધુ મહાવરાની જરૂર છે. આગામી અઠવાડિયે દરરોજ ૧૦ મિનિટ બાદબાકી પેડ પ્રેક્ટિસ કરવા ભલામણ છે.'}
        </p>
        {rosterEntry?.weakTopic && (
          <p className="text-sm">
            <span className="text-ink-muted">{isEn ? 'Practise at home:' : 'ઘરે મહાવરો:'}</span>{' '}
            <span className="font-semibold px-2 py-0.5 rounded-lg bg-action-soft">{rosterEntry.weakTopic}</span>
          </p>
        )}
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
