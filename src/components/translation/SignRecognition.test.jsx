import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignRecognition } from './SignRecognition';
import * as AppContextModule from '../../context/AppContext';
import * as SpeechModule from '../../utils/speech';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../../utils/speech', () => ({
  isTTSSupported: vi.fn(() => true),
  speak: vi.fn(() => Promise.resolve({ ok: true })),
  stopSpeaking: vi.fn(),
}));

describe('SignRecognition component', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    AppContextModule.useApp.mockReturnValue({
      uiLanguage: 'en',
      showToast: mockShowToast,
    });
  });

  it('renders camera controls and displays missing model notice when model files are not trained', async () => {
    render(<SignRecognition />);

    expect(screen.getByText(/Sign → Text\/Speech/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Start Camera/i })).toBeDefined();

    // Verify model not trained yet notice
    await waitFor(() => {
      expect(screen.getByText(/Recognition model not trained yet/i)).toBeDefined();
    });
  });

  it('renders confirmed text buffer and allows speaking confirmed sentence', async () => {
    render(<SignRecognition />);

    // Initial confirmed buffer has 'નમસ્તે'
    expect(screen.getByText('નમસ્તે')).toBeDefined();

    // Click Speak Confirmed Sentence
    const speakBtn = screen.getByRole('button', { name: /Speak Confirmed Sentence/i });
    fireEvent.click(speakBtn);

    await waitFor(() => {
      expect(SpeechModule.speak).toHaveBeenCalledWith('નમસ્તે', expect.objectContaining({ lang: 'gu-IN' }));
    });
  });

  it('allows manual editing and deleting words in confirmed buffer', () => {
    render(<SignRecognition />);

    expect(screen.getByText('નમસ્તે')).toBeDefined();

    // Delete word
    const deleteBtn = screen.getByRole('button', { name: /Delete last word/i });
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('નમસ્તે')).toBeNull();
    expect(screen.getByText(/No signs confirmed yet/i)).toBeDefined();
  });
});
