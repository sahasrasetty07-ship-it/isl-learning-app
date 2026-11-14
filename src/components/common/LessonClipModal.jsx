import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { getLessonClips } from '../../data/lessonClips';
import { HowToWriteClip, writeClipTiming } from './HowToWriteClip';
import { getStrokeReference } from '../../data/strokeReferences';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2, PenLine, Smile, ArrowRight } from 'lucide-react';

const SpeedToggle = ({ speed, setSpeed, isEn }) => (
  <div role="group" aria-label={isEn ? 'Speed' : 'સ્પીડ'} className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
    <span className="text-sm text-white/80 px-2">{isEn ? 'Speed' : 'સ્પીડ'}</span>
    {[0.5, 1].map(rate => (
      <button
        key={rate}
        onClick={() => setSpeed(rate)}
        aria-pressed={speed === rate}
        className={`min-w-tap min-h-[40px] px-2 rounded-lg text-sm transition ${
          speed === rate ? 'bg-white text-ink font-bold' : 'text-white hover:bg-white/10'
        }`}
      >
        {rate}x
      </button>
    ))}
  </div>
);

const ControlButton = ({ onClick, label, children }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
  >
    {children}
  </button>
);

// Caption shown under every clip: never rely on audio alone.
const Caption = ({ caption }) => (
  <div className="mt-3 bg-white/10 px-4 py-2 rounded-xl w-full max-w-[420px] text-center">
    <p className="font-heading text-2xl font-bold text-white leading-tight">
      {caption.text}{caption.word ? <span> · {caption.word}</span> : null}
    </p>
    <p className="text-sm text-white/80 font-medium">
      {caption.textLatin}{caption.wordLatin ? ` · ${caption.wordLatin}` : ''}
    </p>
  </div>
);

const WatchedChip = ({ isEn }) => (
  <span className="inline-flex items-center gap-1 text-sm font-bold text-ink bg-white px-2.5 py-1 rounded-full">
    <CheckCircle2 className="w-3.5 h-3.5" />
    {isEn ? 'Watched' : 'જોયું'}
  </span>
);

