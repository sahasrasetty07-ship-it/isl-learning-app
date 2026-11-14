import { useState } from 'react';
import { useApp, DEFAULT_WRITING_THRESHOLD } from '../../context/AppContext';
import { WritingAttemptsPanel } from '../common/WritingAttemptsPanel';
import { LessonVideoProgress } from '../common/LessonVideoProgress';
import { summariseWriting } from '../../utils/writingFeedback';
import { mathLessons } from '../../data/mathLessons';
import { scienceLessons } from '../../data/scienceLessons';
import { Card, CardTitle, Button, IconButton, PageHeader, ProgressBar, SUBJECT_STYLES } from '../ui';
import {
  PlusCircle,
  Search,
  Eye,
  X,
  RotateCcw,
  LayoutDashboard,
  Users,
  Presentation,
  ClipboardList,
  PenLine,
  Clapperboard,
  ChevronRight
} from 'lucide-react';

// Side menu: in-page links, no extra state
const SECTIONS = [
  { id: 't-overview', icon: LayoutDashboard, en: 'Overview', gu: 'ઝાંખી' },
  { id: 't-students', icon: Users, en: 'Students', gu: 'વિદ્યાર્થીઓ' },
  { id: 't-teach', icon: Presentation, en: 'Teach in class', gu: 'વર્ગમાં ભણાવો' },
  { id: 't-practice', icon: ClipboardList, en: 'Assigned practice', gu: 'આપેલ મહાવરો' },
  { id: 't-writing', icon: PenLine, en: 'Handwriting', gu: 'લેખન' },
  { id: 't-videos', icon: Clapperboard, en: 'Lesson videos', gu: 'પાઠ વિડીયો' }
];

// What a teacher can assign: subject -> topics (exerciseType ids understood by the student modules)
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

