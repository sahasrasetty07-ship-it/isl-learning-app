import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { isDirectVideoFile } from '../../utils/video';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Gauge,
  AlertTriangle,
  Film,
  Sparkles,
  Info,
  Clock,
  Layers,
} from 'lucide-react';

/**
 * Reusable video-first Sign Sequence Player.
 * Plays clips back to back with speed controls, replay, previous/next,
 * loading skeletons, broken URL error states, and visible unsupported word chips.
 *
 * @param {object} props
 * @param {Array<object>} props.sequence - Array of { type: 'video'|'fingerspell'|'unsupported', key, url, label, ... }
 * @param {string} [props.className]
 */
export const SignSequencePlayer = ({ sequence = [], className = '' }) => {
  const { uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Sub-letter index for fingerspelling items
  const [subLetterIdx, setSubLetterIdx] = useState(0);

  const videoRef = useRef(null);
  const timeoutRef = useRef(null);

  // Reset indices when sequence changes
  useEffect(() => {
    setCurrentIndex(0);
    setSubLetterIdx(0);
    setIsPlaying(false);
    setVideoError(false);
  }, [sequence]);

  const currentItem = sequence[currentIndex] || null;

  // Determine current active playable URL
  const activeUrl = (() => {
    if (!currentItem) return null;
    if (currentItem.type === 'video') return currentItem.url;
    if (currentItem.type === 'fingerspell' && currentItem.letters?.length > 0) {
      return currentItem.letters[subLetterIdx]?.url || currentItem.letters[0]?.url;
    }
    return null;
  })();

  const isDirect = isDirectVideoFile(activeUrl);

  // Adjust playback speed on HTML5 video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeUrl]);

  // Handle advancing to next item in sequence
  const handleAdvance = () => {
    if (!sequence || sequence.length === 0) return;

    // If current item is fingerspell and has more letters
    if (
      currentItem?.type === 'fingerspell' &&
      currentItem.letters &&
      subLetterIdx < currentItem.letters.length - 1
    ) {
      setSubLetterIdx((prev) => prev + 1);
      return;
    }

    // Advance to next sequence item
    if (currentIndex < sequence.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSubLetterIdx(0);
      setVideoError(false);
    } else {
      // Reached end of sequence
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentItem?.type === 'fingerspell' && subLetterIdx > 0) {
      setSubLetterIdx((prev) => prev - 1);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSubLetterIdx(0);
      setVideoError(false);
    }
  };

  const handleReplayCurrent = () => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      // For YouTube embeds / non-video, re-trigger
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (!activeUrl) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setVideoError(true));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToIndex = (idx) => {
    if (idx >= 0 && idx < sequence.length) {
      setCurrentIndex(idx);
      setSubLetterIdx(0);
      setVideoError(false);
      setIsPlaying(true);
    }
  };

  if (!sequence || sequence.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <Film className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-semibold">
          {isEn
            ? 'No sign sequence generated yet. Enter text or speech above.'
            : 'હજુ કોઈ સાઇન સિક્વન્સ જનરેટ થઈ નથી. ઉપર લખાણ અથવા અવાજ દાખલ કરો.'}
        </p>
      </div>
    );
  }

  const totalItems = sequence.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalItems) * 100);

  return (
    <div
      className={`bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${className}`}
      aria-label={isEn ? 'ISL Sign Sequence Player' : 'ISL સાઇન સિક્વન્સ પ્લેયર'}
    >
      {/* Top Header & Progress */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {isEn ? 'ISL Video Sequence' : 'ISL સંકેત વિડીયો'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {currentIndex + 1} / {totalItems}
            </span>
          </div>
          <h4
            lang="gu"
            className="text-base font-black text-white mt-1 truncate"
          >
            {currentItem?.label || currentItem?.word || ''}
            {currentItem?.type === 'fingerspell' && currentItem.letters && (
              <span className="text-xs text-amber-400 font-normal ml-2">
                ({isEn ? 'Fingerspell letter' : 'અક્ષર મુદ્રા'}: {currentItem.letters[subLetterIdx]?.letter})
              </span>
            )}
          </h4>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl shrink-0">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1" />
          {[0.5, 0.75, 1].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              aria-label={`Playback speed ${spd}x`}
              className={`min-h-[32px] px-2 py-1 rounded-lg text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-400 ${
                playbackSpeed === spd
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-slate-800 h-1"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Video Viewport */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-300 mt-2">
              {isEn ? 'Loading sign video...' : 'સાઇન વિડીયો લોડ થઈ રહ્યો છે...'}
            </span>
          </div>
        )}

        {/* Error State: Broken or missing URL */}
        {videoError && (
          <div className="p-6 text-center z-10 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">
              {isEn ? 'Sign Video Unavailable' : 'વિડીયો ઉપલબ્ધ નથી'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isEn
                ? 'Could not play the sign demonstration clip. Please try replaying or skip to next.'
                : 'આ સંકેતનો વિડીયો પ્લે થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો અથવા આગળ વધો.'}
            </p>
            <button
              type="button"
              onClick={handleReplayCurrent}
              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Retry' : 'ફરી પ્રયાસ'}</span>
            </button>
          </div>
        )}

        {/* State 1: Unsupported Word (No approved sign) */}
        {!videoError && currentItem?.type === 'unsupported' && (
          <div className="p-6 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto mb-3 select-none">
              ⚠️
            </div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
              {isEn ? 'No Approved Sign in Phrasebook' : 'શબ્દકોષમાં માન્ય સંકેત ઉપલબ્ધ નથી'}
            </span>
            <h5 lang="gu" className="text-lg font-black text-white">
              "{currentItem.word}"
            </h5>
            <p className="text-xs text-slate-400 mt-1.5">
              {isEn
                ? 'Under ISL guidelines, arbitrary words without educator approval are not guessed. They will be added once verified by ISL educators.'
                : 'ISL નિયમો મુજબ મનસ્વી અનુવાદ કે અંદાજો લગાવવામાં આવતો નથી. શિક્ષકો દ્વારા ચકાસણી પછી ઉમેરાશે.'}
            </p>
          </div>
        )}

        {/* State 2: Matched item but pending or missing approved video URL */}
        {!videoError && currentItem?.type !== 'unsupported' && !activeUrl && (
          <div className="p-6 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl mx-auto mb-3 select-none">
              🤟
            </div>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-2">
              <Clock className="w-3 h-3 inline mr-1" />
              {isEn ? 'Sign Video Verification Pending' : 'વિડીયો ચકાસણી ચાલુ છે'}
            </span>
            <h5 lang="gu" className="text-lg font-black text-white">
              {currentItem.label}
            </h5>
            {currentItem.signDescription && (
              <p className="text-xs text-amber-200/90 mt-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <strong>{isEn ? 'Sign Description: ' : 'સંકેત વર્ણન: '}</strong>
                {currentItem.signDescription}
              </p>
            )}
          </div>
        )}

        {/* State 3: Direct video file (.mp4, .webm) */}
        {!videoError && isDirect && activeUrl && (
          <video
            ref={videoRef}
            src={activeUrl}
            className="w-full h-full object-contain"
            playsInline
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onEnded={handleAdvance}
            onError={() => {
              setIsLoading(false);
              setVideoError(true);
            }}
          />
        )}

        {/* State 4: YouTube Embed iframe */}
        {!videoError && !isDirect && activeUrl && (
          <iframe
            key={activeUrl}
            src={activeUrl}
            title={currentItem.label || 'ISL sign video'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>

      {/* Playback Controls Toolbar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0 && subLetterIdx === 0}
            aria-label={isEn ? 'Previous sign' : 'પાછલો સંકેત'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!activeUrl}
            aria-label={isPlaying ? (isEn ? 'Pause' : 'વિરામ') : isEn ? 'Play' : 'ચલાવો'}
            className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="hidden sm:inline">{isPlaying ? (isEn ? 'Pause' : 'વિરામ') : isEn ? 'Play' : 'પ્લે'}</span>
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplayCurrent}
            aria-label={isEn ? 'Replay sign' : 'ફરી જુઓ'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleAdvance}
            disabled={currentIndex >= totalItems - 1}
            aria-label={isEn ? 'Next sign' : 'આગળનો સંકેત'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Current status message / text */}
        <div className="text-right text-xs text-slate-400 truncate">
          <span className="font-semibold text-slate-200">
            {currentItem?.type === 'video'
              ? isEn
                ? 'Curated ISL Video'
                : 'ચકાસાયેલ સંકેત'
              : currentItem?.type === 'fingerspell'
              ? isEn
                ? 'Fingerspelling'
                : 'હસ્તમુદ્રા'
              : isEn
              ? 'No Sign'
              : 'સંકેત નથી'}
          </span>
        </div>
      </div>

      {/* Interactive Word Sequence Chips with Visual Highlights & Unsupported Chips */}
      <div className="p-3 bg-slate-950 border-t border-slate-900">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          {isEn ? 'Sequence Breakdown (tap word to jump):' : 'શબ્દ ક્રમ વિગત (જોવા માટે શબ્દ પર ક્લિક કરો):'}
        </span>

        <div className="flex flex-wrap items-center gap-1.5" role="list">
          {sequence.map((item, idx) => {
            const isActive = currentIndex === idx;
            const isUnsupported = item.type === 'unsupported';
            const isFingerspell = item.type === 'fingerspell';

            return (
              <button
                key={`${item.key}-${idx}`}
                type="button"
                onClick={() => jumpToIndex(idx)}
                aria-current={isActive ? 'true' : undefined}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-105 z-10'
                    : isUnsupported
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                    : isFingerspell
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/60'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] opacity-70">{idx + 1}.</span>
                <span lang="gu">{item.label || item.word}</span>

                {isUnsupported && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {isEn ? 'no sign' : 'સંકેત નથી'}
                  </span>
                )}

                {isFingerspell && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {isEn ? 'letters' : 'અક્ષરો'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
