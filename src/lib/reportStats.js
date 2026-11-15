// One pure module that turns the saved activity state into every number the
// student report shows. Nothing here reads React state, storage or the network,
// so the same numbers can be produced for the student, a linked parent and a
// teacher, and unit tested directly.
//
// Sources (all written when the student actually does something):
//   student.attemptLog          every graded exercise attempt (quizzes, practice, writing)
//   student.writingAttempts     handwriting pad attempts, with the letter written
//   student.lessonClips         which lesson videos have been watched
//   student.activityDates       local YYYY-MM-DD days with recorded activity (streak)
//   student.totalStars          stars awarded for correct work
//   student.sessionSecondsByDate active time per local day ("this week" time)

import { gujaratiNumbers } from '../data/gujaratiNumbers';
import { LESSON_CLIP_ITEMS, isClipItemComplete } from '../data/lessonClips';
import { mathLessons } from '../data/mathLessons';
import { scienceLessons } from '../data/scienceLessons';
import { calculateStreak, getLocalDateString } from './dateUtils';

// Skill bands. One place to change them; the UI only renders the key.
//   not-started    — no attempts yet (never shown as 0%)
//   mastered       — at least 85% correct over at least 5 attempts
//   needs-practice — below 70% correct
//   in-progress    — everything else
export const STATUS_THRESHOLDS = {
  masteredMinAccuracy: 85,
  masteredMinAttempts: 5,
  needsPracticeBelow: 70
};

export const STATUS_LABELS = {
  'not-started': { en: 'Not started', gu: 'શરૂ નથી કર્યું' },
  mastered: { en: 'Mastered', gu: 'નિપુણ' },
  'in-progress': { en: 'In progress', gu: 'પ્રગતિમાં' },
  'needs-practice': { en: 'Needs practice', gu: 'મહાવરો જરૂરી' }
};

export const SUBJECT_ORDER = ['gujarati', 'math', 'science'];

const subjectNames = {
  gujarati: { name: 'ગુજરાતી', nameEn: 'Gujarati' },
  math: { name: 'ગણિત', nameEn: 'Maths' },
  science: { name: 'વિજ્ઞાન', nameEn: 'Science' }
};

const percent = (correct, attempted) =>
  attempted > 0 ? Math.round((100 * correct) / attempted) : null;

export const statusFor = ({ attempted = 0, correct = 0 }) => {
  if (attempted <= 0) return 'not-started';
  const accuracy = percent(correct, attempted);
  if (accuracy >= STATUS_THRESHOLDS.masteredMinAccuracy && attempted >= STATUS_THRESHOLDS.masteredMinAttempts) {
    return 'mastered';
  }
  if (accuracy < STATUS_THRESHOLDS.needsPracticeBelow) return 'needs-practice';
  return 'in-progress';
};

// Tracked lesson totals per subject:
//   gujarati — every letter and number that has lesson videos
//   maths    — the four operations practised in the practice tab
//   science  — the science lessons, each with a quiz
const gujaratiLessonItems = LESSON_CLIP_ITEMS.filter(i => i.kind === 'letter' || i.kind === 'number');

const attemptsFor = (attemptedLog, subject, exerciseType) =>
  attemptedLog.filter(a => a.subject === subject && (!exerciseType || a.exerciseType === exerciseType));

const tally = (items) => ({
  attempted: items.length,
  correct: items.filter(a => a.correct).length
});

const topicFrom = (id, name, nameEn, entries) => {
  const { attempted, correct } = tally(entries);
  return {
    id,
    name,
    nameEn,
    attempted,
    correct,
    accuracy: percent(correct, attempted),
    status: statusFor({ attempted, correct })
  };
};

// Minutes of tracked active time in the last 7 local days (today included).
export const weeklyMinutes = (sessionSecondsByDate = {}, now = new Date()) => {
  let seconds = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    seconds += Number(sessionSecondsByDate?.[getLocalDateString(day)]) || 0;
  }
  return Math.round(seconds / 60);
};

