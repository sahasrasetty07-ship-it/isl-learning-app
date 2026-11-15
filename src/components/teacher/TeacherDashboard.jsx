import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp, DEFAULT_WRITING_THRESHOLD } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getLinkedStudents, unlinkStudent, linkErrorMessage } from '../../lib/linking';
import { loadProgress } from '../../lib/progress';
import { StudentReportView } from '../student/ReportCard';
import { LinkStudentCard } from '../linking/LinkStudentCard';
import { mathLessons } from '../../data/mathLessons';
import { scienceLessons } from '../../data/scienceLessons';
import { Card, CardTitle, Button, IconButton, PageHeader } from '../ui';
import {
  PlusCircle,
  Search,
  Eye,
  X,
  LayoutDashboard,
  Users,
  ClipboardList,
  Presentation,
  ChevronRight,
  RefreshCw,
  Loader2,
  Trash2,
  AlertTriangle,
  PenLine
} from 'lucide-react';

const SECTIONS = [
  { id: 't-overview', icon: LayoutDashboard, en: 'Overview', gu: 'ઝાંખી' },
  { id: 't-students', icon: Users, en: 'Students', gu: 'વિદ્યાર્થીઓ' },
  { id: 't-practice', icon: ClipboardList, en: 'Assigned practice', gu: 'આપેલ મહાવરો' }
];

const SUBJECTS = {
  math: {
    label: 'ગણિત',
    en: 'Mathematics',
    topics: [{ id: 'mixed', title: 'મિશ્ર દાખલા (+ − × ÷)' }, ...mathLessons.operations.map(o => ({ id: o.id, title: o.title }))]
  },
  science: {
    label: 'વિજ્ઞાન',
    en: 'Science',
    topics: scienceLessons.map(l => ({ id: l.id, title: l.title }))
  },
  gujarati: {
    label: 'ગુજરાતી',
    en: 'Gujarati',
    topics: [{ id: 'writing', title: 'અક્ષર લેખન (Letter writing)' }]
  }
};
const COUNTS = [5, 10, 20];
const ASSIGNMENTS_KEY = 'gsl-teacher-assignments-v1';
const RELOAD_MS = 30000;

