import { describe, it, expect } from 'vitest';
import {
  normalizeGujarati,
  splitSentences,
  toSignSequence,
  calculateCoverage,
  getDefaultLetterClips,
} from './signMatcher.js';

describe('signMatcher pure functions', () => {
  describe('normalizeGujarati', () => {
    it('normalizes Unicode to NFC', () => {
      // Composed vs decomposed forms
      const str1 = 'ક\u0ACD'; // virama
      expect(normalizeGujarati(str1)).toBe(str1.normalize('NFC').trim());
    });

    it('strips punctuation including danda and standard punctuation', () => {
      const input = 'નમસ્તે, મારું નામ શું છે? હું વિદ્યાર્થી છું। ખરેખર!';
      const expected = 'નમસ્તે મારું નામ શું છે હું વિદ્યાર્થી છું ખરેખર';
      expect(normalizeGujarati(input)).toBe(expected);
    });

    it('collapses multiple spaces, tabs, and newlines into single spaces', () => {
      const input = '  નમસ્તે \t\t મિત્ર \n\n  આભાર   ';
      expect(normalizeGujarati(input)).toBe('નમસ્તે મિત્ર આભાર');
    });

    it('handles empty, null, or undefined input gracefully', () => {
      expect(normalizeGujarati('')).toBe('');
      expect(normalizeGujarati(null)).toBe('');
      expect(normalizeGujarati(undefined)).toBe('');
      expect(normalizeGujarati('   ')).toBe('');
      expect(normalizeGujarati('!?,.-।')).toBe('');
    });
  });

  describe('splitSentences', () => {
    it('splits on full stops, question marks, exclamation marks, and danda', () => {
      const text = 'નમસ્તે. તમારું નામ શું છે? મને મદદ જોઈએ છે! હું વિદ્યાર્થી છું।';
      const sentences = splitSentences(text);
      expect(sentences).toEqual([
        'નમસ્તે',
        'તમારું નામ શું છે',
        'મને મદદ જોઈએ છે',
        'હું વિદ્યાર્થી છું',
      ]);
    });

    it('splits on newlines as well', () => {
      const text = 'પ્રથમ વાક્ય\nબીજું વાક્ય\r\nત્રીજું વાક્ય';
      expect(splitSentences(text)).toEqual([
        'પ્રથમ વાક્ય',
        'બીજું વાક્ય',
        'ત્રીજું વાક્ય',
      ]);
    });

    it('handles empty or blank text gracefully', () => {
      expect(splitSentences('')).toEqual([]);
      expect(splitSentences('   \n  \n  ')).toEqual([]);
      expect(splitSentences(null)).toEqual([]);
    });
  });

  describe('toSignSequence', () => {
    const mockDict = [
      { phrase: 'તમારું નામ શું છે', key: 'phrase-tamaru-naam', url: 'https://video/tamaru-naam' },
      { phrase: 'શુભ સવાર', key: 'phrase-shubh-savar', url: 'https://video/shubh-savar' },
      { phrase: 'નમસ્તે', key: 'phrase-namaste', url: 'https://video/namaste' },
      { phrase: 'કમળ', key: 'word-kamal', url: 'https://video/kamal' },
      { phrase: 'ઘર', key: 'word-ghar', url: 'https://video/ghar' },
    ];

    const mockLetterClips = {
      'ક': { letter: 'ક', key: 'ka', url: 'https://video/ka' },
      'પ': { letter: 'પ', key: 'pa', url: 'https://video/pa' },
      'અ': { letter: 'અ', key: 'a', url: 'https://video/a' },
      'ખ': { letter: 'ખ', key: 'kha', url: 'https://video/kha' },
    };

    it('matches 4-word phrase first (longest match)', () => {
      const text = 'તમારું નામ શું છે';
      const result = toSignSequence(text, mockDict, mockLetterClips);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'video',
        key: 'phrase-tamaru-naam',
        url: 'https://video/tamaru-naam',
        wordCount: 4,
      });
    });

    it('matches 2-word phrase correctly', () => {
      const text = 'શુભ સવાર મિત્ર';
      const result = toSignSequence(text, mockDict, mockLetterClips);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'video',
        key: 'phrase-shubh-savar',
        wordCount: 2,
      });
      // 'મિત્ર' is not in mockDict and cannot be fingerspelled with only mockLetterClips
      expect(result[1]).toMatchObject({
        type: 'unsupported',
        word: 'મિત્ર',
      });
    });

    it('matches single-word entries in dictionary', () => {
      const text = 'કમળ અને ઘર';
      const result = toSignSequence(text, mockDict, mockLetterClips);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: 'video',
        key: 'word-kamal',
        label: 'કમળ',
      });
      // 'અને' -> 'અ' is in clips, 'ન' and 'ે' are not -> unsupported
      expect(result[1]).toMatchObject({
        type: 'unsupported',
        word: 'અને',
      });
      expect(result[2]).toMatchObject({
        type: 'video',
        key: 'word-ghar',
        label: 'ઘર',
      });
    });

    it('fingerspells unmatched word when EVERY required letter has a clip', () => {
      // "કપ" contains 'ક' and 'પ' - both exist in mockLetterClips
      const text = 'કપ';
      const result = toSignSequence(text, mockDict, mockLetterClips);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'fingerspell',
        word: 'કપ',
      });
      expect(result[0].letters).toHaveLength(2);
      expect(result[0].letters[0]).toMatchObject({ letter: 'ક', key: 'ka' });
      expect(result[0].letters[1]).toMatchObject({ letter: 'પ', key: 'pa' });
    });

    it('marks word as unsupported when any letter lacks a fingerspelling clip', () => {
      // "શાળા" has characters not in mockLetterClips
      const text = 'શાળા';
      const result = toSignSequence(text, mockDict, mockLetterClips);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'unsupported',
        word: 'શાળા',
        url: null,
      });
    });

    it('returns empty array for empty, whitespace, or punctuation-only input', () => {
      expect(toSignSequence('', mockDict, mockLetterClips)).toEqual([]);
      expect(toSignSequence('   ', mockDict, mockLetterClips)).toEqual([]);
      expect(toSignSequence('.,!?:;', mockDict, mockLetterClips)).toEqual([]);
      expect(toSignSequence(null, mockDict, mockLetterClips)).toEqual([]);
    });

    it('works seamlessly with real default dictionary and default letter clips', () => {
      const realClips = getDefaultLetterClips();
      expect(realClips['ક']).toBeDefined();
      expect(realClips['પ']).toBeDefined();

      const res = toSignSequence('કમળ અને કપ');
      expect(res.length).toBeGreaterThan(0);
      // 'કમળ' is a concept word in default dictionary
      expect(res[0].type).toBe('video');
      expect(res[0].label).toBe('કમળ');
    });
  });

  describe('calculateCoverage', () => {
    it('calculates coverage percentage and word breakdown correctly', () => {
      const seq = [
        { type: 'video', wordCount: 4 },
        { type: 'fingerspell', wordCount: 1 },
        { type: 'unsupported', wordCount: 2 },
      ];
      const coverage = calculateCoverage(seq);
      expect(coverage).toEqual({
        totalWords: 7,
        matchedWords: 4,
        fingerspelledWords: 1,
        unsupportedWords: 2,
        coveragePercent: 71, // 5 / 7 = 71.4% -> 71%
      });
    });

    it('handles empty sequence', () => {
      expect(calculateCoverage([])).toEqual({
        totalWords: 0,
        matchedWords: 0,
        fingerspelledWords: 0,
        unsupportedWords: 0,
        coveragePercent: 0,
      });
    });
  });
});
