import { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { recognizedGesturesList } from '../../data/phrasebookData';
import {
  Camera,
  CameraOff,
  Volume2,
  Plus,
  Layers
} from 'lucide-react';
import { Card, Button, Chip } from '../ui';

export const SignRecognition = () => {
  const { speakText, showToast, uiLanguage } = useApp();
  const isEn = uiLanguage === 'en';

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [activeGestureIdx, setActiveGestureIdx] = useState(0);
  const [recognizedSentence, setRecognizedSentence] = useState('નમસ્તે, મને મદદ જોઈએ છે.');
  const [showSkeleton, setShowSkeleton] = useState(true);

  const currentGesture = recognizedGesturesList[activeGestureIdx];

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Camera permission denied or unavailable:', err);
        setCameraError(isEn
          ? 'Camera not accessible or permission denied.'
          : 'કેમેરા ઉપલબ્ધ નથી અથવા મંજૂરી નકારાઈ.');
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let angle = 0;

    const renderLandmarks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showSkeleton) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + Math.sin(angle) * 5;
        angle += 0.05;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 30, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const fingers = [-40, -20, 0, 20, 40];
        fingers.forEach((fx, i) => {
          const topY = centerY - 40 - (i === 2 ? 15 : 0);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY + 20);
          ctx.lineTo(centerX + fx, centerY);
          ctx.lineTo(centerX + fx * 1.2, topY);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(centerX + fx * 1.2, topY, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(renderLandmarks);
    };

    renderLandmarks();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showSkeleton, activeGestureIdx]);

  const addGestureToSentence = () => {
    const cleaned = currentGesture.gesture.split(' ')[0];
    setRecognizedSentence(prev => prev ? `${prev} ${cleaned}` : cleaned);
    showToast(isEn ? `Added "${cleaned}" to transcript!` : `"${cleaned}" વાક્યમાં ઉમેર્યું!`);
  };

  const handleSpeakSentence = () => {
    if (recognizedSentence) {
      speakText(recognizedSentence);
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Camera Feed & Landmark HUD */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            {isEn ? 'Camera sign practice (prototype)' : 'કેમેરા સાઇન પ્રેક્ટિસ (પ્રોટોટાઇપ)'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSkeleton(!showSkeleton)}
              aria-pressed={showSkeleton}
              className={`inline-flex items-center gap-1.5 min-h-tap px-3 rounded-xl text-sm border transition ${
                showSkeleton ? 'bg-canvas border-ink-muted font-bold' : 'bg-surface border-line text-ink-muted font-medium'
              }`}
            >
              <Layers className="w-4 h-4" aria-hidden="true" />
              {showSkeleton ? (isEn ? 'Hand guide on' : 'હેન્ડ ગાઇડ ચાલુ') : (isEn ? 'Hand guide off' : 'હેન્ડ ગાઇડ બંધ')}
            </button>
            <Button variant={isCameraActive ? 'secondary' : 'primary'} onClick={toggleCamera}>
              {isCameraActive ? <CameraOff className="w-4 h-4" aria-hidden="true" /> : <Camera className="w-4 h-4" aria-hidden="true" />}
              {isCameraActive ? (isEn ? 'Stop camera' : 'કેમેરા બંધ') : (isEn ? 'Start camera' : 'કેમેરા શરૂ')}
            </Button>
          </div>
        </div>

        <p className="text-sm p-3 rounded-xl bg-canvas border border-line">
          {isEn
            ? 'AI sign recognition model is not yet connected. The camera functions as a visual mirror for signing practice. Use the reference signs below to practice and assemble Gujarati sentences.'
            : 'AI સાઇન ઓળખ મોડેલ હજુ જોડાયેલ નથી. કેમેરા સાઇનિંગ પ્રેક્ટિસ માટે મિરર તરીકે કાર્ય કરે છે. વાક્ય બનાવવા નીચે આપેલા સંદર્ભ સંકેતોનો ઉપયોગ કરો.'}
        </p>

        {/* Viewport for Video + Canvas Overlay */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video bg-ink rounded-2xl overflow-hidden flex items-center justify-center">
          {isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}

          {!isCameraActive && (
            <div className="text-center p-4 z-10 space-y-2 text-white">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" aria-hidden="true" />
              </div>
              <p className="font-bold">{isEn ? 'Camera is off' : 'કેમેરા બંધ છે'}</p>
              <p className="text-sm text-white/80 max-w-xs">
                {isEn
                  ? 'Press "Start camera" for mirror practice, or choose a reference sign below.'
                  : 'પ્રેક્ટિસ માટે "કેમેરા શરૂ" કરો અથવા નીચેથી સંદર્ભ સંકેત પસંદ કરો.'}
              </p>
            </div>
          )}

          {/* Canvas Landmark Overlay */}
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />

          {/* HUD Reference Sign Display */}
          <div className="absolute top-3 left-3 bg-ink/85 rounded-lg px-2.5 py-1.5 text-sm z-30 text-white">
            <span className="text-white/80">{isEn ? 'Selected sign:' : 'પસંદ કરેલ સાઇન:'}</span>{' '}
            <span className="font-bold">{currentGesture.gesture}</span>
          </div>

          <div className="absolute bottom-3 right-3 bg-ink/85 rounded-lg px-2.5 py-1 text-xs text-white/80 z-30">
            {currentGesture.keypoints}
          </div>
        </div>

        {cameraError && (
          <p role="alert" className="text-sm p-3 rounded-xl bg-danger-soft text-danger font-medium">
            {cameraError}
          </p>
        )}

        {/* Gesture switcher to test different signs */}
        <div>
          <p className="text-sm font-semibold text-ink-muted mb-2">
            {isEn ? 'Reference signs: choose one, then add it to the sentence' : 'પ્રેક્ટિસ માટેના સંકેતો (પસંદ કરી વાક્યમાં ઉમેરો):'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {recognizedGesturesList.map((g, idx) => (
              <Chip key={idx} active={activeGestureIdx === idx} onClick={() => setActiveGestureIdx(idx)}>
                {g.gesture}
              </Chip>
            ))}
          </div>
        </div>

        <Button onClick={addGestureToSentence} className="w-full sm:w-auto min-h-[52px] text-base">
          <Plus className="w-5 h-5" aria-hidden="true" />
          {isEn ? 'Add sign to sentence' : 'આ સાઇન વાક્યમાં ઉમેરો'}
        </Button>
      </Card>

      {/* Recognized Gujarati Output Box */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{isEn ? 'Gujarati sentence' : 'બનાવેલ ગુજરાતી વાક્ય'}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setRecognizedSentence('')}>
              {isEn ? 'Clear' : 'સાફ કરો'}
            </Button>
            <Button variant="secondary" onClick={handleSpeakSentence}>
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              {isEn ? 'Speak in Gujarati' : 'ગુજરાતીમાં બોલો'}
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-canvas border border-line min-h-[72px] flex items-center" aria-live="polite">
          <p className={`text-lg leading-relaxed ${recognizedSentence ? 'font-bold' : 'text-ink-muted'}`}>
            {recognizedSentence || (isEn ? 'Turn on camera for self-practice or select a reference sign above to build a sentence...' : 'સ્વ-પ્રેક્ટિસ માટે કેમેરા શરૂ કરો અથવા વાક્ય બનાવવા ઉપરથી સંકેત પસંદ કરો...')}
          </p>
        </div>
      </Card>
    </div>
  );
};
