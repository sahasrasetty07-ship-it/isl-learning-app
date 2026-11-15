// Progress persistence: Supabase `student_progress` with localStorage as an
// offline cache. Students write their own row (debounced); parents and teachers
// only read the rows of students they are linked to.
import { supabase, isSupabaseConfigured } from './supabase';
import { isMissingBackendError } from './backendErrors';

const LOCAL_KEY = 'gsl-student-v2';
const MIGRATED_KEY = 'gsl-student-migrated-v1';
export const SAVE_DEBOUNCE_MS = 2000;
export const POLL_MS = 30000;

// ── Shape conversion ────────────────────────────────────────────────────────
// The database stores attempts in their own column and the rest of the
// activity in subject_stats, so the report can be produced from either side.
export const toProgressRow = (student = {}, now = new Date()) => ({
  total_stars: Number(student.totalStars) || 0,
  current_streak: Number(student.currentStreak) || 0,
  attempts: Array.isArray(student.attemptLog) ? student.attemptLog : [],
  subject_stats: {
    writingAttempts: student.writingAttempts || [],
    writingStars: student.writingStars || {},
    lessonClips: student.lessonClips || {},
    activityDates: student.activityDates || [],
    sessionSecondsByDate: student.sessionSecondsByDate || {},
    subjects: student.subjects || {}
  },
  updated_at: now.toISOString()
});

// A row from student_progress -> the object reportStats expects.
export const fromProgressRow = (row) => {
  const stats = row?.subject_stats || {};
  return {
    name: '',
    totalStars: Number(row?.total_stars) || 0,
    currentStreak: Number(row?.current_streak) || 0,
    attemptLog: Array.isArray(row?.attempts) ? row.attempts : [],
    writingAttempts: stats.writingAttempts || [],
    writingStars: stats.writingStars || {},
    lessonClips: stats.lessonClips || {},
    activityDates: stats.activityDates || [],
    sessionSecondsByDate: stats.sessionSecondsByDate || {},
    subjects: stats.subjects || {},
    updatedAt: row?.updated_at || null
  };
};

// Merge remote into local without ever losing work: stars keep the maximum,
// attempts are unioned by id, activity dates are unioned.
export const mergeProgress = (local = {}, remote = {}) => {
  const localAttempts = Array.isArray(local.attemptLog) ? local.attemptLog : [];
  const remoteAttempts = Array.isArray(remote.attemptLog) ? remote.attemptLog : [];
  const seen = new Set(localAttempts.map(a => a.id));
  const mergedAttempts = [...localAttempts, ...remoteAttempts.filter(a => !seen.has(a.id))]
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const union = (a = [], b = []) => Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));

  return {
    ...local,
    totalStars: Math.max(Number(local.totalStars) || 0, Number(remote.totalStars) || 0),
    currentStreak: Math.max(Number(local.currentStreak) || 0, Number(remote.currentStreak) || 0),
    attemptLog: mergedAttempts,
    activityDates: union(local.activityDates, remote.activityDates).sort(),
    writingAttempts: Array.isArray(local.writingAttempts) && local.writingAttempts.length
      ? local.writingAttempts
      : remote.writingAttempts || [],
    lessonClips: { ...(remote.lessonClips || {}), ...(local.lessonClips || {}) },
    sessionSecondsByDate: Object.entries(remote.sessionSecondsByDate || {}).reduce(
      (acc, [day, seconds]) => {
        acc[day] = Math.max(Number(seconds) || 0, Number(local.sessionSecondsByDate?.[day]) || 0);
        return acc;
      },
      { ...(local.sessionSecondsByDate || {}) }
    )
  };
};

// ── Supabase calls ──────────────────────────────────────────────────────────
export const loadProgress = async (studentId) => {
  if (!isSupabaseConfigured || !studentId) return { data: null, error: null };
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    if (isMissingBackendError(error)) return { data: null, error, missingBackend: true };
    return { data: null, error };
  }
  return { data: data ? fromProgressRow(data) : null, error: null };
};

export const saveProgress = async (studentId, student) => {
  if (!isSupabaseConfigured || !studentId) return { ok: false, error: null };
  const { error } = await supabase
    .from('student_progress')
    .upsert({ student_id: studentId, ...toProgressRow(student) }, { onConflict: 'student_id' });

  if (error) {
    if (isMissingBackendError(error)) return { ok: false, error, missingBackend: true };
    return { ok: false, error };
  }
  return { ok: true };
};

// ── One-time migration of the old localStorage save ─────────────────────────
export const migrateLocalStorage = async (studentId) => {
  if (!isSupabaseConfigured || !studentId) return { migrated: false };
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return { migrated: false };
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
      return { migrated: false };
    }
    const student = JSON.parse(raw);
    const result = await saveProgress(studentId, student);
    if (result.ok) localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
    return { migrated: result.ok };
  } catch {
    return { migrated: false };
  }
};

// Debounced writer used by the student app. Returns a `flush()` so a caller can
// force a write (used on pagehide).
export const createProgressSaver = (studentId, delay = SAVE_DEBOUNCE_MS) => {
  let timer = null;
  let pending = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!pending || !studentId) return Promise.resolve();
    const snapshot = pending;
    pending = null;
    return saveProgress(studentId, snapshot);
  };

  const queue = (student) => {
    pending = student;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      flush();
    }, delay);
  };

  return { queue, flush };
};
