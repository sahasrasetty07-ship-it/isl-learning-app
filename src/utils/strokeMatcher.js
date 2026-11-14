// On-device stroke verification for the handwriting pad.
//
// Approach: per-stroke geometric template matching (no network, no model
// download). Every stroke — the student's and the reference — is resampled
// to N evenly spaced points. The whole character is normalised together
// (centred and scaled to a unit box, aspect ratio kept), so writing bigger,
// smaller or off-centre is not an error, but where each stroke sits relative
// to the others still matters. Then:
//   • count     — student strokes vs reference strokes
//   • order     — best one-to-one pairing of student→reference strokes by
//                 shape; if that pairing is not 1→1, 2→2, … the order is wrong
//   • direction — a paired stroke fits the reversed reference much better
//                 than the forward one
//   • shape     — mean point distance between paired strokes, mapped to 0–100
//   • guide     — (guided mode) share of each stroke's raw points that lie
//                 inside the drawn guide path on screen

export const RESAMPLE_N = 32;
export const DEFAULT_THRESHOLD = 85;
// A distance of this much (in unit-box units) scores 0; 0 scores 100.
const SHAPE_ZERO_AT = 0.5;
// Weight of the heading-difference term in the shape distance.
const TANGENT_WEIGHT = 0.15;
// A stroke is "reversed" when the backwards fit is this much better.
const REVERSE_RATIO = 0.6;
// Order is only called wrong if the in-order pairing is clearly worse.
const ORDER_MARGIN = 0.03;
// Each stroke may sit this far below the overall threshold and still pass.
const STROKE_SLACK = 10;
// Guided mode: share of stroke points that must lie inside the guide path.
const GUIDE_MIN_INSIDE = 0.8;

export const ERROR_TYPES = ['missing', 'extra', 'order', 'direction', 'shape', 'outside'];

// ── Geometry helpers ─────────────────────────────────────────────────────

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toPt = (p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y });

// Catmull-Rom spline through control points; returns a dense polyline.
export const smoothStroke = (controlPoints, stepsPerSegment = 8) => {
  const pts = controlPoints.map(toPt);
  if (pts.length < 3) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const pathLength = (pts) => {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
};

// Resample a polyline to n points evenly spaced along its length.
export const resample = (points, n = RESAMPLE_N) => {
  const pts = points.map(toPt);
  if (pts.length === 0) return [];
  const total = pathLength(pts);
  if (pts.length === 1 || total === 0) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const interval = total / (n - 1);
  const out = [{ ...pts[0] }];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let prev = pts[i - 1];
    let d = dist(prev, pts[i]);
    while (acc + d >= interval && out.length < n) {
      const t = (interval - acc) / d;
      const q = { x: prev.x + t * (pts[i].x - prev.x), y: prev.y + t * (pts[i].y - prev.y) };
      out.push(q);
      d -= interval - acc;
      prev = q;
      acc = 0;
    }
    acc += d;
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out;
};

const bbox = (strokes) => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  strokes.forEach(s => s.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }));
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
};

// Centre the whole character on its bounding box and scale its longer side
// to 1. All strokes share one transform so their relative layout is kept.
const normaliseCharacter = (strokes) => {
  const b = bbox(strokes);
  const size = Math.max(b.w, b.h) || 1;
  const cx = b.minX + b.w / 2, cy = b.minY + b.h / 2;
  return strokes.map(s => s.map(p => ({ x: (p.x - cx) / size, y: (p.y - cy) / size })));
};

// Shape distance between two resampled strokes: mean point distance plus a
// term for how differently the pen is heading at each point, which catches
// small but telling features (a knob, a hook) that point distance alone
// underweights.
const meanDist = (a, b) => {
  let sum = 0, turn = 0;
  for (let i = 0; i < a.length; i++) sum += dist(a[i], b[i]);
  for (let i = 1; i < a.length; i++) {
    const ax = a[i].x - a[i - 1].x, ay = a[i].y - a[i - 1].y;
    const bx = b[i].x - b[i - 1].x, by = b[i].y - b[i - 1].y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la && lb) turn += (1 - (ax * bx + ay * by) / (la * lb)) / 2;
  }
  return sum / a.length + TANGENT_WEIGHT * turn / (a.length - 1);
};

const shapeScore = (d) => Math.max(0, Math.round(100 * (1 - d / SHAPE_ZERO_AT)));

