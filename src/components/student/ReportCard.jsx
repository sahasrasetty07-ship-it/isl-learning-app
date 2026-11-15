import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { computeReportStats, STATUS_LABELS, STATUS_THRESHOLDS } from '../../lib/reportStats';
import { Button, SUBJECT_STYLES } from '../ui';
import {
  Star,
  Flame,
  Clock,
  Printer,
  FileDown,
  BookOpen,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// One place for every colour used for a status. Text always sits next to the
// dot, so status is never communicated by colour alone.
const STATUS_STYLES = {
  mastered: { chip: 'border-success/40 bg-success-soft text-success', dot: 'bg-success' },
  'in-progress': { chip: 'border-line bg-canvas text-ink', dot: 'bg-ink-muted' },
  'needs-practice': { chip: 'border-action/40 bg-action-soft text-action', dot: 'bg-action' },
  'not-started': { chip: 'border-line bg-canvas text-ink-muted', dot: 'bg-ink-subtle' }
};

const StatusChip = ({ status, isEn }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES['not-started'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {isEn ? STATUS_LABELS[status].en : STATUS_LABELS[status].gu}
    </span>
  );
};

const Metric = ({ label, value, note, icon: Icon }) => (
  <div className="rounded-xl border border-line bg-surface p-4 print-avoid-break">
    <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {label}
    </dt>
    <dd className="mt-1 font-heading text-3xl font-bold leading-none tabular-nums">{value}</dd>
    {note && <p className="mt-1.5 text-xs text-ink-muted">{note}</p>}
  </div>
);

const minutesLabel = (minutes, isEn) => {
  if (minutes < 60) return `${minutes} ${isEn ? 'min' : 'મિનિટ'}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return isEn ? `${h} h ${m} min` : `${h} કલાક ${m} મિનિટ`;
};

const formatWhen = (iso, isEn) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(isEn ? 'en-IN' : 'gu-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ReportCard = () => {
  const { student, setActiveTab, showToast, uiLanguage } = useApp();
  const { profile } = useAuth();
  const isEn = uiLanguage === 'en';
  const [range, setRange] = useState('all');
  const [expanded, setExpanded] = useState({});

  const now = new Date();
  const days = range === 'week' ? 7 : null;
  const stats = computeReportStats(student, profile, now, { days });

  const displayName = stats.studentName || (isEn ? 'Student' : 'વિદ્યાર્થી');
  const profileLine = [stats.grade, stats.school].filter(Boolean).join(' · ');

  // Print is the only export path; the PDF button opens the same dialog.
  const handlePrint = () => window.print();
  const handleSavePdf = () => {
    showToast(
      isEn
        ? 'Choose “Save as PDF” as the printer in the print dialog.'
        : 'પ્રિન્ટ વિન્ડોમાં પ્રિન્ટર તરીકે “Save as PDF” પસંદ કરો.',
      'info'
    );
    window.print();
  };

  if (!student) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6" role="alert">
        <p className="font-semibold">{isEn ? 'Report unavailable' : 'પ્રગતિ પત્રક ઉપલબ્ધ નથી'}</p>
        <p className="text-sm text-ink-muted mt-1">
          {isEn ? 'Reload the page to try again.' : 'ફરી પ્રયત્ન કરવા પૃષ્ઠ ફરી લોડ કરો.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px] space-y-6 print:max-w-none">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {isEn ? 'Progress report' : 'પ્રગતિ પત્રક'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words" lang={/[\u0A80-\u0AFF]/.test(displayName) ? 'gu' : undefined}>
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {profileLine || (isEn ? 'Generated from saved activity' : 'સાચવેલી પ્રવૃત્તિ પરથી બનેલું')}
            {' · '}
            {now.toLocaleDateString(isEn ? 'en-IN' : 'gu-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print-hide">
          <div className="flex rounded-xl border border-line bg-surface p-1" role="group" aria-label={isEn ? 'Date range' : 'સમયગાળો'}>
            {[
              { id: 'all', label: isEn ? 'All time' : 'આજ સુધી' },
              { id: 'week', label: isEn ? 'Last 7 days' : 'છેલ્લા ૭ દિવસ' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={range === opt.id}
                onClick={() => setRange(opt.id)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition ${
                  range === opt.id ? 'bg-canvas text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" aria-hidden="true" />
            {isEn ? 'Print' : 'પ્રિન્ટ'}
          </Button>
          <Button onClick={handleSavePdf}>
            <FileDown className="w-4 h-4" aria-hidden="true" />
            {isEn ? 'Print / Save as PDF' : 'પ્રિન્ટ / PDF સાચવો'}
          </Button>
        </div>
      </header>

      {/* KPI row — every value is computed from saved activity */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric
          label={isEn ? 'Overall progress' : 'કુલ પ્રગતિ'}
          value={`${stats.overallProgress}%`}
          note={
            stats.hasActivity
              ? isEn
                ? `${stats.totalLessonsCompleted} of ${stats.totalLessons} lessons`
                : `${stats.totalLessons} માંથી ${stats.totalLessonsCompleted} પાઠ`
              : isEn ? 'No lessons yet' : 'હજુ કોઈ પાઠ નહીં'
          }
        />
        <Metric
          label={isEn ? 'Stars' : 'તારા'}
          value={stats.stars}
          note={isEn ? 'All time' : 'આજ સુધી'}
          icon={Star}
        />
        <Metric
          label={isEn ? 'Streak' : 'સતત અભ્યાસ'}
          value={`${stats.streakDays}`}
          note={isEn ? (stats.streakDays === 1 ? 'day' : 'days') : 'દિવસ'}
          icon={Flame}
        />
        <Metric
          label={isEn ? 'This week' : 'આ અઠવાડિયે'}
          value={stats.hasActivity ? minutesLabel(stats.weeklyMinutes, isEn) : '—'}
          note={isEn ? 'Tracked study time' : 'નોંધાયેલો અભ્યાસ સમય'}
          icon={Clock}
        />
      </dl>

      {!stats.hasActivity ? (
        /* Empty state: nothing has been recorded, so nothing is invented */
        <div className="rounded-xl border border-line bg-surface p-8 text-center space-y-3 print-avoid-break">
          <BookOpen className="w-8 h-8 mx-auto text-ink-muted" aria-hidden="true" />
          <h2 className="text-lg font-bold">{isEn ? 'No activity yet' : 'હજુ કોઈ પ્રવૃત્તિ નથી'}</h2>
          <p className="text-sm text-ink-muted max-w-sm mx-auto">
            {isEn
              ? 'Complete a lesson, a writing-pad practice or a quiz and the numbers will appear here.'
              : 'પાઠ પૂરો કરો, લેખન પેડ પર મહાવરો કરો કે ક્વિઝ આપો — પછી આંકડા અહીં દેખાશે.'}
          </p>
          <Button onClick={() => setActiveTab('gujarati')} className="print-hide">
            {isEn ? 'Start a lesson' : 'પાઠ શરૂ કરો'}
          </Button>
        </div>
      ) : (
        <>
          {/* Needs attention: the weakest practised topics only */}
          {stats.needsAttention.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-2 print-avoid-break" aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {isEn ? 'Needs attention' : 'ધ્યાન આપવા જેવા વિષયો'}
              </h2>
              <ul className="divide-y divide-line">
                {stats.needsAttention.map(t => (
                  <li key={`${t.subjectKey}:${t.id}`} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight" lang="gu">{t.name}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {isEn ? SUBJECT_STYLES[t.subjectKey].en : SUBJECT_STYLES[t.subjectKey].gu}
                        {' · '}
                        {isEn ? `${t.correct} of ${t.attempted} correct` : `${t.attempted} માંથી ${t.correct} સાચા`}
                        {' · '}{t.accuracy}%
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab(t.subjectKey)}
                      className="shrink-0 min-h-[36px] px-3 text-xs print-hide"
                    >
                      {isEn ? 'Practice' : 'મહાવરો'}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Subjects: compact rows, expandable to the topic list */}
          <section className="space-y-3" aria-labelledby="subjects-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="subjects-heading" className="text-lg font-bold">{isEn ? 'Subjects' : 'વિષયો'}</h2>
              <p className="text-xs text-ink-muted">
                {isEn ? 'Accuracy and topics for the selected range' : 'પસંદ કરેલા સમયગાળા માટે ચોકસાઈ અને વિષયો'}
              </p>
            </div>

            {stats.subjects.map(subject => {
              const st = SUBJECT_STYLES[subject.key];
              const isOpen = Boolean(expanded[subject.key]);
              return (
                <div key={subject.key} className="rounded-xl border border-line bg-surface print-avoid-break">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(prev => ({ ...prev, [subject.key]: !prev[subject.key] }))}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {/* Subject colour is a thin accent only */}
                    <span className={`w-1 self-stretch min-h-[36px] rounded-full ${st.bg}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-bold">{isEn ? st.en : st.gu}</span>
                        <span className="text-xs text-ink-muted tabular-nums">
                          {isEn
                            ? `${subject.lessonsCompleted} of ${subject.lessonsTotal} lessons`
                            : `${subject.lessonsTotal} માંથી ${subject.lessonsCompleted} પાઠ`}
                        </span>
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <span
                          className="h-1.5 flex-1 rounded-full bg-line overflow-hidden"
                          role="progressbar"
                          aria-valuenow={subject.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${isEn ? st.en : st.gu} lessons`}
                        >
                          <span className={`block h-full rounded-full ${st.bg}`} style={{ width: `${subject.progress}%` }} />
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-ink-muted w-9 text-right">{subject.progress}%</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-heading text-xl font-bold tabular-nums leading-none">
                        {subject.accuracy === null ? '—' : `${subject.accuracy}%`}
                      </span>
                      <span className="block text-xs text-ink-muted mt-1">{isEn ? 'accuracy' : 'ચોકસાઈ'}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-ink-muted transition-transform print-hide ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <div className={`border-t border-line px-4 pb-4 pt-2 ${isOpen ? '' : 'hidden print:block'}`}>
                    {subject.topics.length === 0 ? (
                      <p className="text-sm text-ink-muted py-2">{isEn ? 'No topics' : 'કોઈ વિષય નથી'}</p>
                    ) : (
                      <table className="w-full text-sm">
                        <caption className="sr-only">
                          {isEn ? `${st.en} topics: accuracy, attempts and status` : `${st.gu} વિષયો: ચોકસાઈ, પ્રયત્નો અને સ્થિતિ`}
                        </caption>
                        <thead className="hidden sm:table-header-group text-ink-muted">
                          <tr className="border-b border-line">
                            <th scope="col" className="py-2 text-left font-semibold">{isEn ? 'Topic' : 'વિષય'}</th>
                            <th scope="col" className="py-2 text-left font-semibold">{isEn ? 'Accuracy' : 'ચોકસાઈ'}</th>
                            <th scope="col" className="py-2 text-left font-semibold">{isEn ? 'Attempts' : 'પ્રયત્નો'}</th>
                            <th scope="col" className="py-2 text-left font-semibold">{isEn ? 'Status' : 'સ્થિતિ'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {subject.topics.map(topic => (
                            <tr key={topic.id} className="block sm:table-row py-2">
                              <th scope="row" className="block sm:table-cell py-1 text-left font-semibold" lang="gu">
                                {isEn ? topic.nameEn : topic.name}
                              </th>
                              <td className="block sm:table-cell py-1 sm:py-2 tabular-nums">
                                <span className="sm:hidden text-ink-muted">{isEn ? 'Accuracy: ' : 'ચોકસાઈ: '}</span>
                                {topic.accuracy === null ? '—' : `${topic.accuracy}%`}
                              </td>
                              <td className="block sm:table-cell py-1 sm:py-2 text-ink-muted tabular-nums">
                                <span className="sm:hidden">{isEn ? 'Attempts: ' : 'પ્રયત્નો: '}</span>
                                {topic.attempted === 0
                                  ? '—'
                                  : isEn
                                  ? `${topic.correct} of ${topic.attempted} correct`
                                  : `${topic.attempted} માંથી ${topic.correct} સાચા`}
                              </td>
                              <td className="block sm:table-cell py-1.5 sm:py-2">
                                <StatusChip status={topic.status} isEn={isEn} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <p className="mt-2 text-xs text-ink-muted">
                      {isEn
                        ? `Mastered needs ${STATUS_THRESHOLDS.masteredMinAccuracy}% over ${STATUS_THRESHOLDS.masteredMinAttempts}+ attempts; below ${STATUS_THRESHOLDS.needsPracticeBelow}% needs practice.`
                        : `નિપુણ માટે ${STATUS_THRESHOLDS.masteredMinAttempts}+ પ્રયત્નોમાં ${STATUS_THRESHOLDS.masteredMinAccuracy}% જરૂરી; ${STATUS_THRESHOLDS.needsPracticeBelow}% થી નીચે મહાવરો જરૂરી.`}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Recent activity: the last five saved attempts */}
          {stats.recentActivity.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-2 print-avoid-break" aria-labelledby="recent-heading">
              <h2 id="recent-heading" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {isEn ? 'Recent activity' : 'તાજેતરની પ્રવૃત્તિ'}
              </h2>
              <ul className="divide-y divide-line">
                {stats.recentActivity.map(a => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{a.topic || (isEn ? 'Practice' : 'મહાવરો')}</span>
                      <span className="block text-xs text-ink-muted">
                        {isEn ? SUBJECT_STYLES[a.subjectKey]?.en : SUBJECT_STYLES[a.subjectKey]?.gu}
                        {' · '}{formatWhen(a.at, isEn)}
                      </span>
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${a.correct ? 'text-success' : 'text-danger'}`}>
                      {a.correct
                        ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        : <XCircle className="w-4 h-4" aria-hidden="true" />}
                      {a.correct ? (isEn ? 'Correct' : 'સાચું') : (isEn ? 'Not correct' : 'ખોટું')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {stats.recentActivity.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {isEn ? 'No attempts in this range.' : 'આ સમયગાળામાં કોઈ પ્રયત્ન નથી.'}
            </p>
          )}
        </>
      )}
    </div>
  );
};
