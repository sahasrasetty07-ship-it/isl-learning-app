import { useRef, useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getStrokeReference } from '../../data/strokeReferences';
import { verifyStrokes, layoutReference, fitReferenceTo } from '../../utils/strokeMatcher';
import { drawTextGuide, pixelScore } from '../../utils/glyphRaster';
import { WRITING_ERRORS } from '../../utils/writingFeedback';
import { toGuDigits, prepareCanvas, strokePath, arrowHead, animatePaths } from '../../utils/strokeCanvas';
import {
  RotateCcw,
  Undo2,
  Volume2,
  Video,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Layers,
  BookOpen,
  Pencil,
  Star,
  Loader2,
  ArrowRight,
  PenLine,
  Smile,
  ChevronDown,
  X
} from 'lucide-react';

const INK_WIDTH = 7;
const PEN_COLORS = ['#1E1B4B', '#2563EB', '#15803D'];
const PEN_NAMES = { '#1E1B4B': ['Dark blue', 'ઘેરો વાદળી'], '#2563EB': ['Blue', 'વાદળી'], '#15803D': ['Green', 'લીલો'] };
const C = {
  guide: 'rgba(30, 27, 75, 0.13)',
  guideMark: '#C2410C',
  wrong: '#BE185D',
  correct: '#15803D'
};
// Minimum time the "Checking…" state stays visible, so it registers.
const CHECKING_MS = 550;

