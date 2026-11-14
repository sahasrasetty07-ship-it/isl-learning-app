import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { normalizeHandLandmarks, validatePredictionStability } from '../../utils/landmarkNormalizer';
import { speak, isTTSSupported, stopSpeaking } from '../../utils/speech';
import {
  Camera,
  CameraOff,
  Sparkles,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Layers,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Delete,
  VolumeX,
  Plus,
  Edit3,
  Check,
} from 'lucide-react';

// Official MediaPipe Hand Connections (21 landmarks)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                               // Palm base
];

export const SignRecognition = () => {
  const { showToast, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Recognition Mode: 'static' (letters/numbers single frame) | 'dynamic' (words 30-frame window)
  const [recognitionMode, setRecognitionMode] = useState('static');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializingVision, setIsInitializingVision] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Model status: 'loading' | 'missing' | 'ready' | 'error'
  const [modelStatus, setModelStatus] = useState('missing');
  const [modelMessage, setModelMessage] = useState(null);

  // Prediction state (gated by >= 0.80 confidence and 5-frame stability)
  const [activePrediction, setActivePrediction] = useState(null); // { label, confidence }
  const [recognitionStatusText, setRecognitionStatusText] = useState('idle'); // 'idle' | 'recognized' | 'unrecognized' | 'no-hand'

  // Rolling predictions for stability check
  const recentPredictionsRef = useRef([]);
  // Rolling 30 frames of 63 floats for dynamic window
  const frameWindowRef = useRef([]);

  // Confirmed text buffer (User-confirmed signs only)
  const [confirmedSigns, setConfirmedSigns] = useState(['નમસ્તે']);
  const [isEditingBuffer, setIsEditingBuffer] = useState(false);
  const [manualEditText, setManualEditText] = useState('');

  // Auto-speak toggle (OFF by default)
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsNotice, setTtsNotice] = useState(null);

  // HandLandmarker reference
  const landmarkerRef = useRef(null);
  // TF.js model and labels reference
  const tfModelRef = useRef(null);
  const tfLabelsRef = useRef([]);

  // Check if Cloud TTS fallback is enabled
  const isCloudTtsEnabled = import.meta.env.VITE_ENABLE_CLOUD_TTS === 'true';

  // ----------------------------------------------------------------------------
  // Model Loader (Attempts to load TF.js model from public/models/)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    const loadTfModel = async () => {
      setModelStatus('loading');
      const basePath = recognitionMode === 'static' ? '/models/sign-static' : '/models/sign-dynamic';

      try {
        const tf = await import('@tensorflow/tfjs');

        // Check if model.json and labels.json exist
        const labelsResp = await fetch(`${basePath}/labels.json`);
        if (!labelsResp.ok) throw new Error('labels-not-found');
        const labels = await labelsResp.json();

        const model = await tf.loadLayersModel(`${basePath}/model.json`);

        if (!isCancelled) {
          tfModelRef.current = model;
          tfLabelsRef.current = labels;
          setModelStatus('ready');
          setModelMessage(null);
        }
      } catch (err) {
        if (!isCancelled) {
          tfModelRef.current = null;
          tfLabelsRef.current = [];
          setModelStatus('missing');
          setModelMessage(
            isEn
              ? 'Recognition model not trained yet. Camera mirror and real-time landmark tracking remain fully functional.'
              : 'સાઇન ઓળખ મોડેલ હજુ તાલીમબદ્ધ નથી. કેમેરા મિરર અને રીઅલ-ટાઇમ લેન્ડમાર્ક ટ્રેકિંગ સક્રિય રહેશે.'
          );
        }
      }
    };

    loadTfModel();

    return () => {
      isCancelled = true;
    };
  }, [recognitionMode, isEn]);

  // ----------------------------------------------------------------------------
  // MediaPipe Vision HandLandmarker Initializer
  // ----------------------------------------------------------------------------
  const initHandLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;

    setIsInitializingVision(true);
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      landmarkerRef.current = landmarker;
      return landmarker;
    } catch (err) {
      console.warn('GPU delegate failed, attempting CPU fallback:', err);
      // Fallback to CPU delegate if GPU is unsupported
      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        landmarkerRef.current = landmarker;
        return landmarker;
      } catch (cpuErr) {
        console.error('Failed to load MediaPipe HandLandmarker:', cpuErr);
        throw cpuErr;
      }
    } finally {
      setIsInitializingVision(false);
    }
  };

  // ----------------------------------------------------------------------------
  // Camera Toggle
  // ----------------------------------------------------------------------------
  const toggleCamera = async () => {
    if (isCameraActive) {
      // Stop Camera
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setRecognitionStatusText('idle');
      setActivePrediction(null);
    } else {
      // Start Camera
      setCameraError(null);
      try {
        const landmarker = await initHandLandmarker();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsCameraActive(true);
            startTrackingLoop(landmarker);
          };
        }
      } catch (err) {
        console.warn('Camera or vision error:', err);
        setCameraError(
          isEn
            ? 'Camera access denied or device not found. Please enable camera permission.'
            : 'કેમેરા મંજૂરી નકારાઈ અથવા ઉપલબ્ધ નથી. કૃપા કરીને બ્રાઉઝર સેટિંગ્સમાંથી કેમેરા ચાલુ કરો.'
        );
      }
    }
  };

  // ----------------------------------------------------------------------------
  // Real-time Hand Landmark & Prediction Detection Loop
  // ----------------------------------------------------------------------------
  const startTrackingLoop = (landmarker) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    let lastVideoTime = -1;

    const loop = () => {
      if (!video || video.paused || video.ended) return;

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        // Sync canvas size with video viewport
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Detect landmarks
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const rawLandmarks = results.landmarks[0];

          // Draw landmarks overlay
          if (showSkeleton) {
            drawHandOverlay(ctx, rawLandmarks, canvas.width, canvas.height);
          }

          // Step 5B: Normalize landmarks into 63 floats
          const normalized63 = normalizeHandLandmarks(rawLandmarks);

          // Step 5C & 5D: Model classification
          if (tfModelRef.current && normalized63.length === 63) {
            handleModelInference(normalized63);
          } else {
            // No model trained: never fake predictions
            setRecognitionStatusText('model-missing');
          }
        } else {
          // No hand detected in frame
          setRecognitionStatusText('no-hand');
          recentPredictionsRef.current = [];
          setActivePrediction(null);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  // ----------------------------------------------------------------------------
  // Draw Hand Landmarks & Connections on Mirrored Canvas
  // ----------------------------------------------------------------------------
  const drawHandOverlay = (ctx, landmarks, width, height) => {
    ctx.save();

    // Draw Connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b'; // amber-500

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        // Mirror X coordinates to match mirrored video display
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }
    });

    // Draw Landmark Points
    landmarks.forEach((pt, index) => {
      const x = (1 - pt.x) * width;
      const y = pt.y * height;

      ctx.beginPath();
      ctx.arc(x, y, index === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = index === 0 ? '#ef4444' : '#10b981'; // wrist = red, joints = emerald
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  };

  // ----------------------------------------------------------------------------
  // Model Inference Pipeline (5C, 5D, 5E)
  // ----------------------------------------------------------------------------
  const handleModelInference = (normalized63) => {
    const model = tfModelRef.current;
    const labels = tfLabelsRef.current;
    if (!model || !labels || labels.length === 0) return;

    try {
      import('@tensorflow/tfjs').then((tf) => {
        let inputTensor;

        if (recognitionMode === 'static') {
          inputTensor = tf.tensor2d([normalized63]);
        } else {
          // Dynamic 30-frame window
          frameWindowRef.current.push(normalized63);
          if (frameWindowRef.current.length > 30) {
            frameWindowRef.current.shift();
          }
          if (frameWindowRef.current.length < 30) {
            setRecognitionStatusText('collecting-frames');
            return;
          }
          inputTensor = tf.tensor3d([frameWindowRef.current]);
        }

        const prediction = model.predict(inputTensor);
        const probabilities = prediction.dataSync();
        inputTensor.dispose();
        prediction.dispose();

        // Find highest probability
        let maxIndex = 0;
        let maxProb = -1;
        for (let i = 0; i < probabilities.length; i++) {
          if (probabilities[i] > maxProb) {
            maxProb = probabilities[i];
            maxIndex = i;
          }
        }

        const candidateLabel = labels[maxIndex] || null;

        // Record in rolling predictions buffer
        recentPredictionsRef.current.push({
          label: candidateLabel,
          confidence: maxProb,
        });

        if (recentPredictionsRef.current.length > 10) {
          recentPredictionsRef.current.shift();
        }

        // Step 5E: Validation gate (confidence >= 0.80 and stable for 5 frames)
        const { isStable, validatedPrediction } = validatePredictionStability(
          recentPredictionsRef.current,
          0.8,
          5
        );

        if (isStable && validatedPrediction) {
          setActivePrediction(validatedPrediction);
          setRecognitionStatusText('recognized');

          // Auto-speak ONLY after explicit user confirmation (never on raw unconfirmed recognition)
        } else {
          setActivePrediction(null);
          setRecognitionStatusText('unrecognized');
        }
      });
    } catch (err) {
      console.warn('Inference error:', err);
    }
  };

  // ----------------------------------------------------------------------------
  // 5F. Confirmed Text Buffer Controls
  // ----------------------------------------------------------------------------
  const handleConfirmCurrentSign = async () => {
    if (!activePrediction?.label) return;
    const signToAdd = activePrediction.label;

    const updated = [...confirmedSigns, signToAdd];
    setConfirmedSigns(updated);
    showToast(isEn ? `Confirmed "${signToAdd}"!` : `"${signToAdd}" માન્ય કરાયું!`);

    // Step 5G: Auto-speak only after explicit user confirmation
    if (autoSpeakEnabled) {
      await speak(signToAdd, { lang: 'gu-IN' });
    }
  };

  const handleDeleteLastSign = () => {
    if (confirmedSigns.length === 0) return;
    setConfirmedSigns((prev) => prev.slice(0, -1));
  };

  const handleClearBuffer = () => {
    setConfirmedSigns([]);
    stopSpeaking();
    setIsSpeaking(false);
  };

  const handleSaveManualEdit = () => {
    const trimmed = manualEditText.trim();
    if (trimmed) {
      setConfirmedSigns(trimmed.split(/\s+/));
    } else {
      setConfirmedSigns([]);
    }
    setIsEditingBuffer(false);
  };

  // ----------------------------------------------------------------------------
  // 5G. Sign → Speech
  // ----------------------------------------------------------------------------
  const handleSpeakConfirmedSentence = async () => {
    const fullText = confirmedSigns.join(' ').trim();
    if (!fullText) return;

    setTtsNotice(null);
    setIsSpeaking(true);

    const result = await speak(fullText, { lang: 'gu-IN' });
    setIsSpeaking(false);

    if (!result.ok) {
      if (result.reason === 'no-voice') {
        setTtsNotice(
          isEn
            ? 'No Gujarati text-to-speech voice installed in your browser/device.'
            : 'તમારા ઉપકરણમાં ગુજરાતી અવાજ (TTS Voice) ઉપલબ્ધ નથી.'
        );
      } else {
        setTtsNotice(isEn ? 'Speech output failed.' : 'અવાજ આઉટપુટ નિષ્ફળ રહ્યું.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Main Camera & Landmark HUD Viewport */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl text-white space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isEn ? 'Sign → Text/Speech' : 'સાઇન → ટેક્સ્ટ/વાણી'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {recognitionMode === 'static'
                  ? isEn
                    ? 'Static Mode (Letters & Numbers)'
                    : 'સ્ટેટિક મોડ (અક્ષરો અને અંકો)'
                  : isEn
                  ? 'Dynamic Mode (30-Frame Words)'
                  : 'ડાયનેમિક મોડ (શબ્દો)'}
              </span>
            </div>
          </div>

          {/* Mode Switcher & Camera Controls */}
          <div className="flex items-center gap-1.5">
            {/* Static / Dynamic Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setRecognitionMode('static')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  recognitionMode === 'static' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isEn ? 'Static' : 'સ્ટેટિક'}
              </button>
              <button
                type="button"
                onClick={() => setRecognitionMode('dynamic')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  recognitionMode === 'dynamic' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isEn ? 'Dynamic' : 'ડાયનેમિક'}
              </button>
            </div>

            {/* Hand Skeleton Overlay Toggle */}
            <button
              type="button"
              onClick={() => setShowSkeleton(!showSkeleton)}
              title={isEn ? 'Toggle landmark skeleton' : 'હેન્ડ લેન્ડમાર્ક ચાલુ/બંધ'}
              aria-label={isEn ? 'Toggle landmark skeleton' : 'હેન્ડ લેન્ડમાર્ક ચાલુ/બંધ'}
              className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1 ${
                showSkeleton ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Camera Start / Stop Button */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                isCameraActive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              <span>{isCameraActive ? (isEn ? 'Stop Camera' : 'કેમેરા બંધ') : isEn ? 'Start Camera' : 'કેમેરા શરૂ'}</span>
            </button>
          </div>
        </div>

        {/* Missing Model Notice (Accurate, Non-fabricated) */}
        {modelMessage && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>{isEn ? 'Status: ' : 'સ્થિતિ: '}</strong>
              {modelMessage}
            </div>
          </div>
        )}

        {/* Mirrored Camera Viewport + Live MediaPipe Canvas Overlay */}
        <div className="relative w-full aspect-video max-h-[360px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
          {/* Mirrored Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] ${isCameraActive ? 'opacity-90' : 'hidden'}`}
          />

          {/* Mirrored Landmark Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${isCameraActive ? '' : 'hidden'}`}
          />

          {/* Camera Idle Placeholder */}
          {!isCameraActive && (
            <div className="text-center p-6 space-y-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-2xl">
                📷
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                {isEn ? 'Camera is currently off' : 'કેમેરા બંધ છે'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isEn
                  ? 'Click "Start Camera" to enable real-time MediaPipe hand tracking and bounded sign classification.'
                  : 'રીઅલ-ટાઇમ હેન્ડ ટ્રેકિંગ અને સાઇન ઓળખ માટે "કેમેરા શરૂ" કરો.'}
              </p>
            </div>
          )}

          {/* Loading MediaPipe Vision Models */}
          {isInitializingVision && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-300">
                {isEn ? 'Initializing MediaPipe HandLandmarker...' : 'મીડિયાપાઇપ વિઝન લોડ થઈ રહ્યું છે...'}
              </span>
            </div>
          )}

          {/* Real-time Recognition Status HUD */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs border border-white/10 rounded-xl p-2.5 text-xs z-20 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">{isEn ? 'Recognition:' : 'ઓળખાયેલ સાઇન:'}</span>
                {activePrediction ? (
                  <span lang="gu" className="font-black text-amber-400 text-sm">
                    {activePrediction.label}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">
                    {recognitionStatusText === 'no-hand'
                      ? isEn
                        ? 'Place hand in frame'
                        : 'હાથ કેમેરા સામે રાખો'
                      : isEn
                      ? 'Sign not recognized'
                      : 'સંકેત ઓળખાયો નથી'}
                  </span>
                )}
              </div>

              {activePrediction && (
                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                  <span>
                    {isEn ? 'Confidence:' : 'ચોકસાઈ:'}{' '}
                    <strong>{(activePrediction.confidence * 100).toFixed(1)}%</strong>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {isEn ? '5-frame stable' : 'સ્થિર'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Permission / Error Banner */}
        {cameraError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Confirm Prediction Button (Gated to User-Confirmed Action) */}
        {activePrediction && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {isEn ? 'Detected Stable Sign' : 'ઓળખાયેલ સ્થિર સંકેત'}
              </span>
              <span lang="gu" className="text-base font-black text-white">
                {activePrediction.label}{' '}
                <span className="text-xs font-medium text-amber-400">
                  ({(activePrediction.confidence * 100).toFixed(1)}%)
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmCurrentSign}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Confirm Sign (+)' : 'માન્ય કરો અને ઉમેરો (+)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5F & 5G. User-Confirmed Text Buffer & Speech Output */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isEn ? 'User-Confirmed Gujarati Sentence Buffer' : 'ચકાસાયેલ ગુજરાતી વાક્ય બફર'}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isEn
                ? 'Only explicitly user-confirmed signs are spoken aloud or added to transcript.'
                : 'માત્ર વપરાશકર્તા દ્વારા માન્ય કરેલા સંકેતો જ બોલાવવામાં આવે છે.'}
            </span>
          </div>

          {/* Buffer Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setManualEditText(confirmedSigns.join(' '));
                setIsEditingBuffer(!isEditingBuffer);
              }}
              aria-label={isEn ? 'Edit sentence manually' : 'સંપાદિત કરો'}
              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditingBuffer ? (isEn ? 'Cancel' : 'રદ') : isEn ? 'Edit' : 'સુધારો'}</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteLastSign}
              disabled={confirmedSigns.length === 0}
              aria-label={isEn ? 'Delete last word' : 'છેલ્લો શબ્દ કાઢી નાખો'}
              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition flex items-center gap-1"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>{isEn ? 'Delete' : 'કાઢી નાખો'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearBuffer}
              disabled={confirmedSigns.length === 0}
              aria-label={isEn ? 'Clear buffer' : 'સાફ કરો'}
              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Confirmed Sentence Display or Manual Editor */}
        {isEditingBuffer ? (
          <div className="space-y-2">
            <textarea
              lang="gu"
              value={manualEditText}
              onChange={(e) => setManualEditText(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-indigo-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveManualEdit}
                className="min-h-[36px] px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? 'Save Edit' : 'સાચવો'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 min-h-[75px] flex items-center">
            {confirmedSigns.length > 0 ? (
              <p lang="gu" className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
                {confirmedSigns.join(' ')}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isEn
                  ? 'No signs confirmed yet. Use camera to detect and confirm signs above.'
                  : 'હજુ કોઈ સંકેત માન્ય કરાયો નથી. ઉપર કેમેરાથી સાઇન ઓળખી ઉમેરો.'}
              </p>
            )}
          </div>
        )}

        {/* Speak Controls & Auto-Speak Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Auto-Speak Toggle (OFF by default) */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={autoSpeakEnabled}
              onChange={(e) => setAutoSpeakEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              {isEn
                ? 'Auto-speak sign after explicit confirmation'
                : 'માન્ય કર્યા પછી આપમેળે અવાજ બોલાવો'}
            </span>
          </label>

          {/* Manual Speak Button */}
          <button
            type="button"
            onClick={handleSpeakConfirmedSentence}
            disabled={confirmedSigns.length === 0 || isSpeaking}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-40"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isEn ? 'Speak Confirmed Sentence' : 'વાક્ય અવાજમાં બોલો'}</span>
          </button>
        </div>

        {ttsNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{ttsNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};
