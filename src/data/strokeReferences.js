// Reference stroke data for handwriting verification.
//
// Each character is a list of strokes in the order they should be written.
// Each stroke is a list of control points [x, y] in a 0–100 design box
// (x to the right, y downwards), listed from where the pen goes down to
// where it lifts — so point order is also the stroke direction. Points are
// smoothed with a Catmull-Rom spline when drawn or compared.
//
// Shapes were traced over the Gujarati MT glyphs. Stroke order follows the
// usual classroom convention (body first, then the vertical stem top to
// bottom) and should be confirmed by a Gujarati teacher before release.

const stem = (x) => [[x, 28], [x, 46], [x, 64], [x + 3, 71], [x + 7, 72], [x + 11, 67]];
const shift = (strokes, dx) => strokes.map(s => s.map(([x, y]) => [x + dx, y]));

const A_BODY = [
  [[25, 32], [30, 28], [37, 29], [41, 36], [39, 44], [33, 49], [27, 50]],
  [[27, 52], [33, 58], [42, 63], [51, 61], [53, 53], [49, 46], [52, 41], [57, 44], [61, 49], [67, 49]]
];

export const STROKE_DATA = {
  // ── Consonants & vowels ────────────────────────────────────────────────
  'ક': [
    [[59, 31], [51, 35], [48, 42], [52, 50], [60, 58], [62, 66], [57, 71], [48, 72], [40, 67]],
    [[39, 57], [52, 51], [65, 46]]
  ],
  'ખ': [
    [[23, 33], [28, 28], [34, 32], [37, 44], [42, 54], [49, 55], [55, 50], [53, 42], [49, 40], [48, 44], [55, 47], [66, 44]],
    stem(66)
  ],
  'ગ': [
    [[31, 33], [36, 28], [44, 28], [49, 35], [50, 45], [47, 55], [40, 60], [33, 57], [29, 46]],
    stem(61)
  ],
  'ઘ': [
    [[45, 30], [38, 31], [33, 38], [35, 45], [42, 49], [50, 48], [41, 51], [36, 57], [41, 64], [51, 65], [61, 59]],
    stem(61)
  ],
  'ચ': [
    [[31, 29], [38, 28], [45, 33], [46, 41], [42, 47], [36, 48], [34, 51], [39, 56], [48, 60], [57, 58], [62, 54]],
    stem(62)
  ],
  'છ': [
    [[42, 31], [35, 34], [31, 41], [34, 48], [44, 52]],
    [[38, 54], [33, 62], [38, 70], [50, 73], [63, 69], [71, 58], [73, 45], [70, 34], [64, 29], [58, 32], [57, 42], [60, 52], [66, 58]]
  ],
  'જ': [
    [[33, 41], [40, 47], [42, 55], [37, 60], [29, 58], [25, 50], [27, 41], [33, 34], [43, 31], [53, 34], [60, 43], [65, 54], [67, 64], [64, 72], [58, 72], [55, 64], [59, 54], [67, 44], [78, 31]]
  ],
  'ઝ': [
    [[33, 41], [37, 36], [45, 36], [52, 41], [56, 50], [55, 59], [49, 66], [40, 69], [32, 64], [29, 56]],
    [[64, 28], [64, 40], [64, 50], [69, 58], [69, 66], [63, 73]]
  ],
  'ટ': [
    [[40, 30], [48, 28], [57, 29], [62, 35], [61, 43], [54, 49], [45, 54], [38, 61], [38, 68], [45, 72], [55, 71], [67, 67]]
  ],
  'ન': [
    [[43, 58], [38, 55], [31, 50], [38, 48], [48, 47], [59, 46]],
    stem(59)
  ],
  'પ': [
    [[29, 33], [33, 28], [38, 30], [40, 38], [40, 50], [44, 57], [52, 57], [61, 53]],
    stem(61)
  ],
  'અ': [...A_BODY, stem(67)],
  'આ': [...shift(A_BODY, -9), stem(57), stem(77)],

  // ── Gujarati digits ────────────────────────────────────────────────────
  '૦': [
    [[50, 32], [40, 34], [35, 44], [38, 56], [50, 61], [62, 57], [66, 46], [62, 36], [50, 32]]
  ],
  '૧': [
    [[58, 45], [52, 47], [46, 44], [44, 37], [48, 30], [55, 29], [60, 35], [61, 45], [61, 60], [62, 70], [66, 72], [70, 68]]
  ],
  '૨': [
    [[41, 33], [48, 29], [57, 30], [63, 37], [61, 46], [54, 52], [46, 56], [44, 60], [50, 62], [57, 68], [63, 72], [69, 72]]
  ],
  '૩': [
    [[39, 30], [47, 28], [56, 30], [61, 37], [59, 44], [51, 49], [58, 52], [63, 60], [61, 68], [52, 72], [42, 70], [34, 63], [29, 56]]
  ],
  '૪': [
    [[29, 28], [37, 32], [45, 40], [51, 50], [54, 60], [52, 69], [48, 72], [45, 67], [47, 57], [54, 48], [62, 40], [70, 31]]
  ],
  '૫': [
    [[29, 33], [33, 28], [38, 31], [40, 40], [40, 52], [43, 58], [50, 59], [57, 55]],
    stem(57)
  ],
  '૬': [
    [[54, 29], [47, 33], [42, 40], [46, 47], [53, 48], [60, 46]],
    [[52, 49], [46, 53], [48, 59], [57, 63], [63, 68], [59, 72], [50, 72]]
  ],
  '૭': [
    [[29, 49], [33, 60], [41, 69], [51, 72], [61, 68], [67, 58], [68, 46], [64, 35], [56, 29], [48, 29], [42, 34], [43, 42], [50, 45], [57, 42], [62, 36]]
  ],
  '૮': [
    [[69, 29], [60, 38], [50, 48], [43, 56], [39, 64], [43, 71], [51, 71], [61, 66]]
  ],
  '૯': [
    [[46, 29], [38, 36], [33, 46], [34, 57], [39, 65], [47, 70], [56, 70], [66, 67]],
    [[71, 38], [62, 44], [52, 50], [45, 53]]
  ]
};

const bboxOf = (strokes) => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  strokes.forEach(s => s.forEach(([x, y]) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }));
  return { minX, maxX, minY, maxY };
};

// Returns the reference strokes for a whole target (a letter, a digit, or a
// run of digits like '૧૦' laid out left to right), or null if any character
// has no stroke data yet.
export const getStrokeReference = (text) => {
  const chars = Array.from(text || '');
  if (!chars.length || chars.some(c => !STROKE_DATA[c])) return null;
  if (chars.length === 1) return STROKE_DATA[chars[0]];

  const GAP = 8;
  const out = [];
  let cursor = 0;
  chars.forEach(c => {
    const strokes = STROKE_DATA[c];
    const { minX, maxX } = bboxOf(strokes);
    out.push(...shift(strokes, cursor - minX));
    cursor += (maxX - minX) + GAP;
  });
  return out;
};

export const hasStrokeReference = (text) => getStrokeReference(text) !== null;
