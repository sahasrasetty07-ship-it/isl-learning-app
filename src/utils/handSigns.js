// Pure hand-landmark → sign logic for Sign → Text. No camera or model code in here,
// so `npm run check` can test it under plain Node.

// The only hand shapes the camera recognises: single-hand, static, and told apart by which fingers are up.
// `fingers` is thumb, index, middle, ring, little: 1 = up, 0 = folded, ? = either.
// `word` is what gets added to the sentence. The word meanings for 👍/👎 are drafts, not reviewed by an ISL educator.
export const HAND_SIGNS = [
  { id: 'one', fingers: '?1000', glyph: '૧', word: 'એક', english: 'One', howEn: 'Index finger up', howGu: 'ફક્ત તર્જની ઊભી' },
  { id: 'two', fingers: '?1100', glyph: '૨', word: 'બે', english: 'Two', howEn: 'Index and middle fingers up', howGu: 'તર્જની અને મધ્યમા ઊભી' },
  { id: 'three', fingers: '?1110', glyph: '૩', word: 'ત્રણ', english: 'Three', howEn: 'Index, middle and ring fingers up', howGu: 'તર્જની, મધ્યમા અને અનામિકા ઊભી' },
  { id: 'four', fingers: '01111', glyph: '૪', word: 'ચાર', english: 'Four', howEn: 'Four fingers up, thumb folded in', howGu: 'ચાર આંગળીઓ ઊભી, અંગૂઠો અંદર' },
  { id: 'five', fingers: '11111', glyph: '૫', word: 'પાંચ', english: 'Five', howEn: 'Open hand, all five spread', howGu: 'આખો પંજો ખુલ્લો' },
  { id: 'good', fingers: '10000', thumb: 'up', glyph: '👍', word: 'સારું', english: 'Good', howEn: 'Fist with thumb pointing up', howGu: 'મુઠ્ઠી, અંગૂઠો ઉપર' },
  { id: 'bad', fingers: '10000', thumb: 'down', glyph: '👎', word: 'ખરાબ', english: 'Bad', howEn: 'Fist with thumb pointing down', howGu: 'મુઠ્ઠી, અંગૂઠો નીચે' }
];

// A sign must be held this long before it is added to the sentence
export const HOLD_MS = 1000;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));

// landmarks: the 21 MediaPipe hand points (use worldLandmarks: metric, so the video's aspect ratio does not skew distances).
// Returns the matching HAND_SIGNS entry, or null when the shape is not one of them. Never picks a "closest" sign.
export const classifyHand = (landmarks) => {
  if (!landmarks || landmarks.length < 21) return null;
  const wrist = landmarks[0];
  // A straight finger's tip is well beyond its middle joint as seen from the wrist; a folded one comes back toward the palm
  const fingerUp = (tip, pip) => dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist) * 1.15;
  // The thumb is out when its tip is further from the little-finger knuckle than its own joint is
  const thumbOut = dist(landmarks[4], landmarks[17]) > dist(landmarks[3], landmarks[17]) * 1.1;
  const state = [thumbOut, fingerUp(8, 6), fingerUp(12, 10), fingerUp(16, 14), fingerUp(20, 18)].map(up => (up ? '1' : '0'));

  // Thumb direction (image y grows downward); only clearly vertical counts as up or down
  const dx = landmarks[4].x - landmarks[2].x;
  const dy = landmarks[4].y - landmarks[2].y;
  const thumb = Math.abs(dy) > Math.abs(dx) * 1.5 ? (dy < 0 ? 'up' : 'down') : 'side';

  return HAND_SIGNS.find(sign =>
    [...sign.fingers].every((want, i) => want === '?' || want === state[i]) &&
    (!sign.thumb || sign.thumb === thumb)
  ) || null;
};

// Hold-steady rule as a pure step: feed the sign id seen in each frame (or null).
// `commit` is that id exactly once, when it has been seen without a break for holdMs.
// The hand must then change shape or leave before the same sign can be added again.
export const stepHold = (state, sign, now, holdMs = HOLD_MS) => {
  if (sign !== state.sign) return { state: { sign, since: now, fired: false }, commit: null };
  if (sign && !state.fired && now - state.since >= holdMs) return { state: { ...state, fired: true }, commit: sign };
  return { state, commit: null };
};
