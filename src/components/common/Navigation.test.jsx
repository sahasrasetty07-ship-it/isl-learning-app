import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';
import { navItemsForRole, NAV_BY_ROLE, safeTabForRole, isTabAllowed } from '../../config/navigation';
import * as AppContextModule from '../../context/AppContext';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

const mockApp = (overrides = {}) => {
  AppContextModule.useApp.mockReturnValue({
    activeTab: 'dashboard',
    setActiveTab: vi.fn(),
    uiLanguage: 'en',
    currentRole: 'student',
    ...overrides
  });
};

describe('Navigation component', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the six student tabs in order', () => {
    mockApp();
    render(<Navigation />);

    expect(navItemsForRole('student').map(i => i.id)).toEqual([
      'dashboard', 'gujarati', 'math', 'science', 'translator', 'report'
    ]);
    expect(screen.getAllByRole('button')).toHaveLength(6);
    ['Home', 'Gujarati', 'Math', 'Science', 'Translate', 'Report'].forEach(label => {
      expect(screen.getByText(label)).toBeDefined();
    });
  });

  it('renders only the parent tabs for a parent', () => {
    mockApp({ currentRole: 'parent' });
    render(<Navigation />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Report')).toBeDefined();
    expect(screen.queryByText('Gujarati')).toBeNull();
  });

  it('renders the teacher tabs including practice', () => {
    mockApp({ currentRole: 'teacher' });
    render(<Navigation />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('Practice')).toBeDefined();
    expect(screen.queryByText('Science')).toBeNull();
  });

  it('sets aria-current="page" on the active item only', () => {
    mockApp({ activeTab: 'translator' });
    render(<Navigation />);
    expect(screen.getByText('Translate').closest('button').getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Home').closest('button').getAttribute('aria-current')).toBeNull();
  });

  it('clicking an item calls setActiveTab with the exact tab id', () => {
    const setActiveTab = vi.fn();
    mockApp({ setActiveTab });
    render(<Navigation />);
    fireEvent.click(screen.getByText('Math'));
    expect(setActiveTab).toHaveBeenCalledWith('math');
    fireEvent.click(screen.getByText('Gujarati'));
    expect(setActiveTab).toHaveBeenCalledWith('gujarati');
  });

  it('renders Gujarati labels when uiLanguage is gu', () => {
    mockApp({ uiLanguage: 'gu' });
    render(<Navigation />);
    ['હોમ', 'ગુજરાતી', 'ગણિત', 'વિજ્ઞાન', 'અનુવાદ', 'પ્રગતિ'].forEach(label => {
      expect(screen.getByText(label)).toBeDefined();
    });
  });
});

describe('NAV_BY_ROLE allow-list', () => {
  it('keeps every tab id unchanged', () => {
    expect(NAV_BY_ROLE.student).toEqual(['dashboard', 'gujarati', 'math', 'science', 'translator', 'report']);
    expect(NAV_BY_ROLE.parent).toEqual(['dashboard', 'report', 'translator']);
    expect(NAV_BY_ROLE.teacher).toEqual(['dashboard', 'report', 'assignments', 'translator']);
  });

  it('falls back to dashboard for forbidden or unknown tabs', () => {
    expect(safeTabForRole('parent', 'math')).toBe('dashboard');
    expect(safeTabForRole('teacher', 'science')).toBe('dashboard');
    expect(safeTabForRole('student', 'assignments')).toBe('dashboard');
    expect(safeTabForRole('student', 'nonsense')).toBe('dashboard');
    expect(safeTabForRole(undefined, 'report')).toBe('dashboard');
    expect(safeTabForRole('teacher', 'assignments')).toBe('assignments');
    expect(isTabAllowed('parent', 'translator')).toBe(true);
  });
});
