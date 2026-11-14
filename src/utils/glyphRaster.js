// Font-based guide drawing and pixel-overlap scoring.
// Used by the writing pad only for targets that have no reference stroke
// data yet (e.g. long science words), where stroke checking isn't possible.

const CELL = 8; // grid cell size in CSS px used for scoring
const GUIDE_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Gujarati", "Gujarati Sangam MN", sans-serif';

// Marks a grid cell "on" if any pixel inside it is drawn (alpha > 0).
const toGrid = (img, scale, cols, rows) => {
  const grid = new Uint8Array(cols * rows);
  const step = CELL * scale;
  for (let y = 0; y < img.height; y += 2) {
    for (let x = 0; x < img.width; x += 2) {
      if (img.data[(y * img.width + x) * 4 + 3] > 0) {
        grid[Math.floor(y / step) * cols + Math.floor(x / step)] = 1;
      }
    }
  }
  return grid;
};

// Score 0-100: geometric mean of precision (ink that lies on the letter)
// and coverage (letter that got inked), with a 2-cell tolerance for both.
export const scoreGrids = (ink, target, cols, rows, tol = 2) => {
  const near = (grid, i) => {
    const cx = i % cols, cy = Math.floor(i / cols);
    for (let dy = -tol; dy <= tol; dy++) {
      for (let dx = -tol; dx <= tol; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && y >= 0 && x < cols && y < rows && grid[y * cols + x]) return true;
      }
    }
    return false;
  };
  let inkCount = 0, inkOnLetter = 0, targetCount = 0, targetCovered = 0;
  for (let i = 0; i < ink.length; i++) {
    if (ink[i]) { inkCount++; if (near(target, i)) inkOnLetter++; }
    if (target[i]) { targetCount++; if (near(ink, i)) targetCovered++; }
  }
  if (!inkCount || !targetCount) return 0;
  return Math.round(100 * Math.sqrt((inkOnLetter / inkCount) * (targetCovered / targetCount)));
};

// Computes appropriate font size based on text length and canvas dimensions
const getGuideFontSize = (rectHeight, text) => {
  if (!text) return 120;
  const len = text.length;
  let baseSize;
  if (len <= 1) baseSize = Math.min(rectHeight * 0.68, 175);
  else if (len === 2) baseSize = Math.min(rectHeight * 0.60, 135);
  else if (len <= 4) baseSize = Math.min(rectHeight * 0.45, 90);
  else if (len <= 7) baseSize = Math.min(rectHeight * 0.38, 65);
  else baseSize = Math.min(rectHeight * 0.28, 48); // longer words like પ્રકાશસંશ્લેષણ
  return Math.max(22, Math.round(baseSize));
};

// Font for the guide text, shrunk so it never clips off the canvas.
const guideFont = (ctx, width, height, text) => {
  let fontSize = getGuideFontSize(height, text);
  ctx.font = `bold ${fontSize}px ${GUIDE_FONT}`;
  const textWidth = ctx.measureText(text).width;
  const maxWidth = width - 40;
  if (textWidth > maxWidth && textWidth > 0) {
    fontSize = Math.max(20, Math.floor(fontSize * (maxWidth / textWidth)));
  }
  return `bold ${fontSize}px ${GUIDE_FONT}`;
};

// Draws the target text centred; ctx must already be scaled to CSS px.
export const drawTextGuide = (ctx, width, height, text, fillStyle) => {
  ctx.save();
  ctx.font = guideFont(ctx, width, height, text);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, width / 2, height / 2);
  ctx.restore();
};

// Pixel-overlap score of the ink canvas against the target text drawn the
// same way as the on-screen guide. `scale` = device pixels per CSS px.
export const pixelScore = (inkCanvas, width, height, scale, text) => {
  const cols = Math.ceil(width / CELL), rows = Math.ceil(height / CELL);
  const ink = toGrid(inkCanvas.getContext('2d').getImageData(0, 0, inkCanvas.width, inkCanvas.height), scale, cols, rows);
  const ref = document.createElement('canvas');
  ref.width = inkCanvas.width;
  ref.height = inkCanvas.height;
  const rctx = ref.getContext('2d');
  rctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawTextGuide(rctx, width, height, text, '#000');
  const target = toGrid(rctx.getImageData(0, 0, ref.width, ref.height), scale, cols, rows);
  return scoreGrids(ink, target, cols, rows);
};