// Minimum-cost one-to-one pairing of student strokes to reference strokes
// (bitmask DP; fine for the ≤ ~12 strokes a character or short number has).
// Returns pairs[i] = reference index for student stroke i, or -1 if unpaired.
const bestPairing = (cost, nStudent, nRef) => {
  const k = Math.min(nStudent, nRef);
  // Choose which student strokes take part when there are extras.
  const studentSets = [];
  const choose = (start, picked) => {
    if (picked.length === k) { studentSets.push([...picked]); return; }
    for (let i = start; i < nStudent; i++) { picked.push(i); choose(i + 1, picked); picked.pop(); }
  };
  if (nStudent > nRef) choose(0, []); else studentSets.push([...Array(nStudent).keys()]);

  let best = { total: Infinity, pairs: null };
  studentSets.forEach(set => {
    const memo = new Map();
    const solve = (i, used) => {
      if (i === set.length) return { total: 0, picks: [] };
      const key = i * (1 << nRef) + used;
      if (memo.has(key)) return memo.get(key);
      let res = { total: Infinity, picks: null };
      for (let r = 0; r < nRef; r++) {
        if (used & (1 << r)) continue;
        const sub = solve(i + 1, used | (1 << r));
        const total = cost[set[i]][r] + sub.total;
        if (total < res.total) res = { total, picks: [r, ...sub.picks] };
      }
      memo.set(key, res);
      return res;
    };
    const { total, picks } = solve(0, 0);
    if (total < best.total) {
      const pairs = Array(nStudent).fill(-1);
      set.forEach((s, j) => { pairs[s] = picks[j]; });
      best = { total, pairs };
    }
  });
  return best.pairs;
};

// Share of raw points lying within `radius` of the reference path.
const insideShare = (rawStroke, refPath, radius) => {
  if (!rawStroke.length) return 0;
  let inside = 0;
  rawStroke.forEach(p => {
    for (let i = 0; i < refPath.length; i++) {
      if (dist(p, refPath[i]) <= radius) { inside++; break; }
    }
  });
  return inside / rawStroke.length;
};

// ── Main entry ───────────────────────────────────────────────────────────

/**
 * @param studentStrokes  [[{x, y, t}, …], …] in canvas pixels, in drawing order
 * @param referenceStrokes [[[x, y], …], …] control points (0–100 design box)
 * @param options.mode     'guided' | 'freehand'
 * @param options.threshold pass mark 0–100 (default 85)
 * @param options.guide    guided mode only: { strokes: reference paths already
 *                         placed in canvas pixels, radius: guide half-width }
 * @returns { passed, score, error, wrongStroke, refStroke, strokes: [...] }
 *   error: null | 'missing' | 'extra' | 'order' | 'direction' | 'shape' | 'outside'
 *   wrongStroke: student stroke index to highlight (null for 'missing')
 *   refStroke:   reference stroke index to replay as the correct one
 */
