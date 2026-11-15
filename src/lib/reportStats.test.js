import { describe, it, expect } from 'vitest';
import { computeReportStats, statusFor, weeklyMinutes, STATUS_THRESHOLDS } from './reportStats';
import { getLocalDateString } from './dateUtils';

const NOW = new Date('2026-11-15T10:00:00');

const attempt = (subject, exerciseType, correct, at = NOW.toISOString()) => ({
  id: `${subject}-${Math.random()}`,
  subject,
  topic: `${subject} topic`,
  exerciseType,
  correct,
  at
});

const studentWith = (patch = {}) => ({
  attemptLog: [],
  writingAttempts: [],
  lessonClips: {},
  activityDates: [],
  sessionSecondsByDate: {},
  totalStars: 0,
  ...patch
});

describe('statusFor', () => {
  it('never reports accuracy for a topic with no attempts', () => {
    expect(statusFor({ attempted: 0, correct: 0 })).toBe('not-started');
  });

  it('needs both high accuracy and enough attempts to be mastered', () => {
    expect(statusFor({ attempted: 4, correct: 4 })).toBe('in-progress');
    expect(statusFor({ attempted: STATUS_THRESHOLDS.masteredMinAttempts, correct: 5 })).toBe('mastered');
    expect(statusFor({ attempted: 10, correct: 6 })).toBe('needs-practice');
    expect(statusFor({ attempted: 10, correct: 8 })).toBe('in-progress');
  });
});

describe('weeklyMinutes', () => {
  it('adds only the last seven local days', () => {
    const today = getLocalDateString(NOW);
    const eightDaysAgo = getLocalDateString(new Date(2026, 10, 7, 12));
    expect(weeklyMinutes({ [today]: 120, [eightDaysAgo]: 600 }, NOW)).toBe(2);
    expect(weeklyMinutes({}, NOW)).toBe(0);
  });
});

describe('computeReportStats — empty student', () => {
  const stats = computeReportStats(studentWith(), {}, NOW);

  it('has no activity and no invented numbers', () => {
    expect(stats.hasActivity).toBe(false);
    expect(stats.overallProgress).toBe(0);
    expect(stats.stars).toBe(0);
    expect(stats.streakDays).toBe(0);
    expect(stats.weeklyMinutes).toBe(0);
    expect(stats.totalLessonsCompleted).toBe(0);
    expect(stats.needsAttention).toEqual([]);
    expect(stats.recentActivity).toEqual([]);
  });

  it('shows no subject accuracy and every topic as not started', () => {
    stats.subjects.forEach(subject => {
      expect(subject.accuracy).toBeNull();
      expect(subject.attempted).toBe(0);
      subject.topics.forEach(topic => {
        expect(topic.accuracy).toBeNull();
        expect(topic.status).toBe('not-started');
      });
    });
  });

  it('does not divide by zero when there are no lessons', () => {
    const empty = computeReportStats({}, {}, NOW);
    expect(empty.overallProgress).toBe(0);
    expect(Number.isNaN(empty.overallProgress)).toBe(false);
  });

  it('falls back to an empty name rather than a demo name', () => {
    expect(stats.studentName).toBe('');
    expect(computeReportStats(studentWith(), { display_name: 'Meera' }, NOW).studentName).toBe('Meera');
  });
});

describe('computeReportStats — partial activity', () => {
  const stats = computeReportStats(
    studentWith({
      attemptLog: [attempt('math', 'addition', true), attempt('math', 'addition', false)],
      totalStars: 10,
      activityDates: [getLocalDateString(NOW)]
    }),
    {},
    NOW
  );
  const math = stats.subjects.find(s => s.key === 'math');
  const addition = math.topics.find(t => t.id === 'addition');

  it('computes accuracy from attempts', () => {
    expect(math.attempted).toBe(2);
    expect(math.correct).toBe(1);
    expect(math.accuracy).toBe(50);
    expect(addition.accuracy).toBe(50);
    expect(addition.attempted).toBe(2);
  });

  it('counts lessons from practised lesson types only', () => {
    expect(math.lessonsCompleted).toBe(1);
    expect(math.lessonsTotal).toBeGreaterThan(1);
    expect(math.progress).toBe(Math.round((100 * 1) / math.lessonsTotal));
  });

  it('lists the weakest practised topic', () => {
    expect(stats.needsAttention[0]).toMatchObject({ id: 'addition', subjectKey: 'math' });
  });

  it('keeps untouched subjects empty', () => {
    expect(stats.subjects.find(s => s.key === 'science').accuracy).toBeNull();
  });
});

describe('computeReportStats — full activity', () => {
  const attempts = Array.from({ length: 5 }, () => attempt('science', 'solar-system', true));
  const stats = computeReportStats(
    studentWith({ attemptLog: attempts, totalStars: 50, sessionSecondsByDate: { [getLocalDateString(NOW)]: 900 } }),
    {},
    NOW
  );
  const science = stats.subjects.find(s => s.key === 'science');

  it('marks a well-practised topic as mastered', () => {
    expect(science.topics.find(t => t.id === 'solar-system').status).toBe('mastered');
  });

  it('reports tracked time and stars', () => {
    expect(stats.weeklyMinutes).toBe(15);
    expect(stats.stars).toBe(50);
  });

  it('limits the topic figures to the selected range', () => {
    const old = attempt('science', 'solar-system', false, new Date('2026-10-01T10:00:00').toISOString());
    const ranged = computeReportStats(studentWith({ attemptLog: [...attempts, old] }), {}, NOW, { days: 7 });
    expect(ranged.subjects.find(s => s.key === 'science').attempted).toBe(5);
  });
});

describe('computeReportStats — streak', () => {
  it('counts consecutive active days back from today', () => {
    const dates = [0, 1, 2].map(i => getLocalDateString(new Date(2026, 10, 15 - i, 12)));
    const stats = computeReportStats(studentWith({ activityDates: dates }), {}, NOW);
    expect(stats.streakDays).toBe(3);
  });

  it('breaks the streak on a missed day', () => {
    const dates = [0, 2].map(i => getLocalDateString(new Date(2026, 10, 15 - i, 12)));
    const stats = computeReportStats(studentWith({ activityDates: dates }), {}, NOW);
    expect(stats.streakDays).toBe(1);
  });
});

describe('computeReportStats — gujarati topics', () => {
  it('splits writing attempts into letters and numbers', () => {
    const stats = computeReportStats(
      studentWith({
        writingAttempts: [
          { id: 'w1', subject: 'gujarati', character: 'ક', passed: true, at: NOW.toISOString() },
          { id: 'w2', subject: 'gujarati', character: '૧', passed: false, at: NOW.toISOString() }
        ]
      }),
      {},
      NOW
    );
    const gujarati = stats.subjects.find(s => s.key === 'gujarati');
    expect(gujarati.topics.find(t => t.id === 'letter-writing')).toMatchObject({ attempted: 1, correct: 1, accuracy: 100 });
    expect(gujarati.topics.find(t => t.id === 'number-writing')).toMatchObject({ attempted: 1, correct: 0, accuracy: 0 });
  });
});
