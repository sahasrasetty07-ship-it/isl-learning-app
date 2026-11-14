import { useApp } from '../../context/AppContext';
import { SUBJECT_STYLES, ProgressBar, PageHeader } from '../ui';
import { BookOpen, ChevronRight } from 'lucide-react';

const SUBJECT_TEXT = {
  gujarati: { en: 'Letters, numbers, sentences and writing pad', gu: 'અક્ષરો, અંકો, વાક્યો અને લેખન પેડ' },
  math: { en: 'Tables, operations and practice questions', gu: 'ઘડિયા, ક્રિયાઓ અને મહાવરાના પ્રશ્નો' },
  science: { en: 'Lessons, key signs, writing and quiz', gu: 'પાઠ, મુખ્ય સંકેતો, લેખન અને ક્વિઝ' }
};

// The three subjects as large tap rows. Used by Learn and by the student Home screen.
export const SubjectList = () => {
  const { student, setActiveTab, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  return (
    <ul className="space-y-3">
      {['gujarati', 'math', 'science'].map(key => {
        const s = SUBJECT_STYLES[key];
        const progress = student.subjects[key].progress;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => setActiveTab(key)}
              className="w-full text-left bg-surface border border-line rounded-2xl p-4 flex items-center gap-4 hover:border-ink-muted transition"
            >
              <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${s.soft} ${s.text}`}>
                <s.icon className="w-7 h-7" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0 space-y-2">
                <span className="block">
                  <span className="block font-heading text-xl font-bold leading-tight">{isEn ? s.en : s.gu}</span>
                  <span className="block text-sm text-ink-muted">{isEn ? SUBJECT_TEXT[key].en : SUBJECT_TEXT[key].gu}</span>
                </span>
                <ProgressBar value={progress} color={s.bg} valueText={isEn ? `${progress}% done` : `${progress}% પૂર્ણ`} label={null} />
              </span>
              <ChevronRight className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const LearnHub = () => {
  const { uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  return (
    <div className="space-y-5">
      <PageHeader
        icon={BookOpen}
        title={isEn ? 'Learn' : 'શીખો'}
        subtitle={isEn ? 'Choose a subject' : 'વિષય પસંદ કરો'}
      />
      <SubjectList />
    </div>
  );
};