export const verifyStrokes = (studentStrokes, referenceStrokes, options = {}) => {
  const { mode = 'guided', threshold = DEFAULT_THRESHOLD, guide = null } = options;
  const checkDirection = mode === 'guided';
  const strokeFloor = Math.max(0, threshold - STROKE_SLACK);

  const student = studentStrokes.filter(s => s.length > 0);
  const nS = student.length;
  const nR = referenceStrokes.length;
  if (nS === 0) {
    return { passed: false, score: 0, error: 'missing', wrongStroke: null, refStroke: 0, strokes: [] };
  }
  // Far too many strokes (scribbling): don't search pairings, just flag the first extra.
  if (nS > nR + 6) {
    return { passed: false, score: 0, error: 'extra', wrongStroke: nR, refStroke: null, strokes: [] };
  }

  const refNorm = normaliseCharacter(referenceStrokes.map(s => resample(smoothStroke(s))));
  const stuNorm = normaliseCharacter(student.map(s => resample(s)));

  // Cost of pairing student i with reference j, ignoring direction.
  const fwd = [], rev = [], cost = [];
  for (let i = 0; i < nS; i++) {
    fwd.push([]); rev.push([]); cost.push([]);
    for (let j = 0; j < nR; j++) {
      const f = meanDist(stuNorm[i], refNorm[j]);
      const r = meanDist(stuNorm[i], [...refNorm[j]].reverse());
      fwd[i].push(f); rev[i].push(r); cost[i].push(Math.min(f, r));
    }
  }

  const pairs = bestPairing(cost, nS, nR);

  // Per-stroke results, in the order the student drew them.
  const strokes = student.map((_, i) => {
    const j = pairs[i];
    if (j === -1) return { index: i, ref: -1, score: 0, reversed: false, inOrder: false, inside: 1 };
    const reversed = checkDirection && rev[i][j] < fwd[i][j] * REVERSE_RATIO;
    const d = checkDirection ? fwd[i][j] : cost[i][j];
    return { index: i, ref: j, score: shapeScore(d), reversed, inOrder: true, inside: 1 };
  });

  // Order: compare the shape-optimal pairing with the in-order pairing.
  let orderWrongAt = -1;
  if (nS === nR) {
    const optimal = pairs.reduce((s, j, i) => s + cost[i][j], 0);
    const inOrder = pairs.reduce((s, _, i) => s + cost[i][i], 0);
    const firstOff = pairs.findIndex((j, i) => j !== i);
    if (firstOff !== -1 && inOrder - optimal > ORDER_MARGIN * nS) {
      orderWrongAt = firstOff;
      strokes.forEach(s => { if (s.ref !== s.index) s.inOrder = false; });
    }
  } else {
    // With missing or extra strokes, still flag a paired stroke drawn out of turn.
    const paired = strokes.filter(s => s.ref !== -1);
    for (let k = 1; k < paired.length; k++) {
      if (paired[k].ref < paired[k - 1].ref) { paired[k].inOrder = false; if (orderWrongAt === -1) orderWrongAt = paired[k].index; }
    }
  }

  // Guided mode: strokes must stay inside the guide drawn on screen.
  if (mode === 'guided' && guide) {
    strokes.forEach(s => {
      if (s.ref === -1) return;
      s.inside = insideShare(student[s.index], guide.strokes[s.ref], guide.radius);
    });
  }

  strokes.forEach(s => {
    s.passed = s.ref !== -1 && s.inOrder && !s.reversed && s.score >= strokeFloor
      && (mode !== 'guided' || !guide || s.inside >= GUIDE_MIN_INSIDE);
  });

  // Overall score: mean shape score over every reference stroke (a missing
  // stroke counts as 0), minus 10 for each extra stroke. A stroke drawn out
  // of order, backwards or outside the guide counts half, so the number the
  // student sees agrees with the verdict.
  const refScores = Array(nR).fill(0);
  strokes.forEach(s => {
    if (s.ref === -1) return;
    const ruleBroken = !s.inOrder || s.reversed || (mode === 'guided' && guide && s.inside < GUIDE_MIN_INSIDE);
    refScores[s.ref] = ruleBroken ? Math.round(s.score / 2) : s.score;
  });
  const extras = strokes.filter(s => s.ref === -1).length;
  const score = Math.max(0, Math.round(refScores.reduce((a, b) => a + b, 0) / nR) - 10 * extras);

  // Report the single most important problem.
  const missingRef = refScores.findIndex((_, j) => !pairs.includes(j));
  let error = null, wrongStroke = null, refStroke = null;
  if (nS < nR) {
    error = 'missing'; refStroke = missingRef;
  } else if (nS > nR) {
    error = 'extra'; wrongStroke = strokes.find(s => s.ref === -1).index;
  } else if (orderWrongAt !== -1) {
    error = 'order'; wrongStroke = orderWrongAt; refStroke = orderWrongAt;
  } else if (strokes.some(s => s.reversed)) {
    const s = strokes.find(st => st.reversed);
    error = 'direction'; wrongStroke = s.index; refStroke = s.ref;
  } else {
    const worstShape = strokes.reduce((a, b) => (b.score < a.score ? b : a));
    const outside = strokes.filter(s => s.inside < GUIDE_MIN_INSIDE).sort((a, b) => a.inside - b.inside)[0];
    if (outside) {
      error = 'outside'; wrongStroke = outside.index; refStroke = outside.ref;
    } else if (worstShape.score < strokeFloor || score < threshold) {
      error = 'shape'; wrongStroke = worstShape.index; refStroke = worstShape.ref;
    }
  }

  const passed = error === null && score >= threshold && strokes.every(s => s.passed);
  return { passed, score, error, wrongStroke, refStroke, strokes };
};

// Maps reference control points (0–100 design box) onto a canvas of the
// given CSS size, keeping aspect ratio and centring the character. Returns
// the dense smoothed paths plus the transform used, so the guide drawn on
// screen and the guide used for checking are the same geometry.
export const layoutReference = (referenceStrokes, width, height, padding = 0.14) => {
  const paths = referenceStrokes.map(s => smoothStroke(s, 12));
  const b = bbox(paths);
  const availW = width * (1 - 2 * padding), availH = height * (1 - 2 * padding);
  const scale = Math.min(availW / (b.w || 1), availH / (b.h || 1));
  const ox = (width - b.w * scale) / 2 - b.minX * scale;
  const oy = (height - b.h * scale) / 2 - b.minY * scale;
  return {
    scale,
    paths: paths.map(p => p.map(q => ({ x: q.x * scale + ox, y: q.y * scale + oy })))
  };
};

// Places the reference over the student's own writing (same centre and size
// as their whole character), so a correct stroke can be replayed on top of
// what they drew even in freehand mode, where they may write anywhere.
export const fitReferenceTo = (referenceStrokes, studentStrokes) => {
  const paths = referenceStrokes.map(s => smoothStroke(s, 12));
  const rb = bbox(paths);
  const sb = bbox(studentStrokes.map(s => s.map(toPt)));
  const scale = Math.max(sb.w, sb.h) / (Math.max(rb.w, rb.h) || 1);
  const rcx = rb.minX + rb.w / 2, rcy = rb.minY + rb.h / 2;
  const scx = sb.minX + sb.w / 2, scy = sb.minY + sb.h / 2;
  return paths.map(p => p.map(q => ({ x: (q.x - rcx) * scale + scx, y: (q.y - rcy) * scale + scy })));
};
