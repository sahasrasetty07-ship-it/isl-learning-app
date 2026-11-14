import { useRef, useState, useEffect, useMemo } from 'react';
import { getStrokeReference } from '../../data/strokeReferences';
import { layoutReference } from '../../utils/strokeMatcher';
import { toGuDigits, prepareCanvas, strokePath, arrowHead, partialPath } from '../../utils/strokeCanvas';

// Clip length scales with stroke count and stays within 5–10 seconds:
// each stroke draws in turn, with a short gap, then the finished letter holds.
export const writeClipTiming = (strokeCount) => {
  const n = Math.max(1, strokeCount);
  const HOLD = 1500, GAP = 250;
  const total = Math.min(10000, Math.max(5000, 2500 * n + 1500));
  return { total, hold: HOLD, gap: GAP, strokeMs: (total - HOLD - GAP * (n - 1)) / n };
};

const COLORS = {
  guide: 'rgba(15, 23, 42, 0.08)',
  done: '#1e293b',
  current: '#f59e0b',
  badge: '#d97706'
};

const renderFrame = (ctx, w, h, paths, t, timing) => {
  ctx.clearRect(0, 0, w, h);
  const width = Math.max(14, Math.min(w, h) * 0.07);

  // Faint outline of the whole character so the student sees where it's going
  ctx.strokeStyle = COLORS.guide;
  ctx.lineWidth = width;
  paths.forEach(p => strokePath(ctx, p));

  paths.forEach((p, i) => {
    const startAt = i * (timing.strokeMs + timing.gap);
    const f = Math.max(0, Math.min(1, (t - startAt) / timing.strokeMs));
    if (t < startAt) return;
    const part = partialPath(p, f);
    const color = f < 1 ? COLORS.current : COLORS.done;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 0.55;
    strokePath(ctx, part);
    if (f < 1) {
      const tip = part[part.length - 1];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, width * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      arrowHead(ctx, part, color, width * 0.9);
    }
  });

  // Stroke number badges appear as each stroke starts (drawn on top)
  paths.forEach((p, i) => {
    const startAt = i * (timing.strokeMs + timing.gap);
    if (t < startAt) return;
    const pop = Math.min(1, (t - startAt) / 220);
    const r = 14 * (0.6 + 0.4 * pop);
    ctx.fillStyle = COLORS.badge;
    ctx.beginPath();
    ctx.arc(p[0].x, p[0].y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(15 * pop)}px "Noto Sans Gujarati", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toGuDigits(i + 1), p[0].x, p[0].y + 1);
  });
};

// Stroke-by-stroke writing animation generated from the writing pad's
// stroke data. Loops; `speed` 1 or 0.5. Calls onCycleComplete each time a
// full play-through finishes. Change `restartKey` to start from the top.
export const HowToWriteClip = ({ text, playing = true, speed = 1, restartKey = 0, onCycleComplete, onProgress }) => {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const clockRef = useRef(0);
  const callbacksRef = useRef({});
  callbacksRef.current = { onCycleComplete, onProgress };
  const [size, setSize] = useState({ w: 0, h: 0 });

  const reference = useMemo(() => getStrokeReference(text), [text]);
  const layout = useMemo(
    () => (reference && size.w ? layoutReference(reference, size.w, size.h, 0.16) : null),
    [reference, size.w, size.h]
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize(prev => (prev.w === Math.round(r.width) && prev.h === Math.round(r.height)
        ? prev : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { clockRef.current = 0; }, [text, restartKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = prepareCanvas(canvas, size.w, size.h);
    const timing = writeClipTiming(layout.paths.length);
    const draw = () => {
      renderFrame(ctx, size.w, size.h, layout.paths, clockRef.current, timing);
      callbacksRef.current.onProgress?.(clockRef.current / timing.total, timing.total);
    };
    if (!playing) { draw(); return; }

    let raf, last = null;
    const frame = (ts) => {
      if (last !== null) {
        clockRef.current += (ts - last) * speed;
        if (clockRef.current >= timing.total) {
          clockRef.current %= timing.total;
          callbacksRef.current.onCycleComplete?.();
        }
      }
      last = ts;
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [layout, playing, speed, size.w, size.h, restartKey]);

  return (
    <div ref={boxRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
    </div>
  );
};
