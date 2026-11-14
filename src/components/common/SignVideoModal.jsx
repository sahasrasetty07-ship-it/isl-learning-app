import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { buildYouTubeEmbedUrl } from '../../data/signVideos';
import { X, Volume2, ShieldCheck, AlertCircle, Hand } from 'lucide-react';

// Singleton loader for the YouTube IFrame Player API
let ytApiPromise = null;
const loadYouTubeIframeApi = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      // 4-second fallback in case network blocks the script
      const timeout = setTimeout(() => {
        resolve(window.YT || null);
      }, 4000);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        if (typeof prevCallback === 'function') {
          try { prevCallback(); } catch (_) {}
        }
        resolve(window.YT);
      };

      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(tag, firstScript);
        } else {
          document.head.appendChild(tag);
        }
      }
    });
  }
  return ytApiPromise;
};

// Eagerly initiate loading the API script when module is parsed
if (typeof window !== 'undefined') {
  loadYouTubeIframeApi();
}

export const SignVideoModal = () => {
  const { activeVideoModal, setActiveVideoModal, speakText, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef(null);
  const ytContainerRef = useRef(null);
  const playerRef = useRef(null);

  const targetYoutubeId = (() => {
    if (!activeVideoModal) return null;
    if (activeVideoModal.youtubeId && typeof activeVideoModal.youtubeId === 'string') {
      return activeVideoModal.youtubeId;
    }
    const url = activeVideoModal.videoUrl;
    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([\w-]{11})/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  })();

  const isDirectVideo = Boolean(
    activeVideoModal?.videoUrl &&
    !activeVideoModal.videoUrl.includes('youtube.com') &&
    !activeVideoModal.videoUrl.includes('youtu.be')
  );

  // Reset playbackRate to 1 on video change
  useEffect(() => {
    setPlaybackRate(1);
  }, [activeVideoModal?.youtubeId, activeVideoModal?.videoUrl]);

  // Synchronize playback rate
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch (_) {}
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // YouTube player initialization, autoplay, and continuous segment looping
  useEffect(() => {
    if (!targetYoutubeId || !ytContainerRef.current) return;

    let isCleanedUp = false;
    let player = null;
    let pollInterval = null;
    let isSeeking = false;

    const startSec = typeof activeVideoModal?.startTime === 'number' &&
      !isNaN(activeVideoModal.startTime) &&
      activeVideoModal.startTime >= 0
        ? activeVideoModal.startTime
        : 0;

    const endSec = typeof activeVideoModal?.endTime === 'number' &&
      !isNaN(activeVideoModal.endTime) &&
      activeVideoModal.endTime > 0
        ? activeVideoModal.endTime
        : null;

    loadYouTubeIframeApi().then((YT) => {
      if (isCleanedUp || !ytContainerRef.current) return;

      if (!YT || !YT.Player) {
        // Fallback: render embed iframe with distraction-free parameters directly
        const embedUrl = buildYouTubeEmbedUrl(targetYoutubeId, startSec, endSec);
        if (embedUrl && ytContainerRef.current) {
          ytContainerRef.current.innerHTML = `
            <iframe
              src="${embedUrl}"
              title="ISL Sign Demonstration"
              class="w-full h-full rounded-2xl bg-black border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          `;
        }
        return;
      }

      // Create a mount node for YT.Player to replace
      ytContainerRef.current.innerHTML = '';
      const mountNode = document.createElement('div');
      mountNode.style.width = '100%';
      mountNode.style.height = '100%';
      ytContainerRef.current.appendChild(mountNode);

      player = new YT.Player(mountNode, {
        videoId: targetYoutubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          fs: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
          cc_load_policy: 0,
          start: Math.floor(startSec)
        },
        events: {
          onReady: (event) => {
            if (isCleanedUp) return;
            try {
              event.target.mute();
              event.target.seekTo(startSec, true);
              event.target.playVideo();
              if (playbackRate !== 1) {
                event.target.setPlaybackRate(playbackRate);
              }
            } catch (_) {}
          },
          onStateChange: (event) => {
            if (isCleanedUp) return;
            // Video reaches the end (YT.PlayerState.ENDED === 0)
            if (event.data === 0) {
              try {
                event.target.seekTo(startSec, true);
                event.target.playVideo();
              } catch (_) {}
            }
          }
        }
      });

      playerRef.current = player;

      // Poll current time to loop exact timestamp segment
      pollInterval = setInterval(() => {
        if (isCleanedUp || !player || typeof player.getCurrentTime !== 'function') return;
        try {
          const currentTime = player.getCurrentTime();

          // If an end timestamp is configured, repeat immediately when reached
          if (typeof endSec === 'number' && endSec > 0) {
            if (currentTime >= endSec) {
              if (!isSeeking) {
                isSeeking = true;
                player.seekTo(startSec, true);
                player.playVideo();
              }
            } else {
              isSeeking = false;
            }
          }

          // Initial cue safeguard: if player starts before configured start time
          if (startSec > 0 && currentTime < startSec - 0.75 && !isSeeking) {
            player.seekTo(startSec, true);
          }
        } catch (_) {}
      }, 100);
    });

    return () => {
      isCleanedUp = true;
      if (pollInterval) clearInterval(pollInterval);
      if (player) {
        try {
          player.destroy();
        } catch (_) {}
      }
      playerRef.current = null;
      if (ytContainerRef.current) {
        ytContainerRef.current.innerHTML = '';
      }
    };
  }, [targetYoutubeId, activeVideoModal?.startTime, activeVideoModal?.endTime]);

  if (!activeVideoModal) return null;

  const { 
    title, 
    gujarati, 
    english, 
    signDescription, 
    handShape, 
    meaning, 
    verifiedBy,
    category 
  } = activeVideoModal;

  const handleSpeech = () => {
    if (gujarati) speakText(gujarati);
  };

  const heading = title || (isEn ? 'ISL Sign Demonstration' : 'ISL સંકેત વિડીયો');

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label={heading}>
      <div className="bg-surface w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden border border-line flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-4 flex items-center justify-between gap-3 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-action-soft text-action flex items-center justify-center font-heading font-bold text-xl leading-none pt-1 overflow-hidden">
              {gujarati ? Array.from(gujarati)[0] : 'સ'}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight truncate">{heading}</h2>
              <p className="text-sm text-ink-muted truncate">{english || category || 'Indian Sign Language'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveVideoModal(null)}
            aria-label={isEn ? 'Close' : 'બંધ કરો'}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-line hover:bg-canvas transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Video: the largest element */}
          <div className="bg-ink p-3 sm:p-4 flex flex-col items-center gap-3">
            {targetYoutubeId ? (
              <div className="w-full aspect-video rounded-2xl bg-black overflow-hidden relative flex items-center justify-center">
                <div
                  ref={ytContainerRef}
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 [&>iframe]:rounded-2xl"
                />
              </div>
            ) : isDirectVideo ? (
              <video
                ref={videoRef}
                key={activeVideoModal.videoUrl}
                src={activeVideoModal.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full aspect-video rounded-2xl bg-black"
              />
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/15 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <Hand className="w-16 h-16 text-white" aria-hidden="true" />
                <p className="font-heading text-xl font-bold text-white">
                  {isEn ? `Sign for "${gujarati}"` : `"${gujarati}" નો સાઇન સંકેત`}
                </p>
                <p className="text-sm text-white/80">
                  {isEn ? 'Video not recorded yet – follow the steps below' : 'વિડીયો હજુ ઉપલબ્ધ નથી – નીચેની વિગત અનુસરો'}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div role="group" aria-label={isEn ? 'Speed' : 'સ્પીડ'} className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                <span className="text-sm text-white/80 px-2">{isEn ? 'Speed' : 'સ્પીડ'}</span>
                {[0.5, 0.75, 1].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    aria-pressed={playbackRate === rate}
                    className={`min-w-tap min-h-[40px] px-2 rounded-lg text-sm transition ${
                      playbackRate === rate ? 'bg-white text-ink font-bold' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSpeech}
                className="inline-flex items-center gap-1.5 min-h-tap px-4 rounded-xl bg-white text-ink text-sm font-semibold hover:bg-canvas transition"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                {isEn ? 'Say it' : 'ઉચ્ચારણ'}
              </button>
            </div>
          </div>

          {/* Sign Instructions & Details */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-action" aria-hidden="true" />
                {isEn ? 'How to sign it' : 'સંકેત વિગત'}
              </h3>
              <p className="mt-1 leading-relaxed">{signDescription}</p>
              {handShape && <p className="text-sm text-ink-muted mt-1.5">{isEn ? 'Hand shape:' : 'હસ્તમુદ્રા:'} {handShape}</p>}
            </div>

            {meaning && (
              <div>
                <h3 className="text-base font-bold">{isEn ? 'Meaning' : 'અર્થ અને સંદર્ભ'}</h3>
                <p className="text-sm text-ink-muted mt-1">{meaning}</p>
              </div>
            )}

            {/* Review status: only claim review when a reviewer is recorded */}
            {verifiedBy ? (
              <div className="flex items-center gap-2 bg-success-soft text-success p-3 rounded-xl text-sm font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{isEn ? `Reviewed by ${verifiedBy}` : `${verifiedBy} દ્વારા ચકાસાયેલ સંકેત.`}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-canvas border border-line p-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-action" aria-hidden="true" />
                <span>
                  {isEn
                    ? 'Draft sign description – not yet reviewed by an ISL educator.'
                    : 'ડ્રાફ્ટ વર્ણન – ISL શિક્ષક દ્વારા હજુ ચકાસાયેલ નથી.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-line">
          <button
            type="button"
            onClick={() => setActiveVideoModal(null)}
            className="w-full min-h-[52px] rounded-xl bg-action hover:bg-action-hover text-white text-base font-semibold transition"
          >
            {isEn ? 'Got it' : 'સમજાયું'}
          </button>
        </div>
      </div>
    </div>
  );
};
