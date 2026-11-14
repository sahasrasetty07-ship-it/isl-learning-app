import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceTools } from './VoiceTools';
import * as AppContextModule from '../../context/AppContext';
import * as SpeechModule from '../../utils/speech';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../../utils/speech', () => ({
  isSTTSupported: vi.fn(() => true),
  isTTSSupported: vi.fn(() => true),
  startListening: vi.fn(() => ({ stop: vi.fn() })),
  speak: vi.fn(() => Promise.resolve({ ok: true })),
  stopSpeaking: vi.fn(),
  getSpeechErrorMessage: vi.fn((code) => `Error: ${code}`),
}));

describe('VoiceTools component', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    AppContextModule.useApp.mockReturnValue({
      uiLanguage: 'en',
      showToast: mockShowToast,
    });
  });

  it('renders all three sub-tabs: Live Captions, Type-to-Speak, Conversation Mode', () => {
    render(<VoiceTools />);

    expect(screen.getByRole('tab', { name: /Live Captions/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Type-to-Speak/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Conversation Mode/i })).toBeDefined();
  });

  it('allows switching to Type-to-Speak, displays presets and allows saving custom phrases', async () => {
    render(<VoiceTools />);

    // Switch to Type-to-Speak
    fireEvent.click(screen.getByRole('tab', { name: /Type-to-Speak/i }));

    expect(screen.getByText(/Type to Speak in Gujarati/i)).toBeDefined();

    // Check custom phrase input
    const input = screen.getByPlaceholderText(/Add new custom phrase in Gujarati/i);
    fireEvent.change(input, { target: { value: 'નવું પરીક્ષણ વાક્ય' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    // Verify phrase is saved and displayed
    await waitFor(() => {
      expect(screen.getByText('નવું પરીક્ષણ વાક્ય')).toBeDefined();
    });

    // Check localStorage persistence
    const saved = JSON.parse(localStorage.getItem('saket_custom_phrases_v1'));
    expect(saved.some((p) => p.text === 'નવું પરીક્ષણ વાક્ય')).toBe(true);
  });

  it('allows switching to Conversation Mode, posts and speaks deaf-user response', async () => {
    render(<VoiceTools />);

    // Switch to Conversation Mode
    fireEvent.click(screen.getByRole('tab', { name: /Conversation Mode/i }));

    expect(screen.getByText(/Live Conversation Stream/i)).toBeDefined();
    expect(screen.getByText(/Hearing Speaker/i)).toBeDefined();
    expect(screen.getByText(/Deaf \/ Hard of Hearing/i)).toBeDefined();

    // Type deaf response
    const textarea = screen.getByPlaceholderText(/Type reply here in Gujarati/i);
    fireEvent.change(textarea, { target: { value: 'હું બરાબર સમજી ગયો છું.' } });

    const sendBtn = screen.getByRole('button', { name: /Send & Speak Aloud/i });
    fireEvent.click(sendBtn);

    // Verify message is posted to stream
    expect(screen.getByText('હું બરાબર સમજી ગયો છું.')).toBeDefined();
    // Verify speech was invoked
    expect(SpeechModule.speak).toHaveBeenCalledWith(
      'હું બરાબર સમજી ગયો છું.',
      expect.objectContaining({ lang: 'gu-IN' })
    );
  });

  it('handles live captions start and stop cleanly', () => {
    render(<VoiceTools />);

    const startBtn = screen.getByRole('button', { name: /Start Live Captions/i });
    fireEvent.click(startBtn);

    expect(SpeechModule.startListening).toHaveBeenCalled();
    expect(screen.getByText(/Listening continuously.../i)).toBeDefined();

    // Stop listening
    const stopBtn = screen.getByRole('button', { name: /Stop Listening/i });
    fireEvent.click(stopBtn);

    expect(screen.getByText(/Microphone is idle/i)).toBeDefined();
  });
});
