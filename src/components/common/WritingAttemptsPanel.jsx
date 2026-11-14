import { useApp } from '../../context/AppContext';
import { CheckCircle2, XCircle, PenLine, Star } from 'lucide-react';
import { WRITING_ERRORS, SUBJECT_LABELS, formatAttemptTime, summariseWriting } from '../../utils/writingFeedback';
import { Card, CardTitle } from '../ui';

// Handwriting attempt history: summary tiles + latest attempts.
// Used by the student report, the teacher dashboard and the parent view.
export const WritingAttemptsPanel = ({ title, subtitle, limit = 8 }) => {
  const { student, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  const attempts = student.writingAttempts || [];
  const summary = summariseWriting(attempts, student.writingStars);

  const tiles = [
    { label: isEn ? 'Attempts' : 'પ્રયત્નો', value: summary.total },
    { label: isEn ? 'Passed' : 'સફળ', value: `${summary.passRate}%` },
    { label: isEn ? 'Avg score' : 'સરેરાશ ગુણ', value: summary.avgScore },
    { label: isEn ? 'Letters with stars' : 'તારા મેળવેલ અક્ષરો', value: summary.mastered }
  ];

  return (
    <Card className="space-y-4">
      <CardTitle
        icon={PenLine}
        iconClass="text-action"
        title={title || (isEn ? 'Handwriting practice' : 'અક્ષર લેખન મહાવરો')}
        subtitle={subtitle || (isEn
          ? 'Every checked attempt on the writing pad, with stroke-check score and the problem found.'
          : 'લેખન પેડ પરનો દરેક તપાસાયેલ પ્રયત્ન, ગુણ અને મળેલી ભૂલ સાથે.')}
      />

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl bg-canvas border border-line p-3">
            <dt className="text-sm text-ink-muted">{t.label}</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{t.value}</dd>
          </div>
        ))}
      </dl>

      {attempts.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {isEn ? 'No writing attempts yet.' : 'હજુ કોઈ લેખન પ્રયત્ન નથી.'}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line overflow-hidden">
          {attempts.slice(0, limit).map(a => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-canvas border border-line flex items-center justify-center font-baloo font-bold text-xl leading-none pt-1">
                {a.character}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  {a.passed
                    ? <CheckCircle2 className="w-4 h-4 text-pad-pass shrink-0" aria-hidden="true" />
                    : <XCircle className="w-4 h-4 text-pad-wrong shrink-0" aria-hidden="true" />}
                  <span className={a.passed ? 'text-pad-pass' : 'text-pad-wrong'}>
                    {a.passed
                      ? (isEn ? 'Passed' : 'સાચું')
                      : (isEn ? WRITING_ERRORS[a.error]?.en : WRITING_ERRORS[a.error]?.gu) || (isEn ? 'Not passed' : 'ફરી પ્રયત્ન')}
                  </span>
                </div>
                <div className="text-sm text-ink-muted truncate">
                  {isEn ? SUBJECT_LABELS[a.subject]?.en : SUBJECT_LABELS[a.subject]?.gu}
                  {' · '}{isEn ? `Attempt ${a.attempt}` : `પ્રયત્ન ${a.attempt}`}
                  {' · '}{formatAttemptTime(a.at, isEn)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold tabular-nums">{a.score}</div>
                {a.stars > 0 && (
                  <div className="flex items-center justify-end gap-0.5 text-sm font-bold text-action">
                    <Star className="w-3.5 h-3.5 fill-action text-action" aria-hidden="true" />+{a.stars}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
