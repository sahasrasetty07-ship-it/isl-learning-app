// Canvas helpers shared by the writing pad and the "How to write" clip.

export const GU_DIGITS = '૦૧૨૩૪૫૬૭૮૯';
export const toGuDigits = (n) => String(n).replace(/\d/g, d => GU_DIGITS[d]);

export const prepareCanvas = (canvas, w, h) => {
  const r = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * r);
  canvas.height = Math.round(h * r);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(r, 0, 0, r, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
};

export const strokePath = (ctx, pts) => {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
};

export const arrowHead = (ctx, pts, color, size) => {
  if (pts.length < 2) return;
  const a = pts[pts.length - 1];
  const b = pts[Math.max(0, pts.length - 4)];
  const ang = Math.atan2(a.y - b.y, a.x - b.x);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x + Math.cos(ang) * size * 0.7, a.y + Math.sin(ang) * size * 0.7);
  ctx.lineTo(a.x + Math.cos(ang + 2.4) * size, a.y + Math.sin(ang + 2.4) * size);
  ctx.lineTo(a.x + Math.cos(ang - 2.4) * size, a.y + Math.sin(ang - 2.4) * size);
  ctx.closePath();
  ctx.fill();
};

// First fraction f (0–1) of a polyline, by length.
export const partialPath = (pts, f) => {
  if (f >= 1 || pts.length < 2) return pts;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let left = total * f;
  const out = [pts[0]];
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= left) { out.push(pts[i]); left -= d; } else {
      const t = left / d;
      out.push({ x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y) });
      left = 0;
    }
  }
  return out;
};

// Animates reference paths one after another on an overlay canvas.
// `drawBase` repaints anything that should stay underneath each frame.
// Returns a cancel function.
export const animatePaths = (ctx, w, h, paths, { color, width, drawBase, loops = 2, onDone }) => {
  const PER_STROKE = 900, PAUSE = 450;
  const cycle = paths.length * PER_STROKE + PAUSE;
  let raf, start = null;
  const frame = (ts) => {
    if (start === null) start = ts;
    const elapsed = ts - start;
    const done = elapsed >= cycle * loops;
    const tInCycle = done ? cycle : elapsed % cycle;
    ctx.clearRect(0, 0, w, h);
    drawBase?.();
    paths.forEach((p, i) => {
      const f = Math.max(0, Math.min(1, (tInCycle - i * PER_STROKE) / PER_STROKE));
      if (f <= 0) return;
      const part = partialPath(p, f);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([]);
      strokePath(ctx, part);
      const tip = part[part.length - 1];
      if (f < 1) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, width * 0.95, 0, Math.PI * 2);
        ctx.fill();
      } else {
        arrowHead(ctx, part, color, width * 2.2);
      }
    });
    if (done) { onDone?.(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
};