export const TeacherDashboard = () => {
  const {
    studentsList, student, showToast, uiLanguage, addAssignment,
    setCurrentRole, setIsMobileFrame, setActiveTab,
    writingThreshold, setWritingThreshold
  } = useApp();
  const liveStudentId = student.id;
  const writingSummary = summariseWriting(student.writingAttempts, student.writingStars);
  const assignments = student.pendingAssignments.filter(a => a.count > 0);
  const completedCount = assignments.filter(a => a.status === 'પૂર્ણ').length;
  const isEn = uiLanguage === 'en';

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [subjectKey, setSubjectKey] = useState('math');
  const [topicId, setTopicId] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState('Nov 15, 2026');

  const openAssignModal = (focus = { subjectKey: 'math', exerciseType: 'mixed' }) => {
    setSubjectKey(focus.subjectKey);
    setTopicId(focus.exerciseType);
    setAssignmentTitle('');
    setShowCreateModal(true);
  };

  const assignAgain = (asg) => {
    const { id, done, correct, status, ...rest } = asg;
    addAssignment(rest);
    showToast(isEn ? `Assigned again: ${asg.title}` : `ફરીથી ફાળવ્યું: ${asg.title}`);
  };

  // Opens the student lesson screens full-width so the teacher can teach from them in class
  const teachInClass = (tab) => {
    setCurrentRole('student');
    setIsMobileFrame(false);
    setActiveTab(tab);
  };

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNo.includes(searchTerm)
  );

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const topic = SUBJECTS[subjectKey].topics.find(t => t.id === topicId);
    const title = assignmentTitle.trim()
      || `${topic.title} – ${questionCount} ${isEn ? 'questions' : 'પ્રશ્નો'}`;

    addAssignment({
      title,
      subject: SUBJECTS[subjectKey].label,
      subjectKey,
      exerciseType: topicId,
      count: questionCount,
      dueDate,
      teacher: isEn ? 'Class Teacher' : 'વર્ગ શિક્ષક'
    });

    showToast(isEn 
      ? `Assignment "${title}" assigned to all students!` 
      : `નવું સ્વાધ્યાય "${title}" સમગ્ર વર્ગને સફળતાપૂર્વક ફાળવવામાં આવ્યું!`);
    setShowCreateModal(false);
    setAssignmentTitle('');
  };

  // Display only: lowest progress first so students who need help are at the top
  const sortedStudents = [...filteredStudents].sort((a, b) => a.progress - b.progress);
  const classAverage = studentsList.length
    ? Math.round(studentsList.reduce((sum, s) => sum + s.progress, 0) / studentsList.length)
    : 0;

  const inputClass = 'w-full min-h-tap px-3 text-base rounded-xl border border-line bg-surface focus:outline-none focus:border-action focus:ring-2 focus:ring-action/30';

  return (
    <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      {/* Side menu (top scroller on small screens) */}
      <nav aria-label={isEn ? 'Teacher menu' : 'શિક્ષક મેનુ'} className="mb-5 lg:mb-0">
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
            title={isEn ? 'Mrs. Nitaben Joshi' : 'શ્રીમતી નીતાબેન જોશી'}
            subtitle={isEn
              ? 'Grade 4 - Special Needs Classroom (5 Enrolled Students)'
              : 'ધોરણ ૪ - પ્રજ્ઞાચક્ષુ અને મૂકબધિર વિશેષ વર્ગ (૫ વિદ્યાર્થીઓ)'}
            actions={
              <Button onClick={() => openAssignModal()}>
                <PlusCircle className="w-5 h-5" aria-hidden="true" />
                {isEn ? 'Assign new work' : 'નવું સ્વાધ્યાય આપો'}
              </Button>
            }
          />

          {/* Three headline numbers */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface border border-line rounded-2xl p-4">
              <dt className="text-sm text-ink-muted">{isEn ? 'Class average progress' : 'વર્ગ સરેરાશ પ્રગતિ'}</dt>
              <dd className="font-heading text-4xl font-bold tabular-nums">{classAverage}%</dd>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4">
              <dt className="text-sm text-ink-muted">{isEn ? 'Students in class' : 'વર્ગના વિદ્યાર્થીઓ'}</dt>
              <dd className="font-heading text-4xl font-bold tabular-nums">{studentsList.length}</dd>
            </div>
            <div className="bg-surface border border-line rounded-2xl p-4">
              <dt className="text-sm text-ink-muted">{isEn ? 'Practice sets completed' : 'પૂર્ણ થયેલ સ્વાધ્યાય'}</dt>
              <dd className="font-heading text-4xl font-bold tabular-nums">{completedCount} / {assignments.length}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          {/* Class Students Roster */}
          <Card id="t-students" className="scroll-mt-24 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <CardTitle
                title={isEn ? 'Students' : 'વર્ગના વિદ્યાર્થીઓ અને પ્રગતિ'}
                subtitle={isEn ? 'Lowest progress first' : 'ઓછી પ્રગતિ વાળા પહેલા'}
              />
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input
                  type="search"
                  aria-label={isEn ? 'Search student' : 'વિદ્યાર્થી શોધો'}
                  placeholder={isEn ? "Search student..." : "વિદ્યાર્થી શોધો..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 min-h-tap pl-9 pr-3 text-sm rounded-xl border border-line bg-surface focus:outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                />
              </div>
            </div>

            {/* Scrolls sideways on a phone */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Roll No.' : 'રોલ નં.'}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Student Name' : 'નામ'}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Progress' : 'પ્રગતિ'}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Accuracy' : 'ચોકસાઈ'}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Writing' : 'લેખન'}</th>
                    <th scope="col" className="hidden 2xl:table-cell py-2 pr-3 font-semibold">{isEn ? 'Key Strength' : 'મજબૂત મુદ્દો'}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{isEn ? 'Needs Practice' : 'સુધારણા ક્ષેત્ર'}</th>
                    <th scope="col" className="py-2 text-right font-semibold"><span className="sr-only">{isEn ? 'Action' : 'ક્રિયા'}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sortedStudents.map(student => (
                    <tr key={student.id}>
                      <td className="py-3 pr-3 tabular-nums text-ink-muted">{student.rollNo}</td>
                      <th scope="row" className="py-3 pr-3 font-bold">{student.name}</th>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2.5 bg-line rounded-full overflow-hidden">
                            <div className="h-full bg-action rounded-full" style={{ width: `${student.progress}%` }} />
                          </div>
                          <span className="font-bold tabular-nums">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{student.accuracy}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {student.id === liveStudentId && writingSummary.total > 0 ? (
                          <span className="font-bold">
                            {writingSummary.passRate}% <span className="font-medium text-ink-muted">· {writingSummary.passed}/{writingSummary.total}</span>
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      {/* Also shown in the Details window, so it can hide on narrower screens */}
                      <td className="hidden 2xl:table-cell py-3 pr-3 text-ink-muted">{student.strongTopic}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-1 rounded-lg bg-action-soft font-medium">{student.weakTopic}</span>
                          {student.focus && (
                            <IconButton
                              onClick={() => openAssignModal(student.focus)}
                              label={isEn ? 'Assign practice for this topic' : 'આ વિષયનો મહાવરો આપો'}
                            >
                              <PlusCircle className="w-5 h-5 text-action" aria-hidden="true" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <IconButton
                          onClick={() => setSelectedStudentForDetail(student)}
                          label={isEn ? `Details for ${student.name}` : `${student.name} ની વિગત`}
                        >
                          <Eye className="w-5 h-5" aria-hidden="true" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            {/* Teach in class: open lesson screens full-width */}
            <Card id="t-teach" className="scroll-mt-24 space-y-3">
              <CardTitle
                title={isEn ? 'Teach in class' : 'વર્ગમાં ભણાવો'}
                subtitle={isEn ? 'Open a lesson full-screen to teach with signs, visuals and examples.' : 'સંકેતો અને ચિત્રો સાથે ભણાવવા પાઠ મોટી સ્ક્રીન પર ખોલો.'}
              />
              <ul className="space-y-2">
                {[
                  { tab: 'gujarati', en: 'Gujarati letters & numbers', gu: 'ગુજરાતી અક્ષરો અને સંખ્યા' },
                  { tab: 'math', en: 'Maths: tables & operations', gu: 'ગણિત: ઘડિયા અને ક્રિયાઓ' },
                  { tab: 'science', en: 'Science lessons', gu: 'વિજ્ઞાનના પાઠ' }
                ].map(l => {
                  const st = SUBJECT_STYLES[l.tab];
                  return (
                    <li key={l.tab}>
                      <button
                        type="button"
                        onClick={() => teachInClass(l.tab)}
                        className="w-full flex items-center gap-3 min-h-[56px] p-2 rounded-xl border border-line hover:bg-canvas text-left transition"
                      >
                        <span className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${st.soft} ${st.text}`}>
                          <st.icon className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="flex-1 text-sm font-semibold">{isEn ? l.en : l.gu}</span>
                        <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Assigned practice sets and their progress */}
            <Card id="t-practice" className="scroll-mt-24 space-y-3">
              <CardTitle
                title={isEn ? 'Assigned practice' : 'આપેલ મહાવરો'}
                subtitle={isEn
                  ? 'Live progress of Aarav Patel (demo student). Assign a set again to repeat the practice.'
                  : 'આરવ પટેલ (ડેમો વિદ્યાર્થી)ની પ્રગતિ. મહાવરો ફરી કરાવવા ફરીથી ફાળવો.'}
              />
              {assignments.length === 0 && (
                <p className="text-sm text-ink-muted">{isEn ? 'No practice assigned yet.' : 'હજુ કોઈ મહાવરો આપ્યો નથી.'}</p>
              )}
              <ul className="space-y-2">
                {assignments.map(asg => {
                  const finished = asg.status === 'પૂર્ણ';
                  return (
                    <li key={asg.id} className="p-3 rounded-xl bg-canvas border border-line space-y-2">
                      <div>
                        <p className="text-sm font-bold">{asg.title}</p>
                        <p className="text-sm text-ink-muted">
                          {isEn ? SUBJECTS[asg.subjectKey]?.en : asg.subject} · {isEn ? 'Due' : 'મુદત'} {asg.dueDate}
                        </p>
                      </div>
                      <ProgressBar
                        value={(100 * asg.done) / asg.count}
                        color={finished ? 'bg-success' : 'bg-action'}
                        label={finished ? (isEn ? 'Finished' : 'પૂર્ણ') : null}
                        valueText={`${asg.done}/${asg.count} · ${isEn ? `${asg.correct} correct` : `${asg.correct} સાચા`}`}
                      />
                      <Button variant="secondary" onClick={() => assignAgain(asg)} className="w-full">
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        {isEn ? 'Assign again' : 'ફરી ફાળવો'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>

        {/* Handwriting check: pass mark setting + live attempt history */}
        <div id="t-writing" className="scroll-mt-24 space-y-6">
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <CardTitle
                title={isEn ? 'Handwriting check strictness' : 'લેખન ચકાસણીની કડકાઈ'}
                subtitle={isEn
                  ? 'Pass mark for the writing pad. A stroke match score at or above this passes and earns stars. Raise it for stricter checking, lower it for younger learners.'
                  : 'લેખન પેડ માટે પાસ ગુણ. આટલા કે વધુ ગુણ આવે તો પાસ અને તારા મળે. કડક ચકાસણી માટે વધારો, નાના બાળકો માટે ઘટાડો.'}
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
            <div className="flex items-center justify-between gap-2 text-sm text-ink-muted -mt-1">
              <span>{isEn ? '60 · More lenient' : '૬૦ · સરળ'}</span>
              {writingThreshold !== DEFAULT_WRITING_THRESHOLD && (
                <Button variant="ghost" onClick={() => setWritingThreshold(DEFAULT_WRITING_THRESHOLD)}>
                  {isEn ? `Reset to ${DEFAULT_WRITING_THRESHOLD}` : `${DEFAULT_WRITING_THRESHOLD} પર પાછું`}
                </Button>
              )}
              <span>{isEn ? 'Stricter · 100' : 'કડક · ૧૦૦'}</span>
            </div>
          </Card>

          <WritingAttemptsPanel
            subtitle={isEn
              ? 'Live writing-pad attempts of Aarav Patel (demo student): score, problem found, attempt number and time.'
              : 'આરવ પટેલ (ડેમો વિદ્યાર્થી)ના લેખન પ્રયત્નો: ગુણ, ભૂલ, પ્રયત્ન ક્રમ અને સમય.'}
          />
        </div>

        <div id="t-videos" className="scroll-mt-24">
          <LessonVideoProgress
            subtitle={isEn
              ? 'Aarav Patel (demo student): lessons whose sign, how-to-write and how-to-say videos have all been watched.'
              : 'આરવ પટેલ (ડેમો વિદ્યાર્થી): જે પાઠના સાઇન, લખવાના અને બોલવાના બધા વિડીયો જોવાયા છે.'}
          />
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="assign-title">
          <div className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-line p-5 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 id="assign-title" className="text-xl font-bold">
                {isEn ? 'Assign practice' : 'નવું સ્વાધ્યાય આપો'}
              </h2>
              <IconButton onClick={() => setShowCreateModal(false)} label={isEn ? 'Close' : 'બંધ કરો'}>
                <X className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label htmlFor="asg-subject" className="text-sm font-semibold block mb-1">
                  {isEn ? 'Subject' : 'વિષય'}
                </label>
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
                <label htmlFor="asg-topic" className="text-sm font-semibold block mb-1">
                  {isEn ? 'Topic' : 'મુદ્દો'}
                </label>
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
                        questionCount === n ? 'bg-ink border-ink text-white font-bold' : 'bg-surface border-line font-medium hover:bg-canvas'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="asg-note" className="text-sm font-semibold block mb-1">
                  {isEn ? 'Note for students (optional)' : 'વિદ્યાર્થીઓ માટે નોંધ (વૈકલ્પિક)'}
                </label>
                <input
                  id="asg-note"
                  type="text"
                  placeholder={isEn ? 'Leave empty to use the topic name' : 'ખાલી રાખો તો મુદ્દાનું નામ વપરાશે'}
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="asg-due" className="text-sm font-semibold block mb-1">
                  {isEn ? 'Due date' : 'પૂર્ણ કરવાની મુદત'}
                </label>
                <input id="asg-due" type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="min-h-[52px]">
                  {isEn ? 'Cancel' : 'રદ કરો'}
                </Button>
                <Button type="submit" className="flex-1 min-h-[52px] text-base">
                  {isEn ? 'Assign to class' : 'સ્વાધ્યાય ફાળવો'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
          <div className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-line p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="student-detail-title" className="text-xl font-bold">{selectedStudentForDetail.name}</h2>
                <p className="text-sm text-ink-muted">{isEn ? 'Roll Number:' : 'રોલ નંબર:'} {selectedStudentForDetail.rollNo}</p>
              </div>
              <IconButton onClick={() => setSelectedStudentForDetail(null)} label={isEn ? 'Close' : 'બંધ કરો'}>
                <X className="w-5 h-5" aria-hidden="true" />
              </IconButton>
            </div>

            <dl className="divide-y divide-line rounded-xl border border-line">
              {[
                [isEn ? 'Attendance Rate' : 'હાજરી દર', selectedStudentForDetail.attendance],
                [isEn ? 'Accuracy Rate' : 'ચોકસાઈ દર', selectedStudentForDetail.accuracy],
                [isEn ? 'Strongest Topic' : 'સૌથી મજબૂત મુદ્દો', selectedStudentForDetail.strongTopic],
                [isEn ? 'Needs Focus' : 'ધ્યાન આપવા જેવો મુદ્દો', selectedStudentForDetail.weakTopic]
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 p-3 text-sm">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-bold text-right">{v}</dd>
                </div>
              ))}
            </dl>

            <Button onClick={() => setSelectedStudentForDetail(null)} className="w-full min-h-[52px] text-base">
              {isEn ? 'Close' : 'બંધ કરો'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
