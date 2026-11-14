/**
 * src/utils/signMatcher.js
 * Pure functions for Gujarati text normalization, sentence splitting,
 * phrase dictionary matching (4-word down to 1-word), fingerspelling fallback,
 * and coverage reporting.
 */

import { phrasebookData } from '../data/phrasebookData.js';
import { gujaratiNumbers } from '../data/gujaratiNumbers.js';
import { gujaratiAlphabets } from '../data/gujaratiAlphabets.js';
import { signVideos, buildYouTubeEmbedUrl } from '../data/signVideos.js';
import { getEmbedUrl } from './video.js';

// Gujarati and common Indian punctuation including danda (।, ॥) and standard symbols
const PUNCT_REGEX = /[\u0964\u0965,।.?!:;'"()\[\]{}\-—_/\\]/g;

/**
 * Normalizes Gujarati text: Unicode NFC, strip punctuation, collapse whitespace, trim.
 * @param {string} text
 * @returns {string}
 */
export function normalizeGujarati(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .replace(PUNCT_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into sentences on ., ?, !, danda (।), or newlines.
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/[\n\r.?!।]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolves the playable URL for a signVideos entry.
 * If status !== 'approved' or no video source exists, returns null.
 * @param {object} entry
 * @returns {string|null}
 */
export function resolvePlayableUrl(entry) {
  if (!entry) return null;
  if (entry.status !== 'approved') return null;

  if (entry.youtubeId) {
    return buildYouTubeEmbedUrl(entry.youtubeId, entry.startTime ?? entry.start, entry.endTime ?? entry.end);
  }
  if (entry.url && entry.url.trim()) {
    const embed = getEmbedUrl(entry.url, {
      start: entry.startTime ?? entry.start,
      end: entry.endTime ?? entry.end,
    });
    return embed || entry.url.trim();
  }
  return null;
}

/**
 * Letter to sign mapping for fingerspelling, including only approved alphabet sign videos.
 */
export function getDefaultLetterClips() {
  const map = {};
  Object.values(signVideos).forEach((item) => {
    if (item.type === 'alphabet' && item.gujarati && item.status === 'approved') {
      const url = resolvePlayableUrl(item);
      map[item.gujarati] = {
        letter: item.gujarati,
        key: item.id,
        url,
        status: item.status,
        label: item.gujarati,
      };
    }
  });
  return map;
}

/**
 * Maps phrases to signVideos keys.
 */
const PHRASE_KEY_MAP = {
  'નમસ્તે': 'phrase-namaste',
  'આભાર': 'phrase-aabhar',
  'શુભ સવાર': 'phrase-shubh-savar',
  'તમારું નામ શું છે': 'phrase-tamaru-naam',
  'તમારું નામ શું છે?': 'phrase-tamaru-naam',
  'હું વિદ્યાર્થી છું': 'phrase-hu-vidyarthi',
};

/**
 * Builds the default dictionary from phrasebookData, gujaratiNumbers, gujaratiAlphabets, and signVideos.
 */
export function getDefaultDictionary() {
  const dict = [];
  const seen = new Set();

  // 1. Phrasebook phrases
  phrasebookData.forEach((p) => {
    const norm = normalizeGujarati(p.gujarati);
    if (!norm || seen.has(norm)) return;
    seen.add(norm);

    const key = PHRASE_KEY_MAP[p.gujarati] || PHRASE_KEY_MAP[norm] || `phrase-${norm.replace(/\s+/g, '-')}`;
    const sv = signVideos[key];
    const url = sv ? resolvePlayableUrl(sv) : null;

    dict.push({
      phrase: norm,
      label: p.gujarati,
      key,
      url,
      status: sv?.status || 'pending',
      signDescription: p.signDescription,
      english: p.english,
      category: p.category || 'phrase',
      type: 'phrase',
    });
  });

  // 2. Numbers (words & numerals)
  gujaratiNumbers.forEach((n) => {
    const numKey = n.id || `n${n.number}`;
    const sv = signVideos[numKey] || signVideos[`number-${numKey}`];
    const url = sv ? resolvePlayableUrl(sv) : null;

    // Word: e.g. "એક"
    const normWord = normalizeGujarati(n.word);
    if (normWord && !seen.has(normWord)) {
      seen.add(normWord);
      dict.push({
        phrase: normWord,
        label: n.word,
        key: numKey,
        url,
        status: sv?.status || 'pending',
        signDescription: n.signDescription,
        english: n.englishWord,
        category: 'number',
        type: 'number',
      });
    }

    // Numeral: e.g. "૧"
    const normNum = normalizeGujarati(n.number);
    if (normNum && !seen.has(normNum)) {
      seen.add(normNum);
      dict.push({
        phrase: normNum,
        label: n.number,
        key: numKey,
        url,
        status: sv?.status || 'pending',
        signDescription: n.signDescription,
        english: `${n.word} (${n.englishNumber})`,
        category: 'number',
        type: 'number',
      });
    }
  });

  // 3. Approved concept words from Alphabet curriculum (e.g. કમળ, ખલ, ઘર)
  gujaratiAlphabets.forEach((a) => {
    if (!a.word) return;
    const normWord = normalizeGujarati(a.word);
    if (!normWord || seen.has(normWord)) return;
    seen.add(normWord);

    const sv = signVideos[a.id] || signVideos[`letter-${a.id}`];
    const url = sv ? resolvePlayableUrl(sv) : null;

    dict.push({
      phrase: normWord,
      label: a.word,
      key: a.id,
      url,
      status: sv?.status || 'pending',
      signDescription: a.signDescription,
      english: a.wordEnglish || a.word,
      category: 'word',
      type: 'word',
    });
  });

  return dict;
}

/**
 * Splits a word into individual characters/graphemes for fingerspelling check.
 * @param {string} word
 * @returns {string[]}
 */
export function getWordCharacters(word) {
  if (!word) return [];
  // Use Intl.Segmenter if available for grapheme boundary splitting, fallback to Array.from
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('gu', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

/**
 * Converts input text into a typed sign sequence.
 * Uses longest match from 4-word phrases down to single words.
 * Unmatched words become { type: 'fingerspell', letters: [...] } only if every letter has an approved clip.
 * Otherwise returns { type: 'unsupported', word }.
 *
 * @param {string} text
 * @param {Array<{ phrase: string, key?: string, url?: string, label?: string }>} [dict]
 * @param {Record<string, { letter: string, key: string, url: string }>} [letterClips]
 * @returns {Array<{ type: 'video' | 'fingerspell' | 'unsupported', key: string, url: string|null, label: string, word?: string, letters?: Array<any> }>}
 */
export function toSignSequence(
  text,
  dict = getDefaultDictionary(),
  letterClips = getDefaultLetterClips()
) {
  const normalized = normalizeGujarati(text);
  if (!normalized) return [];

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Index dictionary items by normalized phrase length (descending)
  const dictMap = new Map();
  dict.forEach((item) => {
    const p = normalizeGujarati(item.phrase || item.gujarati || item.label);
    if (p && !dictMap.has(p)) {
      dictMap.set(p, item);
    }
  });

  const sequence = [];
  let i = 0;

  while (i < words.length) {
    let matched = false;
    const maxWindow = Math.min(4, words.length - i);

    // Longest match: 4 words down to 1 word
    for (let len = maxWindow; len >= 1; len--) {
      const candidate = words.slice(i, i + len).join(' ');
      const match = dictMap.get(candidate);

      if (match) {
        sequence.push({
          type: 'video',
          key: match.key || `dict-${candidate.replace(/\s+/g, '-')}`,
          url: match.url || null,
          label: match.label || candidate,
          signDescription: match.signDescription || null,
          category: match.category || null,
          wordCount: len,
          matchedWords: candidate,
        });
        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Single unmatched word
    const currentWord = words[i];
    const chars = getWordCharacters(currentWord);

    // Check if every individual character has a fingerspelling clip
    const allHaveClips = chars.length > 0 && chars.every((ch) => Boolean(letterClips[ch]));

    if (allHaveClips) {
      const letters = chars.map((ch) => ({
        letter: ch,
        key: letterClips[ch].key || `letter-${ch}`,
        url: letterClips[ch].url || null,
        label: ch,
      }));

      sequence.push({
        type: 'fingerspell',
        key: `fingerspell-${currentWord}`,
        url: letters[0]?.url || null,
        label: currentWord,
        word: currentWord,
        letters,
        wordCount: 1,
      });
    } else {
      sequence.push({
        type: 'unsupported',
        key: `unsupported-${currentWord}`,
        url: null,
        label: currentWord,
        word: currentWord,
        wordCount: 1,
      });
    }

    i += 1;
  }

  return sequence;
}

/**
 * Calculates translation coverage summary.
 * @param {Array<{ type: string, wordCount?: number }>} sequence
 * @returns {{ totalWords: number, matchedWords: number, fingerspelledWords: number, unsupportedWords: number, coveragePercent: number }}
 */
export function calculateCoverage(sequence = []) {
  let matched = 0;
  let fingerspelled = 0;
  let unsupported = 0;

  sequence.forEach((item) => {
    const count = item.wordCount || 1;
    if (item.type === 'video') {
      matched += count;
    } else if (item.type === 'fingerspell') {
      fingerspelled += count;
    } else if (item.type === 'unsupported') {
      unsupported += count;
    }
  });

  const total = matched + fingerspelled + unsupported;
  const covered = matched + fingerspelled;
  const coveragePercent = total > 0 ? Math.round((covered / total) * 100) : 0;

  return {
    totalWords: total,
    matchedWords: matched,
    fingerspelledWords: fingerspelled,
    unsupportedWords: unsupported,
    coveragePercent,
  };
}
