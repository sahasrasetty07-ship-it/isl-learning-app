import { useApp } from '../../context/AppContext';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';

// Shows progress of the teacher assignment the student is working on in this subject.
export const AssignmentBanner = ({ subjectKey }) => {
  const { activeAssignment: asg, stopAssignment, setActiveTab, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  if (!asg || asg.subjectKey !== subjectKey) return null;

  const finished = asg.done >= asg.count;
  const finish = () => {
    stopAssignment();
    setActiveTab('dashboard');
  };

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 ${
      finished ? 'bg-success-soft border-success' : 'bg-surface border-line'
    }`}>
      {finished
        ? <CheckCircle2 className="w-6 h-6 text-success shrink-0" aria-hidden="true" />
        : <ClipboardCheck className="w-6 h-6 text-action shrink-0" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-ink-muted">
          {finished ? (isEn ? 'Homework finished' : 'ગૃહકાર્ય પૂર્ણ') : (isEn ? 'Homework' : 'ગૃહકાર્ય')}
        </p>
        <p className="text-sm font-bold truncate">{asg.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-2.5 bg-line rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${finished ? 'bg-success' : 'bg-action'}`}
              style={{ width: `${(100 * asg.done) / asg.count}%` }}
            />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
            {asg.done}/{asg.count} · {isEn ? `${asg.correct} correct` : `${asg.correct} સાચા`}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={finish}
        className={`inline-flex items-center gap-1.5 min-h-tap px-4 rounded-xl text-sm font-semibold shrink-0 transition ${
          finished ? 'bg-action hover:bg-action-hover text-white' : 'bg-surface border border-line hover:bg-canvas'
        }`}
      >
        {finished && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
        {finished ? (isEn ? 'Done' : 'પૂર્ણ') : (isEn ? 'Pause' : 'થોભો')}
      </button>
    </div>
  );
};