const readAssignments = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const TeacherDashboard = () => {
  const { showToast, uiLanguage, setCurrentRole, setActiveTab, writingThreshold, setWritingThreshold } = useApp();
  const { profile, user } = useAuth();
  const isEn = uiLanguage === 'en';
  const teacherName = profile?.display_name || profile?.full_name || (isEn ? 'Teacher' : 'શિક્ષક');

  const [students, setStudents] = useState([]);
  const [progressById, setProgressById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewing, setViewing] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [assignments, setAssignments] = useState(readAssignments);
  const [assignmentTarget, setAssignmentTarget] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [subjectKey, setSubjectKey] = useState('math');
  const [topicId, setTopicId] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState('');

  const mounted = useRef(true);

  const loadChildProgress = useCallback(async (studentId) => {
    const result = await loadProgress(studentId);
    if (!mounted.current || !result.data) return;
    setProgressById(prev => ({ ...prev, [studentId]: result.data }));
  }, []);

  const load = useCallback(async () => {
    const result = await getLinkedStudents();
    if (!mounted.current) return;
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setStudents(result.students);
    setError(null);
    setAssignmentTarget(prev => prev || result.students[0]?.student_id || '');
    await Promise.all(result.students.map(s => loadChildProgress(s.student_id)));
    setLoading(false);
  }, [loadChildProgress]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, RELOAD_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    } catch {
      /* storage may be unavailable */
    }
  }, [assignments]);

  const studentName = (s) => s?.display_name || (isEn ? 'Student' : 'વિદ્યાર્થી');

  const rows = students.map(s => {
    const progress = progressById[s.student_id] || {};
    return {
      ...s,
      stars: Number(s.total_stars ?? progress.totalStars) || 0,
      streak: Number(s.current_streak ?? progress.currentStreak) || 0,
      updated: s.updated_at || progress.updatedAt
    };
  });

  const filtered = rows.filter(s =>
    studentName(s).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const remove = async (studentId) => {
    const result = await unlinkStudent(studentId, user?.id);
    setConfirmRemove(null);
    if (result.ok) {
      setStudents(prev => prev.filter(s => s.student_id !== studentId));
      showToast?.(isEn ? 'Student removed' : 'વિદ્યાર્થી દૂર કર્યો', 'success');
    } else {
      setError(result.error);
    }
  };

  const createAssignment = (event) => {
    event.preventDefault();
    const target = students.find(s => s.student_id === assignmentTarget);
    if (!target) return;
    const topic = SUBJECTS[subjectKey].topics.find(t => t.id === topicId);
    const title = assignmentTitle.trim() || `${topic.title} – ${questionCount} ${isEn ? 'questions' : 'પ્રશ્નો'}`;
    setAssignments(prev => [
      {
        id: `asg-${Date.now()}`,
        studentId: target.student_id,
        studentName: studentName(target),
        subjectKey,
        exerciseType: topicId,
        title,
        count: questionCount,
        dueDate: dueDate || (isEn ? 'No date' : 'મુદત નથી')
      },
      ...prev
    ]);
    setShowCreateModal(false);
    setAssignmentTitle('');
    showToast?.(isEn ? `Assigned "${title}"` : `"${title}" ફાળવ્યું`, 'success');
  };

  const inputClass = 'w-full min-h-tap px-3 text-base rounded-xl border border-line bg-surface focus:outline-none focus:border-action focus:ring-2 focus:ring-action/30';

  return (
    <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <nav aria-label={isEn ? 'Teacher menu' : 'શિક્ષક મેનુ'} className="mb-5 lg:mb-0 print-hide">
        <ul className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:sticky lg:top-24">
          {SECTIONS.map(sec => (
            <li key={sec.id} className="shrink-0">
              <a
                href={`#${sec.id}`}
                className="flex items-center gap-2.5 min-h-tap px-3 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-line transition whitespace-nowrap"
              >
                <sec.icon className="w-5 h-5" aria-hidden="true" />
                {isEn ? sec.en : sec.gu}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6 min-w-0">
        <div id="t-overview" className="scroll-mt-24 space-y-5">
          <PageHeader
            icon={Presentation}
            title={teacherName}
            subtitle={
              loading
                ? (isEn ? 'Loading your class…' : 'તમારો વર્ગ લોડ થઈ રહ્યો છે…')
                : isEn
                ? `${rows.length} student${rows.length === 1 ? '' : 's'} linked`
                : `${rows.length} વિદ્યાર્થી જોડાયેલા`
            }
            actions={
              <>
                <button
                  type="button"
                  onClick={load}
                  className="min-h-[40px] px-3 rounded-xl border border-line bg-surface text-sm font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  {isEn ? 'Refresh' : 'તાજું કરો'}
                </button>
                <Button onClick={() => setShowCreateModal(true)} disabled={students.length === 0}>
                  <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  {isEn ? 'Assign new work' : 'નવું સ્વાધ્યાય આપો'}
                </Button>
              </>
            }
          />
        </div>

        <LinkStudentCard
          isEn={isEn}
          onLinked={(result) => {
            if (!result?.alreadyLinked) load();
          }}
        />

        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {linkErrorMessage(error, isEn)}
          </p>
        )}

        {/* Class list from linked students + their saved progress */}
        <Card id="t-students" className="scroll-mt-24 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <CardTitle
              title={isEn ? 'Students' : 'વિદ્યાર્થીઓ'}
              subtitle={isEn ? 'Linked to your account' : 'તમારા ખાતા સાથે જોડાયેલા'}
            />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                aria-label={isEn ? 'Search student' : 'વિદ્યાર્થી શોધો'}
                placeholder={isEn ? 'Search student…' : 'વિદ્યાર્થી શોધો…'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 min-h-tap pl-9 pr-3 text-sm rounded-xl border border-line bg-surface focus:outline-none focus:border-action"
              />
            </div>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {isEn ? 'Loading…' : 'લોડ થઈ રહ્યું છે…'}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink-muted py-3">
              {students.length === 0
                ? isEn
                  ? 'No students linked yet. Add one with their 6-character code above.'
                  : 'હજુ કોઈ વિદ્યાર્થી જોડાયો નથી. ઉપર તેમના ૬-અક્ષર કોડથી ઉમેરો.'
                : isEn ? 'No student matches that search.' : 'આ શોધ સાથે કોઈ વિદ્યાર્થી મળતો નથી.'}
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Student' : 'વિદ્યાર્થી'}</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Stars' : 'તારા'}</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Streak' : 'સતત અભ્યાસ'}</th>
                      <th scope="col" className="py-2 text-right font-semibold"><span className="sr-only">{isEn ? 'Actions' : 'ક્રિયા'}</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map(s => (
                      <tr key={s.student_id}>
                        <th scope="row" className="py-3 pr-3 font-bold">{studentName(s)}</th>
                        <td className="py-3 pr-3 tabular-nums">{s.stars}</td>
                        <td className="py-3 pr-3 tabular-nums">{s.streak}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <IconButton onClick={() => setViewing(s)} label={isEn ? `Report for ${studentName(s)}` : `${studentName(s)} નો રિપોર્ટ`}>
                              <Eye className="w-5 h-5" aria-hidden="true" />
                            </IconButton>
                            {confirmRemove === s.student_id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => remove(s.student_id)}
                                  className="min-h-[36px] px-3 rounded-lg bg-danger text-white text-xs font-bold"
                                >
                                  {isEn ? 'Confirm' : 'પુષ્ટિ'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemove(null)}
                                  className="min-h-[36px] px-2 rounded-lg border border-line text-xs font-semibold"
                                >
                                  {isEn ? 'Cancel' : 'રદ'}
                                </button>
                              </>
                            ) : (
                              <IconButton onClick={() => setConfirmRemove(s.student_id)} label={isEn ? `Remove ${studentName(s)}` : `${studentName(s)} દૂર કરો`}>
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="md:hidden space-y-2">
                {filtered.map(s => (
                  <li key={s.student_id} className="rounded-xl border border-line p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{studentName(s)}</span>
                      <span className="text-xs text-ink-muted tabular-nums">
                        {s.stars} ★ · {s.streak}d
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setViewing(s)} className="flex-1 min-h-[44px]">
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        {isEn ? 'View' : 'જુઓ'}
                      </Button>
                      <Button variant="secondary" onClick={() => remove(s.student_id)} className="min-h-[44px] text-danger">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        {isEn ? 'Remove' : 'દૂર કરો'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Assigned practice: targets real linked students, stored on this device */}
        <Card id="t-practice" className="scroll-mt-24 space-y-3">
          <CardTitle
            title={isEn ? 'Assigned practice' : 'આપેલ મહાવરો'}
            subtitle={isEn
              ? 'Set for a linked student. Saved on this device — students don’t receive assignments yet.'
              : 'જોડાયેલ વિદ્યાર્થી માટે. આ ઉપકરણ પર સાચવેલું — વિદ્યાર્થી સુધી હજુ પહોંચતું નથી.'}
          />
          {assignments.length === 0 ? (
            <p className="text-sm text-ink-muted">{isEn ? 'No practice assigned yet.' : 'હજુ કોઈ મહાવરો આપ્યો નથી.'}</p>
          ) : (
            <ul className="divide-y divide-line">
              {assignments.map(asg => (
                <li key={asg.id} className="py-2.5 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{asg.title}</p>
                    <p className="text-xs text-ink-muted">
                      {asg.studentName} · {isEn ? SUBJECTS[asg.subjectKey]?.en : SUBJECTS[asg.subjectKey]?.label} ·{' '}
                      {isEn ? 'Due' : 'મુદત'} {asg.dueDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignments(prev => prev.filter(a => a.id !== asg.id))}
                    className="min-h-[36px] px-2 rounded-lg border border-line text-xs font-semibold shrink-0"
                  >
                    {isEn ? 'Remove' : 'દૂર કરો'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Handwriting pass mark (a real teacher setting) */}
        <Card className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <CardTitle
              title={isEn ? 'Handwriting check strictness' : 'લેખન ચકાસણીની કડકાઈ'}
              subtitle={isEn
                ? 'Pass mark for the writing pad. Applies on this device.'
                : 'લેખન પેડ માટે પાસ ગુણ. આ ઉપકરણ પર લાગુ થાય.'}
            />
            <div className="sm:text-right shrink-0">
              <div className="font-heading text-4xl font-bold text-action tabular-nums leading-none">{writingThreshold}</div>
              <div className="text-sm text-ink-muted">{isEn ? 'pass mark' : 'પાસ ગુણ'}</div>
            </div>
          </div>
          <input
            type="range"
            min={60}
            max={100}
            step={5}
            value={writingThreshold}
            onChange={(e) => setWritingThreshold(Number(e.target.value))}
            className="w-full h-11 accent-[#C2410C] cursor-pointer"
            aria-label={isEn ? 'Handwriting pass mark' : 'લેખન પાસ ગુણ'}
          />
          {writingThreshold !== DEFAULT_WRITING_THRESHOLD && (
            <Button variant="ghost" onClick={() => setWritingThreshold(DEFAULT_WRITING_THRESHOLD)}>
              {isEn ? `Reset to ${DEFAULT_WRITING_THRESHOLD}` : `${DEFAULT_WRITING_THRESHOLD} પર પાછું`}
            </Button>
          )}
        </Card>

        {/* Teach in class */}
        <Card className="space-y-3">
          <CardTitle
            title={isEn ? 'Teach in class' : 'વર્ગમાં ભણાવો'}
            subtitle={isEn ? 'Open a lesson screen full-width.' : 'પાઠ મોટી સ્ક્રીન પર ખોલો.'}
          />
          <ul className="space-y-2">
            {[
              { tab: 'gujarati', en: 'Gujarati letters & numbers', gu: 'ગુજરાતી અક્ષરો અને સંખ્યા' },
              { tab: 'math', en: 'Maths: tables & operations', gu: 'ગણિત: ઘડિયા અને ક્રિયાઓ' },
              { tab: 'science', en: 'Science lessons', gu: 'વિજ્ઞાનના પાઠ' }
            ].map(item => (
              <li key={item.tab}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('student');
                    setActiveTab(item.tab);
                  }}
                  className="w-full flex items-center gap-3 min-h-[56px] p-2 rounded-xl border border-line hover:bg-canvas text-left transition"
                >
                  <span className="w-10 h-10 shrink-0 rounded-lg bg-canvas border border-line flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-ink-muted" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-sm font-semibold">{isEn ? item.en : item.gu}</span>
                  <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Create assignment modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="assign-title">
          <div className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-line p-5 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 id="assign-title" className="text-xl font-bold">{isEn ? 'Assign practice' : 'નવું સ્વાધ્યાય આપો'}</h2>
              <IconButton onClick={() => setShowCreateModal(false)} label={isEn ? 'Close' : 'બંધ કરો'}>
                <X className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>

            <form onSubmit={createAssignment} className="space-y-4">
              <div>
                <label htmlFor="asg-student" className="text-sm font-semibold block mb-1">{isEn ? 'Student' : 'વિદ્યાર્થી'}</label>
                <select id="asg-student" value={assignmentTarget} onChange={(e) => setAssignmentTarget(e.target.value)} className={inputClass}>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>{studentName(s)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="asg-subject" className="text-sm font-semibold block mb-1">{isEn ? 'Subject' : 'વિષય'}</label>
                <select
                  id="asg-subject"
                  value={subjectKey}
                  onChange={(e) => {
                    setSubjectKey(e.target.value);
                    setTopicId(SUBJECTS[e.target.value].topics[0].id);
                  }}
                  className={inputClass}
                >
                  {Object.entries(SUBJECTS).map(([key, sub]) => (
                    <option key={key} value={key}>{isEn ? sub.en : sub.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="asg-topic" className="text-sm font-semibold block mb-1">{isEn ? 'Topic' : 'મુદ્દો'}</label>
                <select id="asg-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputClass}>
                  {SUBJECTS[subjectKey].topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold mb-1">{isEn ? 'Number of exercises' : 'કુલ પ્રશ્નો'}</legend>
                <div className="flex gap-2">
                  {COUNTS.map(n => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={questionCount === n}
                      onClick={() => setQuestionCount(n)}
                      className={`flex-1 min-h-tap rounded-xl text-base border transition ${
                        questionCount === n ? 'bg-ink border-ink text-white font-bold' : 'bg-surface border-line font-medium'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="asg-note" className="text-sm font-semibold block mb-1">
                  {isEn ? 'Note (optional)' : 'નોંધ (વૈકલ્પિક)'}
                </label>
                <input
                  id="asg-note"
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="asg-due" className="text-sm font-semibold block mb-1">{isEn ? 'Due date' : 'પૂર્ણ કરવાની મુદત'}</label>
                <input id="asg-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="min-h-[52px]">
                  {isEn ? 'Cancel' : 'રદ કરો'}
                </Button>
                <Button type="submit" className="flex-1 min-h-[52px] text-base">
                  {isEn ? 'Assign' : 'ફાળવો'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student report drawer */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="student-report-title">
          <div className="bg-surface w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl border border-line p-4 sm:p-5 max-h-[94vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="student-report-title" className="text-lg font-bold">{studentName(viewing)}</h2>
              <IconButton onClick={() => setViewing(null)} label={isEn ? 'Close' : 'બંધ કરો'}>
                <X className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>
            <StudentReportView
              student={progressById[viewing.student_id] || { totalStars: viewing.stars, currentStreak: viewing.streak }}
              profile={{ display_name: studentName(viewing) }}
              isEn={isEn}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};
