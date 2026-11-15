import { describe, it, expect } from 'vitest';
import { HAND_SIGNS, HOLD_MS, classifyHand, stepHold } from './handSigns.js';

// Synthetic hand: wrist at the origin, fingers pointing up (image y grows downward).
// pattern: thumb, index, middle, ring, little; '1' = straight, '0' = folded.
const hand = (pattern) => {
  const lm = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  const xs = [null, -0.03, -0.01, 0.01, 0.03];
  for (let f = 1; f <= 4; f++) {
    const up = pattern[f] === '1';
    lm[f * 4 + 1] = { x: xs[f], y: -0.09, z: 0 };
    lm[f * 4 + 2] = { x: xs[f], y: -0.13, z: 0 };
    lm[f * 4 + 3] = { x: xs[f], y: up ? -0.155 : -0.11, z: up ? 0 : 0.02 };
    lm[f * 4 + 4] = { x: xs[f], y: up ? -0.18 : -0.08, z: up ? 0 : 0.03 };
  }
  lm[1] = { x: -0.02, y: -0.02, z: 0 };
  lm[2] = { x: -0.04, y: -0.04, z: 0 };
  if (pattern[0] === '1') {
    // thumb straight out to the side
    lm[3] = { x: -0.07, y: -0.04, z: 0 };
    lm[4] = { x: -0.10, y: -0.04, z: 0 };
  } else {
    // thumb folded across the palm
    lm[3] = { x: -0.02, y: -0.06, z: 0.02 };
    lm[4] = { x: 0.0, y: -0.07, z: 0.02 };
  }
  return lm;
};
// A real thumbs up/down is the sideways-thumb fist turned a quarter turn
const turn = (lm, up) => lm.map(p => (up ? { ...p, x: -p.y, y: p.x } : { ...p, x: p.y, y: -p.x }));
const idOf = (lm) => classifyHand(lm)?.id ?? null;

describe('handSigns', () => {
  describe('classifyHand', () => {
    it('recognises the numbers 1 to 5 by which fingers are up', () => {
      expect(idOf(hand('01000'))).toBe('one');
      expect(idOf(hand('01100'))).toBe('two');
      expect(idOf(hand('01110'))).toBe('three');
      expect(idOf(hand('01111'))).toBe('four');
      expect(idOf(hand('11111'))).toBe('five');
    });

    it('tells thumbs up from thumbs down', () => {
      expect(idOf(turn(hand('10000'), true))).toBe('good');
      expect(idOf(turn(hand('10000'), false))).toBe('bad');
    });

    it('returns null for shapes outside the list instead of guessing the closest one', () => {
      expect(idOf(hand('00000'))).toBeNull(); // fist
      expect(idOf(hand('10000'))).toBeNull(); // thumb sideways
      expect(idOf(hand('01001'))).toBeNull(); // index + little finger
      expect(idOf(hand('00100'))).toBeNull();
    });

    it('returns null for missing or incomplete landmarks', () => {
      expect(classifyHand(null)).toBeNull();
      expect(classifyHand([])).toBeNull();
      expect(classifyHand(new Array(10).fill({ x: 0, y: 0, z: 0 }))).toBeNull();
    });

    it('has unique sign ids', () => {
      expect(new Set(HAND_SIGNS.map(s => s.id)).size).toBe(HAND_SIGNS.length);
    });
  });

  describe('stepHold', () => {
    it('commits a sign once, only after it is held for the full time', () => {
      let state = { sign: null, since: 0, fired: false };
      const feed = (sign, now) => {
        const r = stepHold(state, sign, now);
        state = r.state;
        return r.commit;
      };
      expect(feed('one', 0)).toBeNull();
      expect(feed('one', HOLD_MS - 1)).toBeNull();      // not held long enough
      expect(feed('one', HOLD_MS)).toBe('one');          // held steady: committed once
      expect(feed('one', HOLD_MS * 5)).toBeNull();       // still held: not again
      expect(feed(null, HOLD_MS * 5 + 1)).toBeNull();
      expect(feed('one', HOLD_MS * 6)).toBeNull();       // must be held again from the start
      expect(feed('two', HOLD_MS * 6 + 10)).toBeNull();  // a different sign restarts the timer
      expect(feed('two', HOLD_MS * 7 + 10)).toBe('two');
    });
  });
});
