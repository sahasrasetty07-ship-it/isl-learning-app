import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabase';
import { linkStudent, linkErrorMessage, LINK_ERROR_MESSAGES } from './linking';
import { mergeProgress, toProgressRow, fromProgressRow } from './progress';

vi.mock('./supabase', () => {
  const rpc = vi.fn();
  return {
    isSupabaseConfigured: true,
    supabase: { rpc, from: vi.fn() }
  };
});

describe('linkStudent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a malformed code before calling the database', async () => {
    const result = await linkStudent('AB');
    expect(result).toEqual({ ok: false, error: 'invalid_code' });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('rejects ambiguous characters without a round trip', async () => {
    const result = await linkStudent('AB0DEF');
    expect(result.error).toBe('invalid_code');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('normalizes the code before sending it', async () => {
    supabase.rpc.mockResolvedValue({ data: { ok: true, student_id: 's1', display_name: 'Meera', already_linked: false }, error: null });
    await linkStudent(' 34b- sd5 ');
    expect(supabase.rpc).toHaveBeenCalledWith('link_student', { p_code: '34BSD5' });
  });

  it('maps each backend error to a friendly message', async () => {
    for (const error of ['invalid_code', 'rate_limited', 'not_allowed', 'not_authenticated']) {
      supabase.rpc.mockResolvedValue({ data: { ok: false, error }, error: null });
      const result = await linkStudent('34BSD5');
      expect(result).toEqual({ ok: false, error });
      expect(linkErrorMessage(error, true)).toBe(LINK_ERROR_MESSAGES[error].en);
      expect(linkErrorMessage(error, false)).toBe(LINK_ERROR_MESSAGES[error].gu);
    }
  });

  it('reports already-linked students as success with a flag', async () => {
    supabase.rpc.mockResolvedValue({
      data: { ok: true, student_id: 's1', display_name: 'Meera', already_linked: true },
      error: null
    });
    const result = await linkStudent('34BSD5');
    expect(result.ok).toBe(true);
    expect(result.alreadyLinked).toBe(true);
  });

  it('detects a missing backend instead of showing a generic error', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
    const result = await linkStudent('34BSD5');
    expect(result.error).toBe('missing_backend');
  });
});

describe('progress mapping', () => {
  const student = {
    totalStars: 12,
    currentStreak: 2,
    attemptLog: [{ id: 'a1', subject: 'math', correct: true, at: '2026-11-15T09:00:00.000Z' }],
    writingAttempts: [{ id: 'w1', subject: 'gujarati', character: 'ક', passed: true }],
    lessonClips: { 'letter:ka': { sign: true } },
    activityDates: ['2026-11-15'],
    sessionSecondsByDate: { '2026-11-15': 120 },
    subjects: { gujarati: { name: 'ગુજરાતી' } }
  };

  it('round-trips through a database row', () => {
    const row = toProgressRow(student);
    expect(row.total_stars).toBe(12);
    expect(row.attempts).toHaveLength(1);
    const back = fromProgressRow({ ...row, student_id: 's1', updated_at: '2026-11-15T09:05:00.000Z' });
    expect(back.totalStars).toBe(12);
    expect(back.attemptLog[0].id).toBe('a1');
    expect(back.writingAttempts[0].character).toBe('ક');
    expect(back.lessonClips['letter:ka'].sign).toBe(true);
  });

  it('never lowers stars and unions attempts by id', () => {
    const remote = {
      totalStars: 20,
      currentStreak: 1,
      attemptLog: [
        { id: 'a1', subject: 'math', correct: true, at: '2026-11-15T09:00:00.000Z' },
        { id: 'a2', subject: 'science', correct: false, at: '2026-11-15T09:30:00.000Z' }
      ],
      activityDates: ['2026-11-14']
    };
    const merged = mergeProgress(student, remote);
    expect(merged.totalStars).toBe(20);
    expect(merged.attemptLog.map(a => a.id).sort()).toEqual(['a1', 'a2']);
    expect(merged.activityDates).toEqual(['2026-11-14', '2026-11-15']);
    // local wins when it has more data
    expect(mergeProgress({ ...student, totalStars: 30 }, remote).totalStars).toBe(30);
  });
});