// ─────────────────────────────────────────────────────────────────────────────
// WritingPad Component
// ─────────────────────────────────────────────────────────────────────────────
export const WritingPad = ({
  targetLetter = 'ક',
  targetWord = 'કમળ',
  letterMeaning = '',
  onSignClick = null,
  subject = 'gujarati',
  // Navigation props (optional — omit to hide the prev/next bar)
  currentIndex = null,
  totalItems = null,
  onPrevious = null,
  onNext = null,
  hasPrevious = false,
  hasNext = false,
  traceGuide = '',
  // Optional: opens a lesson clip ('write' | 'say') so it can be replayed after a mistake
  onOpenClip = null
}) => {
  const { speakText, recordWritingAttempt, writingThreshold, showToast, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const boxRef = useRef(null);
  const guideCanvasRef = useRef(null);
  const inkCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const activeStrokeRef = useRef(null);
  const checkTimerRef = useRef(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [strokes, setStrokes] = useState([]); // [{ points: [{x, y, t}], color }]
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [practiceMode, setPracticeMode] = useState('guided'); // 'guided' | 'freehand'
  const [showRuling, setShowRuling] = useState(true);
  const [showStrokePanel, setShowStrokePanel] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'checking' | 'pass' | 'fail'
  const [result, setResult] = useState(null);
  const [replayKey, setReplayKey] = useState(0);

  const reference = useMemo(() => getStrokeReference(targetLetter), [targetLetter]);
  const hasStrokeData = reference !== null;
  const showGuide = practiceMode === 'guided';
  const locked = phase !== 'idle';

  const layout = useMemo(
    () => (reference && size.w ? layoutReference(reference, size.w, size.h) : null),
    [reference, size.w, size.h]
  );
  const guideWidth = Math.max(16, Math.min(size.w, size.h) * 0.075);
  // Layout follows the pad's own width (not the window), so it is right
  // inside the phone simulator as well as on real phones and tablets.
  const wide = size.w >= 520;

  // ── Track canvas box size ──────────────────────────────────────────────
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

  // ── Reset when the target changes ──────────────────────────────────────
  const resetAttempt = () => {
    clearTimeout(checkTimerRef.current);
    activeStrokeRef.current = null;
    setStrokes([]);
    setResult(null);
    setPhase('idle');
  };
  useEffect(() => {
    resetAttempt();
    setShowStrokePanel(false);
    setDemoPlaying(false);
  }, [targetLetter]);
  useEffect(() => () => clearTimeout(checkTimerRef.current), []);

  // ── Guide layer ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = guideCanvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = prepareCanvas(canvas, size.w, size.h);
    if (!layout) {
      drawTextGuide(ctx, size.w, size.h, targetLetter, 'rgba(71, 85, 105, 0.22)');
      return;
    }
    ctx.strokeStyle = C.guide;
    ctx.lineWidth = guideWidth;
    layout.paths.forEach(p => strokePath(ctx, p));
    // Numbered start dots and end arrows teach stroke order and direction
    layout.paths.forEach((p, i) => {
      arrowHead(ctx, p, 'rgba(194, 65, 12, 0.55)', 11);
      ctx.fillStyle = C.guideMark;
      ctx.beginPath();
      ctx.arc(p[0].x, p[0].y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 13px "Mukta Vaani", "Noto Sans Gujarati", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(toGuDigits(i + 1), p[0].x, p[0].y + 1);
    });
  }, [layout, size.w, size.h, targetLetter, guideWidth]);

  // ── Ink layer: always redrawn from the recorded strokes ────────────────
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = prepareCanvas(canvas, size.w, size.h);
    ctx.lineWidth = INK_WIDTH;
    strokes.forEach(s => { ctx.strokeStyle = s.color; strokePath(ctx, s.points); });
  }, [strokes, size.w, size.h]);

  // Reference paths placed where the feedback should be drawn
  const feedbackPaths = useMemo(() => {
    if (!reference || !result) return null;
    if (practiceMode === 'guided' && layout) return layout.paths;
    return strokes.length ? fitReferenceTo(reference, strokes.map(s => s.points)) : layout?.paths;
  }, [reference, result, practiceMode, layout, strokes]);

  // ── Feedback overlay: wrong stroke + animated correct stroke ───────────
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = prepareCanvas(canvas, size.w, size.h);
    if (phase !== 'fail' || !result || !feedbackPaths) return;

    const wrong = result.wrongStroke !== null ? strokes[result.wrongStroke] : null;
    const drawWrong = () => {
      if (!wrong) return;
      // White halo + dashed magenta: readable on any pen colour, and the
      // dash pattern distinguishes it without relying on colour alone.
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = INK_WIDTH + 8;
      strokePath(ctx, wrong.points);
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = C.wrong;
      ctx.lineWidth = INK_WIDTH + 3;
      strokePath(ctx, wrong.points);
      ctx.setLineDash([]);
    };
    if (result.refStroke === null || !feedbackPaths[result.refStroke]) { drawWrong(); return; }
    return animatePaths(ctx, size.w, size.h, [feedbackPaths[result.refStroke]], {
      color: C.correct, width: INK_WIDTH, drawBase: drawWrong, loops: 3
    });
  }, [phase, result, feedbackPaths, strokes, size.w, size.h, replayKey]);

  // ── Stroke-order demo (uses the same reference data) ───────────────────
  useEffect(() => {
    if (!demoPlaying || !layout || locked) return;
    const canvas = overlayCanvasRef.current;
    const ctx = prepareCanvas(canvas, size.w, size.h);
    const cancel = animatePaths(ctx, size.w, size.h, layout.paths, {
      color: C.guideMark, width: INK_WIDTH, loops: 1, onDone: () => setDemoPlaying(false)
    });
    return () => { cancel(); ctx.clearRect(0, 0, size.w, size.h); };
  }, [demoPlaying, layout, locked, size.w, size.h]);

  // ── Pointer input → strokes with timestamps ────────────────────────────
  const pointFrom = (e) => {
    const r = inkCanvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: Math.round(e.timeStamp) };
  };

  const handlePointerDown = (e) => {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDemoPlaying(false);
    const p = pointFrom(e);
    activeStrokeRef.current = { id: e.pointerId, points: [p], color: penColor };
    const ctx = inkCanvasRef.current.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = INK_WIDTH;
    strokePath(ctx, [p]);
  };

  const handlePointerMove = (e) => {
    const s = activeStrokeRef.current;
    if (!s || s.id !== e.pointerId) return;
    e.preventDefault();
    const p = pointFrom(e);
    const last = s.points[s.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return;
    s.points.push(p);
    const ctx = inkCanvasRef.current.getContext('2d');
    ctx.strokeStyle = s.color;
    ctx.lineWidth = INK_WIDTH;
    strokePath(ctx, [last, p]);
  };

  const handlePointerUp = (e) => {
    const s = activeStrokeRef.current;
    if (!s || s.id !== e.pointerId) return;
    activeStrokeRef.current = null;
    setStrokes(prev => [...prev, { points: s.points, color: s.color }]);
  };

  const handleUndo = () => setStrokes(prev => prev.slice(0, -1));

  // ── Verification ───────────────────────────────────────────────────────
  const evaluateWriting = () => {
    if (locked) return;
    if (strokes.length === 0) {
      showToast(isEn ? 'Write the character on the pad first.' : 'પહેલા પેડ પર અક્ષર લખો.', 'info');
      return;
    }
    setDemoPlaying(false);
    setPhase('checking');
    const started = performance.now();

    // Let the "Checking…" state paint before the (fast) comparison runs.
    checkTimerRef.current = setTimeout(() => {
      let res;
      if (reference && layout) {
        res = verifyStrokes(strokes.map(s => s.points), reference, {
          mode: practiceMode,
          threshold: writingThreshold,
          guide: practiceMode === 'guided' ? { strokes: layout.paths, radius: guideWidth / 2 + 10 } : null
        });
      } else {
        // No stroke data for this target yet: shape check only.
        const canvas = inkCanvasRef.current;
        const score = pixelScore(canvas, size.w, size.h, canvas.width / size.w, targetLetter);
        const passed = score >= writingThreshold;
        res = { passed, score, error: passed ? null : 'shape', wrongStroke: null, refStroke: null };
      }
      const award = recordWritingAttempt({
        subject, character: targetLetter, score: res.score, error: res.error, passed: res.passed, mode: practiceMode
      });
      const show = () => {
        setResult({ ...res, ...award });
        setPhase(res.passed ? 'pass' : 'fail');
        if (res.passed) speakText(targetLetter); // optional audio aid, never the only signal
      };
      const wait = CHECKING_MS - (performance.now() - started);
      checkTimerRef.current = setTimeout(show, Math.max(0, wait));
    }, 30);
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  const handlePrevious = () => { if (hasPrevious && onPrevious) onPrevious(); };
  const handleNext = () => { if (hasNext && onNext) onNext(); };

  // Notebook ruling — CSS only, never sampled by any canvas
  const rulingStyle = showRuling ? {
    backgroundImage: [
      'linear-gradient(90deg, transparent calc(12% - 1px), rgba(194,65,12,0.22) calc(12% - 1px), rgba(194,65,12,0.22) 12%, transparent 12%)',
      'repeating-linear-gradient(180deg, transparent, transparent 35px, rgba(30,27,75,0.10) 35px, rgba(30,27,75,0.10) 36px)'
    ].join(', ')
  } : {};

  const hasNavigation = currentIndex !== null && totalItems !== null;
  const err = result?.error ? WRITING_ERRORS[result.error] : null;
  const strokeNo = result && (result.refStroke ?? result.wrongStroke);
  const padBorder = phase === 'pass' ? 'border-pad-pass border-solid'
    : phase === 'fail' ? 'border-pad-wrong border-solid' : 'border-ink-muted/50 border-dashed';

  return (
    <div className="bg-surface text-ink font-mukta rounded-2xl border border-line p-3 sm:p-4 flex flex-col gap-3">

      {/* ── Prev / Next ────────────────────────────────────────────────── */}
      {hasNavigation && (
        <div className="flex items-center justify-between bg-canvas rounded-xl px-1.5 py-1 border border-line">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-1 min-h-tap px-3 rounded-lg text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed text-ink hover:bg-surface active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isEn ? 'Prev' : 'પહેલા'}</span>
          </button>
          <span className="text-sm font-bold tabular-nums select-none">{currentIndex + 1} / {totalItems}</span>
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="flex items-center gap-1 min-h-tap px-3 rounded-lg text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed text-ink hover:bg-surface active:scale-95"
          >
            <span>{isEn ? 'Next' : 'આગળ'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Target header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 bg-canvas p-3 rounded-xl border border-line">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-pad-saffron text-white flex items-center justify-center font-baloo font-bold text-3xl leading-none pt-1">
            {Array.from(targetLetter).length > 2 ? Array.from(targetLetter)[0] : targetLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-baloo text-xl font-bold leading-tight truncate">{targetWord}</h3>
              <button
                onClick={() => speakText(`${targetLetter} એટલે ${targetWord}`)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-action-soft text-pad-saffron hover:bg-line transition shrink-0"
                title={isEn ? 'Listen to pronunciation' : 'અવાજ સાંભળો'}
                aria-label={isEn ? 'Listen to pronunciation' : 'અવાજ સાંભળો'}
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-ink-muted truncate">
              {letterMeaning || (isEn ? 'Tracing & handwriting practice' : 'અક્ષર મહાવરો અને લેખન')}
            </p>
          </div>
        </div>
        {onSignClick && (
          <button
            onClick={onSignClick}
            className="flex items-center gap-1.5 min-h-tap px-3 rounded-xl bg-surface border border-line text-ink hover:bg-canvas text-sm font-semibold transition shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>{isEn ? 'Watch Sign' : 'સાઇન જુઓ'}</span>
          </button>
        )}
      </div>

      {/* ── Practice mode ──────────────────────────────────────────────── */}
      <div className="flex items-center bg-line/60 p-1 rounded-xl gap-1" role="tablist">
        {[
          { id: 'guided', icon: BookOpen, en: 'Guided Practice', gu: 'માર્ગદર્શિત' },
          { id: 'freehand', icon: Pencil, en: 'Freehand Practice', gu: 'સ્વતંત્ર' }
        ].map(m => (
          <button
            key={m.id}
            role="tab"
            aria-selected={practiceMode === m.id}
            disabled={locked}
            onClick={() => { setPracticeMode(m.id); resetAttempt(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-tap rounded-lg text-sm transition disabled:opacity-60 ${
              practiceMode === m.id ? 'bg-ink text-white font-bold' : 'text-ink-muted font-medium hover:text-ink'
            }`}
          >
            <m.icon className="w-4 h-4" />
            <span>{isEn ? m.en : m.gu}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-ink-muted -mt-1 px-1">
        {practiceMode === 'guided'
          ? (isEn ? 'Trace over the grey letter. Start at ① and follow the arrows.' : 'ઝાંખા અક્ષર પર ઘૂંટો. ૧ થી શરૂ કરી તીર પ્રમાણે લખો.')
          : (isEn ? 'The guide is hidden. Write the letter from memory, anywhere on the pad.' : 'માર્ગદર્શક છુપાવ્યો છે. યાદ રાખીને પેડ પર ક્યાંય પણ લખો.')}
      </p>

      {/* ── Stroke-order guide (collapsible) ───────────────────────────── */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <button
          onClick={() => setShowStrokePanel(prev => !prev)}
          aria-expanded={showStrokePanel}
          className="w-full flex items-center justify-between px-3 min-h-tap hover:bg-canvas transition text-sm font-bold"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            {isEn ? 'Stroke Order Guide' : 'રેખાનો ક્રમ'}
            {hasStrokeData && (
              <span className="text-xs font-medium text-ink-muted">
                · {isEn ? `${reference.length} strokes` : `${toGuDigits(reference.length)} રેખા`}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${showStrokePanel ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {showStrokePanel && (
          <div className="p-3 space-y-3 border-t border-line">
            {traceGuide && (
              <div className="bg-action-soft rounded-lg px-3 py-2">
                <p className="text-xs font-bold text-pad-saffron-dark mb-0.5">{isEn ? 'Writing tip:' : 'લેખન સૂચના:'}</p>
                <p className="text-sm leading-relaxed">{traceGuide}</p>
              </div>
            )}
            {hasStrokeData ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDemoPlaying(p => !p)}
                  disabled={locked}
                  className="flex items-center gap-2 min-h-tap px-4 rounded-xl bg-ink text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition shrink-0"
                >
                  {demoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{demoPlaying ? (isEn ? 'Stop' : 'રોકો') : (isEn ? 'Show me how' : 'કેવી રીતે લખવું જુઓ')}</span>
                </button>
                <p className="text-sm text-ink-muted">
                  {isEn ? 'Watch each stroke drawn in order on the pad.' : 'દરેક રેખા ક્રમમાં પેડ પર દોરાતી જુઓ.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                {isEn
                  ? 'Stroke-by-stroke checking is not available for this word yet, so only its overall shape is checked.'
                  : 'આ શબ્દ માટે રેખાવાર ચકાસણી હજુ ઉપલબ્ધ નથી, તેથી ફક્ત આકાર તપાસાશે.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Drawing area ───────────────────────────────────────────────── */}
      <div
        ref={boxRef}
        className={`relative w-full ${wide ? 'h-[400px]' : 'h-[320px]'} bg-white rounded-2xl border-[3px] overflow-hidden transition-colors ${padBorder} ${phase === 'fail' ? 'pad-shake' : ''}`}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{ opacity: showRuling ? 1 : 0, ...rulingStyle }}
        />
        <canvas
          ref={guideCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none select-none transition-opacity duration-200 z-10 ${showGuide ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas
          ref={inkCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className={`absolute inset-0 w-full h-full z-20 ${locked ? 'cursor-default' : 'cursor-crosshair'}`}
          aria-label={isEn ? `Writing pad for ${targetLetter}` : `${targetLetter} માટે લેખન પેડ`}
        />
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />

        {strokes.length === 0 && phase === 'idle' && !demoPlaying && (
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-30">
            <p className="inline-block text-sm font-medium bg-white/95 px-3 py-1 rounded-full border border-line">
              {isEn ? `Write '${targetLetter}' with your finger or mouse` : `આંગળી અથવા માઉસ વડે '${targetLetter}' લખો`}
            </p>
          </div>
        )}

        {phase === 'checking' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold text-sm">{isEn ? 'Checking…' : 'તપાસી રહ્યા છીએ…'}</span>
            </div>
          </div>
        )}

        {phase === 'pass' && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-success-soft/60 pointer-events-none">
            <svg viewBox="0 0 64 64" className="w-28 h-28 sm:w-36 sm:h-36 pad-tick-pop" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="#15803D" />
              <path d="M18 33 L28 43 L46 23" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="pad-tick-draw" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Tools ──────────────────────────────────────────────────────── */}
      {phase === 'idle' || phase === 'checking' ? (
        <div className={`flex gap-2 ${wide ? 'flex-row items-center' : 'flex-col'}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-0.5 min-h-tap px-0.5 rounded-xl bg-surface border border-line" role="radiogroup" aria-label={isEn ? 'Pen colour' : 'પેનનો રંગ'}>
              {PEN_COLORS.map(color => (
                <button
                  key={color}
                  role="radio"
                  aria-checked={penColor === color}
                  aria-label={isEn ? PEN_NAMES[color][0] : PEN_NAMES[color][1]}
                  title={isEn ? PEN_NAMES[color][0] : PEN_NAMES[color][1]}
                  onClick={() => setPenColor(color)}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg transition ${penColor === color ? 'bg-canvas' : ''}`}
                >
                  {/* Selected colour gets a ring, not only a different look */}
                  <span
                    className={`w-7 h-7 rounded-full ${penColor === color ? 'ring-[3px] ring-offset-2 ring-pad-saffron' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRuling(prev => !prev)}
              aria-pressed={showRuling}
              className={`min-h-tap px-3 rounded-xl text-sm border transition ${
                showRuling ? 'bg-canvas border-ink-muted text-ink font-bold' : 'bg-surface border-line text-ink-muted font-medium'
              }`}
            >
              {isEn ? (showRuling ? 'Lines on' : 'Lines off') : (showRuling ? 'રેખા ચાલુ' : 'રેખા બંધ')}
            </button>
            <button
              onClick={handleUndo}
              disabled={!strokes.length || locked}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-surface border border-line disabled:opacity-40 hover:bg-canvas transition"
              title={isEn ? 'Undo last stroke' : 'છેલ્લી રેખા ભૂંસો'}
              aria-label={isEn ? 'Undo last stroke' : 'છેલ્લી રેખા ભૂંસો'}
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={resetAttempt}
              disabled={!strokes.length || locked}
              className="min-h-tap px-3 rounded-xl bg-surface border border-line text-sm font-semibold disabled:opacity-40 hover:bg-canvas transition"
            >
              {isEn ? 'Clear' : 'સાફ કરો'}
            </button>
          </div>
          <button
            onClick={evaluateWriting}
            disabled={phase === 'checking'}
            className={`${wide ? 'ml-auto w-auto' : 'w-full'} min-h-[52px] whitespace-nowrap px-6 rounded-xl bg-pad-saffron hover:bg-pad-saffron-dark disabled:opacity-80 text-white font-baloo font-bold text-lg flex items-center justify-center gap-2 transition active:scale-[0.98]`}
          >
            {phase === 'checking'
              ? <><Loader2 className="w-5 h-5 animate-spin" />{isEn ? 'Checking…' : 'તપાસી રહ્યા છીએ…'}</>
              : (isEn ? 'Check Writing' : 'લખાણ તપાસો')}
          </button>
        </div>
      ) : null}

      {/* ── Pass ───────────────────────────────────────────────────────── */}
      {phase === 'pass' && result && (
        <div role="status" className="pad-slide-up rounded-2xl border-2 border-pad-pass bg-success-soft p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-baloo text-2xl font-bold text-pad-pass leading-tight">શાબાશ! સાચું લખ્યું</p>
              <p className="text-sm text-ink">Well done! You wrote it correctly.</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold uppercase tracking-wide text-ink-muted">{isEn ? 'Score' : 'ગુણ'}</div>
              <div className="font-baloo text-3xl font-bold text-pad-pass leading-none tabular-nums">{result.score}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1" aria-hidden="true">
              {[0, 1, 2].map(i => (
                <Star
                  key={i}
                  style={{ animationDelay: `${0.35 + i * 0.12}s` }}
                  className={`w-8 h-8 pad-star-in ${i < result.stars ? 'fill-action text-action' : 'fill-surface text-ink-muted/40'}`}
                />
              ))}
            </div>
            <p className="text-sm font-bold text-pad-ink">
              {result.stars > 0
                ? <>+{result.stars} તારા મળ્યા <span className="font-medium text-ink-muted">· +{result.stars} stars earned</span></>
                : <>આ અક્ષરના તારા પહેલેથી મળ્યા છે <span className="block font-medium text-ink-muted">Stars already earned for this letter</span></>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetAttempt}
              className={`${wide ? 'flex-none' : 'flex-1'} min-h-[52px] whitespace-nowrap px-4 rounded-xl bg-surface border border-line text-ink font-bold flex items-center justify-center gap-2 hover:bg-canvas transition`}
            >
              <RotateCcw className="w-4 h-4" />
              {isEn ? 'Write again' : 'ફરી લખો'}
            </button>
            {hasNext && (
              <button
                onClick={handleNext}
                className={`${wide ? 'flex-none ml-auto' : 'flex-1'} min-h-[52px] whitespace-nowrap px-6 rounded-xl bg-pad-saffron hover:bg-pad-saffron-dark text-white font-baloo font-bold text-lg flex items-center justify-center gap-2 transition`}
              >
                {isEn ? 'Next' : 'આગળ'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Fail ───────────────────────────────────────────────────────── */}
      {phase === 'fail' && result && (
        <div role="alert" className="pad-slide-up rounded-2xl border-2 border-pad-wrong bg-danger-soft p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-full bg-pad-wrong text-white flex items-center justify-center" aria-hidden="true"><X className="w-6 h-6" strokeWidth={3} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-baloo text-xl font-bold text-pad-wrong leading-tight">{err?.gu}</p>
              <p className="text-sm text-ink">{err?.en}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold uppercase tracking-wide text-ink-muted">{isEn ? 'Score' : 'ગુણ'}</div>
              <div className="font-baloo text-2xl font-bold text-pad-ink leading-none tabular-nums">{result.score}</div>
              <div className="text-xs text-ink-muted">{isEn ? `pass ${writingThreshold}` : `પાસ ${toGuDigits(writingThreshold)}`}</div>
            </div>
          </div>

          {strokeNo !== null && strokeNo !== undefined && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-bold bg-surface rounded-xl border border-line px-3 py-2">
              <span className="text-pad-ink">
                {`રેખા ${toGuDigits(strokeNo + 1)}`} <span className="font-medium text-ink-muted">· Stroke {strokeNo + 1}</span>
              </span>
              {result.wrongStroke !== null && (
                <span className="flex items-center gap-1.5">
                  <svg width="26" height="8" aria-hidden="true"><line x1="2" y1="4" x2="24" y2="4" stroke={C.wrong} strokeWidth="4" strokeDasharray="6 4" strokeLinecap="round" /></svg>
                  {isEn ? 'Your stroke' : 'તમારી રેખા'}
                </span>
              )}
              {result.refStroke !== null && (
                <span className="flex items-center gap-1.5">
                  <svg width="26" height="8" aria-hidden="true"><line x1="2" y1="4" x2="20" y2="4" stroke={C.correct} strokeWidth="4" strokeLinecap="round" /><circle cx="22" cy="4" r="3.5" fill={C.correct} /></svg>
                  {isEn ? 'Correct stroke' : 'સાચી રેખા'}
                </span>
              )}
            </div>
          )}

          {onOpenClip && (
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="text-ink-muted">{isEn ? 'Watch again:' : 'ફરી જુઓ:'}</span>
              <button
                onClick={() => onOpenClip('write')}
                className="min-h-tap px-3 rounded-xl bg-surface border border-line text-ink hover:bg-canvas flex items-center gap-1.5 transition"
              >
                <PenLine className="w-4 h-4 text-pad-saffron" />
                {isEn ? 'How to write' : 'કેવી રીતે લખવું'}
              </button>
              <button
                onClick={() => onOpenClip('say')}
                className="min-h-tap px-3 rounded-xl bg-surface border border-line text-ink hover:bg-canvas flex items-center gap-1.5 transition"
              >
                <Smile className="w-4 h-4 text-pad-saffron" />
                {isEn ? 'How to say' : 'કેવી રીતે બોલવું'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {result.refStroke !== null && (
              <button
                onClick={() => setReplayKey(k => k + 1)}
                className={`${wide ? 'flex-none' : 'flex-1'} min-h-[52px] whitespace-nowrap px-4 rounded-xl bg-surface border border-line text-ink font-bold flex items-center justify-center gap-2 hover:bg-canvas transition`}
              >
                <Play className="w-4 h-4" />
                {isEn ? 'Watch again' : 'ફરી જુઓ'}
              </button>
            )}
            <button
              onClick={resetAttempt}
              className={`${wide ? 'flex-none ml-auto' : 'flex-1'} min-h-[52px] whitespace-nowrap px-6 rounded-xl bg-pad-saffron hover:bg-pad-saffron-dark text-white font-baloo font-bold text-lg flex items-center justify-center gap-2 transition`}
            >
              <RotateCcw className="w-5 h-5" />
              {isEn ? 'Try again' : 'ફરી પ્રયત્ન કરો'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