// ── How to write ─────────────────────────────────────────────────────────
const WriteClip = ({ item, watched, onWatched, isEn }) => {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [restartKey, setRestartKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const reference = getStrokeReference(item.text);
  const strokeCount = reference?.length || 0;
  const seconds = Math.round(writeClipTiming(strokeCount).total / 1000);

  if (!reference) {
    return (
      <>
        <ComingSoon icon={PenLine} isEn={isEn} />
        <Caption caption={getLessonClips(item).say.caption} />
      </>
    );
  }
  return (
    <>
      <div className="relative w-full max-w-[420px] aspect-[3/2] bg-white rounded-2xl overflow-hidden">
        <HowToWriteClip
          text={item.text}
          playing={playing}
          speed={speed}
          restartKey={restartKey}
          onCycleComplete={onWatched}
          onProgress={(p) => setProgress(p)}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-line">
          <div className="h-full bg-action" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <Caption caption={{ text: item.text, textLatin: `${strokeCount} ${isEn ? (strokeCount === 1 ? 'stroke' : 'strokes') : 'રેખા'} · ${seconds}s` }} />
      <div className="w-full max-w-[420px] mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ControlButton onClick={() => setPlaying(p => !p)} label={playing ? (isEn ? 'Pause' : 'રોકો') : (isEn ? 'Play' : 'ચલાવો')}>
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </ControlButton>
          <ControlButton onClick={() => { setRestartKey(k => k + 1); setPlaying(true); }} label={isEn ? 'Replay' : 'ફરી જુઓ'}>
            <RotateCcw className="w-5 h-5" />
          </ControlButton>
        </div>
        {watched && <WatchedChip isEn={isEn} />}
        <SpeedToggle speed={speed} setSpeed={setSpeed} isEn={isEn} />
      </div>
    </>
  );
};

// ── How to say ───────────────────────────────────────────────────────────
const SayClip = ({ item, watched, onWatched, isEn }) => {
  const { speakText } = useApp();
  const { src, caption } = getLessonClips(item).say;
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true); // never autoplay sound
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  if (!src || failed) {
    return (
      <>
        <ComingSoon icon={Smile} isEn={isEn} />
        <Caption caption={caption} />
        <div className="w-full max-w-[420px] mt-3 flex justify-end">
          <button
            onClick={() => speakText(caption.word ? `${caption.text}, ${caption.word}` : caption.text)}
            className="inline-flex items-center gap-1.5 min-h-tap px-4 rounded-xl bg-white text-ink text-sm font-semibold hover:bg-canvas transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isEn ? 'Audio' : 'ઉચ્ચારણ'}</span>
          </button>
        </div>
      </>
    );
  }

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };

  return (
    <>
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onWatched(); }}
        onLoadedMetadata={(e) => { e.currentTarget.playbackRate = speed; }}
        onError={() => setFailed(true)}
        className="w-full max-w-[420px] aspect-[3/2] object-cover rounded-2xl bg-black"
        aria-label={`${caption.text} ${caption.word || ''}`}
      />
      <Caption caption={caption} />
      <div className="w-full max-w-[420px] mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ControlButton onClick={togglePlay} label={playing ? (isEn ? 'Pause' : 'રોકો') : (isEn ? 'Play' : 'ચલાવો')}>
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </ControlButton>
          <ControlButton onClick={replay} label={isEn ? 'Replay' : 'ફરી જુઓ'}>
            <RotateCcw className="w-5 h-5" />
          </ControlButton>
          <button
            onClick={() => setMuted(m => !m)}
            aria-pressed={!muted}
            className={`min-h-tap px-3 flex items-center gap-1.5 whitespace-nowrap rounded-xl text-sm font-semibold transition ${
              muted ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-ink'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{muted ? (isEn ? 'Sound off' : 'અવાજ બંધ') : (isEn ? 'Sound on' : 'અવાજ ચાલુ')}</span>
          </button>
        </div>
        {watched && <WatchedChip isEn={isEn} />}
        <SpeedToggle speed={speed} setSpeed={setSpeed} isEn={isEn} />
      </div>
    </>
  );
};

const ComingSoon = ({ icon: Icon, isEn }) => (
  <div className="w-full max-w-[420px] aspect-[3/2] bg-white/5 rounded-2xl border border-white/15 flex flex-col items-center justify-center p-4 text-center">
    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center">
      <Icon className="w-10 h-10 text-white" aria-hidden="true" />
    </div>
    <p className="font-heading text-white font-bold text-xl mt-3">{isEn ? 'Video coming soon' : 'વિડીયો ટૂંક સમયમાં'}</p>
    <p className="text-sm text-white/80 mt-0.5">
      {isEn ? 'Use the caption below for now.' : 'હાલ નીચેનું લખાણ જુઓ.'}
    </p>
  </div>
);

// Modal for one lesson clip. `clip` = { item, type: 'write' | 'say' }.
export const LessonClipModal = ({ clip, onClose, onSwitch }) => {
  const { student, markClipWatched, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';
  if (!clip) return null;

  const { item, type } = clip;
  const watched = Boolean(student.lessonClips?.[item.key]?.[type]);
  const isWrite = type === 'write';
  const title = isWrite ? (isEn ? 'How to write' : 'કેવી રીતે લખવું') : (isEn ? 'How to say' : 'કેવી રીતે બોલવું');
  const subtitle = item.word ? `${item.text} · ${item.word}` : item.text;
  const onWatched = () => markClipWatched(item, type);

  // Portal to <body>: the phone-frame preview applies a backdrop filter, which
  // would otherwise make this fixed overlay position inside its scroll area.
  return createPortal(
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-surface w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden border border-line flex flex-col max-h-[94vh]">
        <div className="p-4 flex items-center justify-between gap-3 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-action-soft text-action flex items-center justify-center font-heading font-bold text-xl leading-none pt-1">
              {item.text}
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight flex items-center gap-1.5">
                {isWrite ? <PenLine className="w-4 h-4 text-action" aria-hidden="true" /> : <Smile className="w-4 h-4 text-action" aria-hidden="true" />}
                {title}
              </h2>
              <p className="text-sm text-ink-muted">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isEn ? 'Close' : 'બંધ કરો'}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-line hover:bg-canvas transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative bg-ink flex flex-col items-center justify-center p-4 text-center overflow-y-auto">
          {isWrite
            ? <WriteClip key={`${item.key}-write`} item={item} watched={watched} onWatched={onWatched} isEn={isEn} />
            : <SayClip key={`${item.key}-say`} item={item} watched={watched} onWatched={onWatched} isEn={isEn} />}
        </div>

        {/* Footer leads on to the next step of the lesson */}
        <div className="p-3 border-t border-line flex gap-2">
          <button
            onClick={onClose}
            className="min-h-[52px] px-5 rounded-xl bg-surface border border-line hover:bg-canvas text-ink text-base font-semibold transition"
          >
            {isEn ? 'Close' : 'બંધ કરો'}
          </button>
          <button
            onClick={() => (isWrite ? onSwitch('say') : onClose())}
            className="flex-1 min-h-[52px] px-5 rounded-xl bg-action hover:bg-action-hover text-white text-base font-semibold transition flex items-center justify-center gap-2"
          >
            <span>
              {isWrite
                ? (isEn ? 'Next: How to say' : 'આગળ: કેવી રીતે બોલવું')
                : (isEn ? 'Next: Practise writing' : 'આગળ: લખવાનો મહાવરો')}
            </span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
