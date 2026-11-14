/**
 * src/utils/speech.js
 * Browser Web Speech API utilities for Gujarati (gu-IN) STT & TTS with graceful fallback.
 */

export const SPEECH_ERROR_MESSAGES = {
  'not-allowed': {
    gu: 'માઇક્રોફોનની પરવાનગી નકારી દેવામાં આવી છે. કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાંથી માઇક્રોફોન મંજૂરી આપો.',
    en: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
  },
  'no-speech': {
    gu: 'કોઈ અવાજ સંભળાયો નથી. કૃપા કરીને ફરીથી માઈક દબાવી બોલો.',
    en: 'No speech was detected. Please tap the mic and try speaking again.',
  },
  'network': {
    gu: 'નેટવર્ક ભૂલ આવી. કૃપા કરીને ઇન્ટરનેટ કનેક્શન તપાસો.',
    en: 'A network error occurred. Please check your internet connection.',
  },
  'audio-capture': {
    gu: 'માઇક્રોફોન મળ્યો નથી અથવા ઑડિઓ રેકોર્ડિંગ નિષ્ફળ રહ્યું.',
    en: 'No microphone was found or audio capture failed.',
  },
  'language-not-supported': {
    gu: 'આ બ્રાઉઝરમાં પસંદ કરેલી ભાષા માટે વાણી ઓળખ ઉપલબ્ધ નથી.',
    en: 'Speech recognition is not supported for the selected language in this browser.',
  },
  'default': {
    gu: 'વાણી ઓળખ દરમિયાન અણધારી ભૂલ આવી.',
    en: 'An unexpected error occurred during speech recognition.',
  },
};

/**
 * Returns a localized human-readable error message.
 * @param {string} errCode
 * @param {'gu'|'en'} lang
 * @returns {string}
 */
export function getSpeechErrorMessage(errCode, lang = 'gu') {
  const isEn = lang === 'en';
  const entry = SPEECH_ERROR_MESSAGES[errCode] || SPEECH_ERROR_MESSAGES.default;
  return isEn ? entry.en : entry.gu;
}

/**
 * Checks if browser SpeechRecognition (STT) is supported.
 * @returns {boolean}
 */
export function isSTTSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Checks if browser SpeechSynthesis (TTS) is supported.
 * @returns {boolean}
 */
export function isTTSSupported() {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Starts speech recognition listening session.
 * @param {object} options
 * @param {string} [options.lang='gu-IN']
 * @param {(text: string) => void} [options.onInterim]
 * @param {(text: string) => void} [options.onFinal]
 * @param {(err: { error: string, message: string }) => void} [options.onError]
 * @param {() => void} [options.onEnd]
 * @returns {{ stop: () => void }}
 */
export function startListening({
  lang = 'gu-IN',
  onInterim,
  onFinal,
  onError,
  onEnd,
} = {}) {
  if (!isSTTSupported()) {
    if (onError) {
      onError({
        error: 'not-supported',
        message: 'Speech recognition is not supported in this browser.',
      });
    }
    return { stop: () => {} };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  let finalTranscriptAccumulator = '';
  let stoppedByUser = false;

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      const text = item[0]?.transcript || '';
      if (item.isFinal) {
        finalTranscriptAccumulator = (finalTranscriptAccumulator ? `${finalTranscriptAccumulator} ` : '') + text.trim();
        if (onFinal) onFinal(finalTranscriptAccumulator);
      } else {
        interim += text;
      }
    }
    if (onInterim) {
      onInterim(interim);
    }
  };

  recognition.onerror = (event) => {
    if (stoppedByUser && event.error === 'aborted') return;
    const code = event.error || 'default';
    if (onError) {
      onError({
        error: code,
        message: getSpeechErrorMessage(code, 'en'),
      });
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    if (onError) {
      onError({
        error: 'start-failed',
        message: err?.message || 'Could not start speech recognition',
      });
    }
  }

  return {
    stop: () => {
      stoppedByUser = true;
      try {
        recognition.stop();
      } catch {
        // ignore already stopped
      }
    },
  };
}

/**
 * Helper to fetch available speech synthesis voices, waiting for voiceschanged if needed.
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function getAvailableVoices() {
  if (!isTTSSupported()) return Promise.resolve([]);

  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices() || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Timeout fallback after 600ms
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 600);
  });
}

/**
 * Speaks text using window.speechSynthesis.
 * Specifically checks for Gujarati voice if lang is 'gu-IN' or 'gu'.
 * If no Gujarati voice exists, returns `{ ok: false, reason: 'no-voice' }`.
 * @param {string} text
 * @param {{ lang?: string, rate?: number }} [options]
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function speak(text, { lang = 'gu-IN', rate = 0.9 } = {}) {
  if (!isTTSSupported()) {
    return { ok: false, reason: 'unsupported' };
  }
  if (!text || !text.trim()) {
    return { ok: false, reason: 'empty-text' };
  }

  stopSpeaking();

  const voices = await getAvailableVoices();
  const normalizedLang = lang.toLowerCase().replace('_', '-');
  const isGujarati = normalizedLang.startsWith('gu');

  // Look for matching voice
  let matchedVoice = null;
  if (isGujarati) {
    matchedVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === 'gu-in' || vLang.startsWith('gu');
    });

    if (!matchedVoice) {
      return { ok: false, reason: 'no-voice' };
    }
  } else {
    matchedVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === normalizedLang || vLang.startsWith(normalizedLang.slice(0, 2));
    });
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    window.speechSynthesis.speak(utterance);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'playback-failed', error: err?.message };
  }
}

/**
 * Stops ongoing speech synthesis.
 */
export function stopSpeaking() {
  if (isTTSSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}
