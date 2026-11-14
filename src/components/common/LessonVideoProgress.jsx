import { useApp } from '../../context/AppContext';
import { Clapperboard } from 'lucide-react';
import { summariseLessonClips } from '../../data/lessonClips';
import { Card, CardTitle, ProgressBar } from '../ui';

// Lesson video progress: how many letters / numbers have had all their
// clips (sign, how to write, how to say) watched.
export const LessonVideoProgress = ({ subtitle }) => {
  const { student, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const summary = summariseLessonClips(student.lessonClips);
  const labels = {
    letter: isEn ? 'Letters' : 'મૂળાક્ષરો',
    number: isEn ? 'Numbers' : 'સંખ્યાઓ'
  };

  return (
    <Card className="space-y-4">
      <CardTitle
        icon={Clapperboard}
        iconClass="text-action"
        title={isEn ? 'Lesson videos watched' : 'જોયેલા પાઠ વિડીયો'}
        subtitle={subtitle || (isEn
          ? 'A lesson counts as complete once its sign, how-to-write and how-to-say clips have been watched.'
          : 'સાઇન, કેવી રીતે લખવું અને કેવી રીતે બોલવું — ત્રણેય વિડીયો જોયા પછી પાઠ પૂર્ણ ગણાય.')}
      />
      {summary.kinds.map(k => (
        <div key={k.kind} className="space-y-1">
          <ProgressBar
            label={labels[k.kind]}
            value={(100 * k.complete) / k.total}
            valueText={`${k.complete}/${k.total} ${isEn ? 'complete' : 'પૂર્ણ'}`}
          />
          <p className="text-sm text-ink-muted">
            {isEn
              ? `Sign ${k.sign} · How to write ${k.write} · How to say ${k.say}`
              : `સાઇન ${k.sign} · લખવું ${k.write} · બોલવું ${k.say}`}
          </p>
        </div>
      ))}
    </Card>
  );
};
