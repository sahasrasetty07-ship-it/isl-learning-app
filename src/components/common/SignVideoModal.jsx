import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildYouTubeEmbedUrl } from '../../data/signVideos';
import { getEmbedUrl } from '../../utils/video.js';
import { X, RotateCcw, Volume2, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const ISLRTC_CREDIT_EN =
  'Sign reference: Indian Sign Language Research and Training Centre (ISLRTC), Ministry of Social Justice & Empowerment, Government of India.';
const ISLRTC_CREDIT_GU =
  'સંકેત સંદર્ભ: ભારતીય સંકેત ભાષા સંશોધન અને પ્રશિક્ષણ કેન્દ્ર (ISLRTC), સામાજિક ન્યાય અને સશક્તિકરણ મંત્રાલય, ભારત સરકાર.';

export const SignVideoModal = () => {
  const { activeVideoModal, setActiveVideoModal, speakText, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const videoRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, activeVideoModal]);

  if (!activeVideoModal) return null;

  const {
    title,
    gujarati,
    english,
    signDescription,
    handShape,
    meaning,
    verifiedBy,
    category,
    videoUrl,
    youtubeId,
    startTime,
    endTime,
    videoStart,
    videoEnd,
  } = activeVideoModal;

  const handleClose = () => setActiveVideoModal(null);

  const handleSpeech = () => {
    if (gujarati) speakText(gujarati);
  };

  const changeRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  // Both trim conventions are accepted: videoStart/videoEnd (videoUrl entries)
  // and startTime/endTime (youtubeId entries).
  const clipStart = videoStart ?? startTime ?? null;
  const clipEnd = videoEnd ?? endTime ?? null;

  // Resolve YouTube embed URL with optional start & end timestamps.
  // A valid youtubeId plays regardless of verification status —
  // the in-modal badge already conveys whether the sign has been reviewed.
  const youtubeEmbedUrl = (() => {
    if (youtubeId && typeof youtubeId === 'string') {
      return buildYouTubeEmbedUrl(youtubeId, clipStart, clipEnd);
    }

    if (videoUrl) {
      const embed = getEmbedUrl(videoUrl, { start: clipStart, end: clipEnd });
      if (embed) return embed;

      // YouTube link that could not be parsed (e.g. a playlist) – use as-is
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        return videoUrl;
      }
    }

    return null;
  })();

  // Direct video file (e.g. the mp4 URLs on science lessons or phrasebook items)
  const isDirectVideo = Boolean(
    videoUrl &&
    !youtubeEmbedUrl &&
    !/(?:youtube\.com|youtu\.be)/i.test(videoUrl)
  );

  const renderPlayer = () => {
    if (youtubeEmbedUrl) {
      return (
        <div className="w-full aspect-video bg-black">
          <iframe
            key={youtubeEmbedUrl}
            src={youtubeEmbedUrl}
            title={gujarati || title || (isEn ? 'ISL Sign Demonstration' : 'ISL સંકેત વિડીયો')}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    if (isDirectVideo) {
      return (
        <div className="relative bg-slate-950">
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[320px] bg-black"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 p-1 rounded-md">
            {[0.5, 0.75, 1].map(rate => (
              <button
                key={rate}
                onClick={() => changeRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  playbackRate === rate
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                }
              }}
              className="p-1 rounded text-slate-300 hover:text-white transition"
              title={isEn ? 'Replay' : 'ફરી ચલાવો'}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    // ── No approved video: text-description fallback ──────────────────────
    return (
      <div className="bg-slate-950 flex flex-col items-center justify-center p-5 text-center gap-3 min-h-[180px] sm:min-h-[200px]">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-dashed border-amber-400/60 flex items-center justify-center text-4xl animate-pulse select-none">
            🤟
          </div>
        </div>

        <p className="text-white font-bold text-base">
          {isEn ? `Sign for "${gujarati}"` : `"${gujarati}" નો ISL સાઇન`}
        </p>
        {handShape && <p className="text-xs text-slate-400">{handShape}</p>}

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{isEn ? 'Video coming soon' : 'વિડીયો ટૂંક સમયમાં'}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] min-w-0">
        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {gujarati ? gujarati.charAt(0) : 'સ'}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                {title || (isEn ? 'ISL Sign Demonstration' : 'ISL સંકેત વિડીયો')}
              </h3>
              <p className="text-xs text-amber-300 font-medium truncate">
                {english || category || 'Indian Sign Language'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Player area ───────────────────────────────────────────────── */}
        <div className="shrink-0 overflow-hidden">
          {renderPlayer()}
        </div>

        {/* ── Scrollable details ────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 text-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Sign Instructions' : 'સંકેત વિગત'}
            </h4>
            <button
              onClick={handleSpeech}
              className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Listen' : 'ઉચ્ચારણ'}</span>
            </button>
          </div>

          {signDescription ? (
            <p className="text-sm font-medium text-slate-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              {signDescription}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              {isEn
                ? 'No sign description available for this entry yet.'
                : 'આ એન્ટ્રી માટે હજુ સંકેત વર્ણન ઉપલબ્ધ નથી.'}
            </p>
          )}

          {handShape && (
            <p className="text-xs text-slate-600">
              <span className="font-bold">{isEn ? 'Handshape: ' : 'હસ્તમુદ્રા: '}</span>
              {handShape}
            </p>
          )}

          {meaning && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {isEn ? 'Context & Meaning' : 'અર્થ અને સંદર્ભ'}
              </h4>
              <p className="text-xs text-slate-700">{meaning}</p>
            </div>
          )}

          {/* Review status: only claim review when a reviewer is recorded */}
          {verifiedBy ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isEn ? `Reviewed by ${verifiedBy}` : `${verifiedBy} દ્વારા ચકાસાયેલ સંકેત.`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isEn
                  ? 'Draft sign description – not yet reviewed by an ISL educator.'
                  : 'ડ્રાફ્ટ વર્ણન – ISL શિક્ષક દ્વારા હજુ ચકાસાયેલ નથી.'}
              </span>
            </div>
          )}

          {/* ISLRTC credit */}
          <p className="text-[10px] text-slate-400 leading-snug">
            {isEn ? ISLRTC_CREDIT_EN : ISLRTC_CREDIT_GU}
          </p>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEn ? 'Got it (Close)' : 'સમજાયું'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
