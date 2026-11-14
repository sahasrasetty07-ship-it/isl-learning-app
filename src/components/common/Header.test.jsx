import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import * as AppContextModule from '../../context/AppContext';
import * as AuthContextModule from '../../context/AuthContext';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Header component', () => {
  const mockSetCurrentRole = vi.fn();
  const mockSetUiLanguage = vi.fn();
  const mockSetAudioEnabled = vi.fn();
  const mockSetIsMobileFrame = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    AppContextModule.useApp.mockReturnValue({
      currentRole: 'student',
      setCurrentRole: mockSetCurrentRole,
      canSwitchRoles: true,
      uiLanguage: 'en',
      setUiLanguage: mockSetUiLanguage,
      audioEnabled: true,
      setAudioEnabled: mockSetAudioEnabled,
      isMobileFrame: false,
      setIsMobileFrame: mockSetIsMobileFrame,
      student: { totalStars: 45, currentStreak: 7 },
    });

    AuthContextModule.useAuth.mockReturnValue({
      user: { email: 'student@example.com' },
      profile: { full_name: 'Aarav Patel', role: 'student' },
      isAllAccess: false,
      signOut: mockSignOut,
    });
  });

  it('renders brand title and student statistics correctly', () => {
    render(<Header />);
    expect(screen.getByText('Saket')).toBeDefined();
    expect(screen.getByText('(સાકેત)')).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();
    expect(screen.getByText('7d')).toBeDefined();
  });

  it('allows switching role view when canSwitchRoles is true', () => {
    render(<Header />);
    const teacherRadios = screen.getAllByRole('radio', { name: /teacher/i });
    expect(teacherRadios.length).toBeGreaterThan(0);

    fireEvent.click(teacherRadios[0]);
    expect(mockSetCurrentRole).toHaveBeenCalledWith('teacher');
  });

  it('renders a read-only role badge when canSwitchRoles is false', () => {
    AppContextModule.useApp.mockReturnValue({
      currentRole: 'student',
      setCurrentRole: mockSetCurrentRole,
      canSwitchRoles: false,
      uiLanguage: 'en',
      setUiLanguage: mockSetUiLanguage,
      audioEnabled: true,
      setAudioEnabled: mockSetAudioEnabled,
      isMobileFrame: false,
      setIsMobileFrame: mockSetIsMobileFrame,
      student: { totalStars: 10, currentStreak: 2 },
    });

    render(<Header />);
    // When canSwitchRoles is false, no radio buttons exist
    const radios = screen.queryAllByRole('radio');
    expect(radios).toHaveLength(0);

    // Read-only status badge is displayed
    const statusBadges = screen.getAllByRole('status');
    const roleBadge = statusBadges.find((el) => el.getAttribute('aria-label')?.includes('Current role'));
    expect(roleBadge).toBeDefined();
  });

  it('toggles language when language button is clicked', () => {
    render(<Header />);
    const langButton = screen.getByRole('button', { name: /switch language to gujarati/i });
    fireEvent.click(langButton);
    expect(mockSetUiLanguage).toHaveBeenCalledWith('gu');
  });

  it('overflow menu opens, exposes audio/credits/sign-out, and closes on Escape', () => {
    render(<Header />);
    const menuTrigger = screen.getByLabelText(/account and settings menu/i);
    expect(menuTrigger.getAttribute('aria-expanded')).toBe('false');

    // Open menu
    fireEvent.click(menuTrigger);
    expect(menuTrigger.getAttribute('aria-expanded')).toBe('true');

    // Check menu options
    expect(screen.getByText(/Speech Audio \(TTS\)/i)).toBeDefined();
    expect(screen.getByText(/Sources & Credits/i)).toBeDefined();
    expect(screen.getByText(/Sign Out/i)).toBeDefined();

    // Toggle audio from menu
    fireEvent.click(screen.getByText(/Speech Audio \(TTS\)/i));
    expect(mockSetAudioEnabled).toHaveBeenCalledWith(false);

    // Press Escape to close menu
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menuTrigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('credits dialog opens from menu and displays ISLRTC attribution', () => {
    render(<Header />);
    const menuTrigger = screen.getByLabelText(/account and settings menu/i);
    fireEvent.click(menuTrigger);

    // Click credits option
    fireEvent.click(screen.getByText(/Sources & Credits/i));

    // Dialog is visible
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Indian Sign Language Research and Training Centre \(ISLRTC\)/i)).toBeDefined();

    // Close dialog
    const closeBtn = screen.getByRole('button', { name: /close credits dialog/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
