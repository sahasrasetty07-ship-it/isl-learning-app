import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReportCard } from './ReportCard';
import * as AppContextModule from '../../context/AppContext';
import * as AuthContextModule from '../../context/AuthContext';

vi.mock('../../context/AppContext', () => ({ useApp: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

const emptyStudent = {
  name: '',
  attemptLog: [],
  writingAttempts: [],
  lessonClips: {},
  activityDates: [],
  sessionSecondsByDate: {},
  totalStars: 0,
  currentStreak: 0,
  recentAttempts: [],
  pendingAssignments: [],
  subjects: { gujarati: { name: 'ગુજરાતી' }, math: { name: 'ગણિત' }, science: { name: 'વિજ્ઞાન' } }
};

const renderReport = (student, profile = { full_name: 'Meera Shah' }) => {
  AppContextModule.useApp.mockReturnValue({
    student,
    profile,
    uiLanguage: 'en',
    setActiveTab: vi.fn(),
    showToast: vi.fn()
  });
  AuthContextModule.useAuth.mockReturnValue({ profile });
  return render(<ReportCard />);
};

describe('ReportCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows an empty state instead of demo numbers for a new student', () => {
    renderReport(emptyStudent);
    expect(screen.getByText('No activity yet')).toBeDefined();
    expect(screen.queryByText('78%')).toBeNull();
    expect(screen.getByText('Start a lesson')).toBeDefined();
  });

  it('shows the signed-in student name and real tracked values', () => {
    const now = new Date().toISOString();
    renderReport({
      ...emptyStudent,
      totalStars: 30,
      activityDates: [now.slice(0, 10)],
      attemptLog: [
        { id: 'a1', subject: 'math', topic: 'Math: 3 + 2 = ?', exerciseType: 'addition', correct: true, at: now }
      ]
    });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Meera Shah');
    expect(screen.getByText('30')).toBeDefined();
    expect(screen.getByText('1 of 4 lessons')).toBeDefined();
    expect(screen.getByText('Math: 3 + 2 = ?')).toBeDefined();
  });
});