// options.days (null = all time) limits the attempt-based figures — subject
// accuracy, topic rows and recent activity — to that window. Lesson progress,
// stars and streak are always shown for all time / right now.
export const computeReportStats = (student = {}, profile = {}, now = new Date(), options = {}) => {
  const { days = null } = options;
  const sinceMs = days ? now.getTime() - days * 24 * 60 * 60 * 1000 : null;
  const inRange = (item) => !sinceMs || (item?.at && new Date(item.at).getTime() >= sinceMs);

  const allAttempts = Array.isArray(student.attemptLog) ? student.attemptLog : [];
  const attemptLog = allAttempts.filter(inRange);
  const writingAttempts = (Array.isArray(student.writingAttempts) ? student.writingAttempts : []).filter(inRange);
  const lessonClips = student.lessonClips || {};

  // ── Gujarati topics: writing attempts split into letters and numbers ──────
  const numberCharacters = new Set(gujaratiNumbers.map(n => n.number));
  const gujaratiWriting = writingAttempts.filter(a => a.subject === 'gujarati');
  const asCorrect = a => ({ correct: Boolean(a.passed), exerciseType: 'writing' });

  // ── Lesson completion per subject ────────────────────────────────────────
  const gujaratiCompleted = gujaratiLessonItems.filter(i => isClipItemComplete(i, lessonClips[i.key])).length;
  const mathAttemptedTypes = new Set(allAttempts.filter(a => a.subject === 'math' && a.exerciseType).map(a => a.exerciseType));
  const scienceAttemptedTypes = new Set(allAttempts.filter(a => a.subject === 'science' && a.exerciseType).map(a => a.exerciseType));

  const lessons = {
    gujarati: { completed: gujaratiCompleted, total: gujaratiLessonItems.length },
    math: {
      completed: mathLessons.operations.filter(op => mathAttemptedTypes.has(op.id)).length,
      total: mathLessons.operations.length
    },
    science: {
      completed: scienceLessons.filter(l => scienceAttemptedTypes.has(l.id)).length,
      total: scienceLessons.length
    }
  };

  const topicsFor = {
    gujarati: [
      topicFrom(
        'letter-writing',
        'અક્ષર લેખન',
        'Letter writing',
        gujaratiWriting.filter(a => !numberCharacters.has(a.character)).map(asCorrect)
      ),
      topicFrom(
        'number-writing',
        'અંક લેખન',
        'Number writing',
        gujaratiWriting.filter(a => numberCharacters.has(a.character)).map(asCorrect)
      )
    ],
    math: mathLessons.operations.map(op =>
      topicFrom(op.id, op.title, op.title, attemptsFor(attemptLog, 'math', op.id))
    ),
    science: scienceLessons.map(l =>
      topicFrom(l.id, l.title, l.title, attemptsFor(attemptLog, 'science', l.id))
    )
  };

  const subjects = SUBJECT_ORDER.map(key => {
    const subjectAttempts = attemptLog.filter(a => a.subject === key);
    const { attempted, correct } = tally(subjectAttempts);
    const lesson = lessons[key];
    return {
      key,
      ...subjectNames[key],
      attempted,
      correct,
      accuracy: percent(correct, attempted),
      lessonsCompleted: lesson.completed,
      lessonsTotal: lesson.total,
      // A subject's progress is the share of its lessons that are complete.
      progress: lesson.total > 0 ? Math.round((100 * lesson.completed) / lesson.total) : 0,
      topics: topicsFor[key]
    };
  });

  // Overall progress is the lesson-weighted average of subject progress, so a
  // subject with more lessons (Gujarati letters + numbers) counts for more
  // than one with four lessons. With no lessons at all it is 0, never a default.
  const totalLessons = subjects.reduce((sum, s) => sum + s.lessonsTotal, 0);
  const overallProgress = totalLessons > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.progress * s.lessonsTotal, 0) / totalLessons)
    : 0;

  const clipsComplete = gujaratiLessonItems.filter(i => isClipItemComplete(i, lessonClips[i.key])).length;
  // Whether the student has ever done anything (drives the empty state)
  const hasActivity = allAttempts.length > 0
    || (Array.isArray(student.writingAttempts) && student.writingAttempts.length > 0)
    || clipsComplete > 0;

  // Weakest practised topics, for the "needs attention" strip.
  const needsAttention = subjects
    .flatMap(s => s.topics
      .filter(t => t.attempted > 0 && t.status !== 'mastered')
      .map(t => ({ ...t, subjectKey: s.key })))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  const recentActivity = [...attemptLog]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      subjectKey: a.subject,
      topic: a.topic || '',
      correct: Boolean(a.correct),
      at: a.at
    }));

  // Profile is the only honest source for a name / grade / school.
  const studentName = profile?.display_name || profile?.full_name || student.name || '';

  return {
    studentName,
    grade: profile?.grade || '',
    school: profile?.school || '',
    hasActivity,
    stars: Number(student.totalStars) || 0,
    streakDays: calculateStreak(Array.isArray(student.activityDates) ? student.activityDates : [], now),
    weeklyMinutes: weeklyMinutes(student.sessionSecondsByDate, now),
    overallProgress,
    totalLessonsCompleted: subjects.reduce((sum, s) => sum + s.lessonsCompleted, 0),
    totalLessons,
    subjects,
    needsAttention,
    recentActivity
  };
};
