import { describe, it, expect } from 'vitest';
import {
  isSTTSupported,
  isTTSSupported,
  getSpeechErrorMessage,
  SPEECH_ERROR_MESSAGES,
  speak,
} from './speech.js';

describe('speech utilities', () => {
  it('provides human-readable error mapping in Gujarati and English', () => {
    expect(getSpeechErrorMessage('not-allowed', 'gu')).toBe(SPEECH_ERROR_MESSAGES['not-allowed'].gu);
    expect(getSpeechErrorMessage('not-allowed', 'en')).toBe(SPEECH_ERROR_MESSAGES['not-allowed'].en);
    expect(getSpeechErrorMessage('no-speech', 'gu')).toBe(SPEECH_ERROR_MESSAGES['no-speech'].gu);
    expect(getSpeechErrorMessage('no-speech', 'en')).toBe(SPEECH_ERROR_MESSAGES['no-speech'].en);
    expect(getSpeechErrorMessage('network', 'gu')).toBe(SPEECH_ERROR_MESSAGES['network'].gu);
    expect(getSpeechErrorMessage('network', 'en')).toBe(SPEECH_ERROR_MESSAGES['network'].en);
    expect(getSpeechErrorMessage('audio-capture', 'gu')).toBe(SPEECH_ERROR_MESSAGES['audio-capture'].gu);
    expect(getSpeechErrorMessage('audio-capture', 'en')).toBe(SPEECH_ERROR_MESSAGES['audio-capture'].en);
  });

  it('handles unknown error code gracefully with default message', () => {
    expect(getSpeechErrorMessage('unknown-err-code', 'gu')).toBe(SPEECH_ERROR_MESSAGES.default.gu);
    expect(getSpeechErrorMessage('unknown-err-code', 'en')).toBe(SPEECH_ERROR_MESSAGES.default.en);
  });

  it('reports unsupported if window.speechSynthesis or window.SpeechRecognition are missing', async () => {
    // In node environment (without browser mocks), isSTTSupported and isTTSSupported return false
    expect(isSTTSupported()).toBe(false);
    expect(isTTSSupported()).toBe(false);

    const speakResult = await speak('નમસ્તે');
    expect(speakResult).toEqual({ ok: false, reason: 'unsupported' });
  });
});
