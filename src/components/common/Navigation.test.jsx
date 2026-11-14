import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation, NAV_ITEMS } from './Navigation';
import * as AppContextModule from '../../context/AppContext';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

describe('Navigation component', () => {
  const mockSetActiveTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 6 navigation items with exact ids in order', () => {
    AppContextModule.useApp.mockReturnValue({
      activeTab: 'dashboard',
      setActiveTab: mockSetActiveTab,
      uiLanguage: 'en',
    });

    render(<Navigation />);

    const expectedIds = ['dashboard', 'gujarati', 'math', 'science', 'translator', 'report'];
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(expectedIds);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Gujarati')).toBeDefined();
    expect(screen.getByText('Math')).toBeDefined();
    expect(screen.getByText('Science')).toBeDefined();
    expect(screen.getByText('Translate')).toBeDefined();
    expect(screen.getByText('Report')).toBeDefined();
  });

  it('sets aria-current="page" on the active item only', () => {
    AppContextModule.useApp.mockReturnValue({
      activeTab: 'translator',
      setActiveTab: mockSetActiveTab,
      uiLanguage: 'en',
    });

    render(<Navigation />);

    const translateButton = screen.getByText('Translate').closest('button');
    expect(translateButton.getAttribute('aria-current')).toBe('page');

    const homeButton = screen.getByText('Home').closest('button');
    expect(homeButton.getAttribute('aria-current')).toBeNull();
  });

  it('clicking an item calls setActiveTab with the exact tab id', () => {
    AppContextModule.useApp.mockReturnValue({
      activeTab: 'dashboard',
      setActiveTab: mockSetActiveTab,
      uiLanguage: 'en',
    });

    render(<Navigation />);

    fireEvent.click(screen.getByText('Math'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('math');

    fireEvent.click(screen.getByText('Gujarati'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('gujarati');

    fireEvent.click(screen.getByText('Science'));
    expect(mockSetActiveTab).toHaveBeenCalledWith('science');
  });

  it('renders Gujarati labels when uiLanguage is gu', () => {
    AppContextModule.useApp.mockReturnValue({
      activeTab: 'dashboard',
      setActiveTab: mockSetActiveTab,
      uiLanguage: 'gu',
    });

    render(<Navigation />);

    expect(screen.getByText('હોમ')).toBeDefined();
    expect(screen.getByText('ગુજરાતી')).toBeDefined();
    expect(screen.getByText('ગણિત')).toBeDefined();
    expect(screen.getByText('વિજ્ઞાન')).toBeDefined();
    expect(screen.getByText('અનુવાદ')).toBeDefined();
    expect(screen.getByText('પ્રગતિ')).toBeDefined();
  });
});
