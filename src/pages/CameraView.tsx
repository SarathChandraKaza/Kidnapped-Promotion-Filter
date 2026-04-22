import { useRef, useEffect, useState, useCallback } from "react";

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  onError: () => void;
}

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly; landmarks?: Array<{ locations: DOMPoint[]; type: string }> }>>;
    };
  }
}

export function CameraView({ onCapture, onError }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectorRef = useRef<InstanceType<NonNullable<typeof window.FaceDetector>> | null>(null);
  const lastFaceRef = useRef<FaceDetection | null>(null);
  const smoothedFaceRef = useRef<FaceDetection | null>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "no-face">("loading");
  const [faceFound, setFaceFound] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const BASE = import.meta.env.BASE_URL;
  const capUrl = `${BASE}monkey-cap.svg`;

  const titleImageRef = useRef<HTMLImageElement | null>(null);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const smoothFace = (current: FaceDetection | null, target: FaceDetection): FaceDetection => {
    if (!current) return { ...target };
    const t = 0.2;
    return {
      x: lerp(current.x, target.x, t),
      y: lerp(current.y, target.y, t),
      width: lerp(current.width, target.width, t),
      height: lerp(current.height, target.height, t),
      confidence: target.confidence,
    };
  };

  const detectFaceWithFallback = useCallback(() => {
    // Simple fallback: assume face is in center of video
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    const fallbackFace: FaceDetection = {
      x: w * 0.25,
      y: h * 0.15,
      width: w * 0.5,
      height: h * 0.55,
      confidence: 0.5,
    };

    lastFaceRef.current = fallbackFace;
    smoothedFaceRef.current = smoothFace(smoothedFaceRef.current, fallbackFace);
    setFaceFound(true);
    setStatus("ready");
  }, []);

  const detectFace = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !faceDetectorRef.current) return;

    try {
      const detections = await faceDetectorRef.current.detect(video);
      if (detections && detections.length > 0) {
        const det = detections[0];
        const bb = det.boundingBox;
        const face: FaceDetection = {
          x: bb.x,
          y: bb.y,
          width: bb.width,
          height: bb.height,
          confidence: 1,
        };
        lastFaceRef.current = face;
        smoothedFaceRef.current = smoothFace(smoothedFaceRef.current, face);
        setFaceFound(true);
        setStatus("ready");
      } else {
        if (lastFaceRef.current) {
          // Keep showing last known face position faded out
          setStatus("ready");
        } else {
          setStatus("no-face");
          setFaceFound(false);
        }
      }
    } catch {
      // FaceDetector failed, use fallback
      setUsingFallback(true);
      detectFaceWithFallback();
    }
  }, [detectFaceWithFallback]);


  useEffect(() => {
    let mounted = true;
    const titleImg = new Image();
titleImg.src = `${BASE}kidnapped-title.png`;
titleImg.onload = () => {
  titleImageRef.current = titleImg;
};

    const img = new Image();
    img.src = capUrl;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }

        // Try to init FaceDetector API
        if (window.FaceDetector) {
          try {
            faceDetectorRef.current = new window.FaceDetector({
              maxDetectedFaces: 1,
              fastMode: true,
            });
          } catch {
            setUsingFallback(true);
          }
        } else {
          setUsingFallback(true);
        }

        setStatus("no-face");

        // Start detection interval
        detectionIntervalRef.current = setInterval(() => {
          if (faceDetectorRef.current && !usingFallback) {
            detectFace();
          } else {
            detectFaceWithFallback();
          }
        }, 200);

        // Start render loop
      } catch {
        if (mounted) onError();
      }
    }

    startCamera();

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameRef.current);
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [detectFace, detectFaceWithFallback, onError, usingFallback, capUrl]);

  // When fallback is triggered, start detection
  useEffect(() => {
    if (usingFallback && status === "loading") {
      setStatus("no-face");
    }
  }, [usingFallback, status]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsCapturing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    // Draw mirrored video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    // Draw cinematic overlay text
const drawBranding = () => {
  // Subtle grain
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const gradient = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.3,
    w / 2,
    h / 2,
    h * 0.9
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Scanlines
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    ctx.fillRect(0, y, w, 1);
  }

  // 🔥 Optional: Logo only (clean branding)
  const fontBase = Math.min(w, h);

};
    drawBranding();

    const dataUrl = canvas.toDataURL("image/png");
    setIsCapturing(false);
    onCapture(dataUrl);
  }, [onCapture]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Camera container */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Mirrored video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
          autoPlay
        />

        {/* Hidden capture canvas (not mirrored, captures final output) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top: KIDNAPPED text */}
        <div className="absolute top-[-25px] left-0 right-0 z-20 pt-safe">
          <div className="flex flex-col items-center">
            <img
              src={`${BASE}kidnapped-title.png`}
              alt="KIDNAPPED"
              className="w-[80%] max-w-xs object-contain"
            />
          <div className="h-[2px] bg-red-600 mt-1 scan-line" />
          </div>
        </div>

        {/* Bottom instruction */}
        <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center">
          <span
            className="text-sm text-white/80 tracking-wide"
            style={{
              fontFamily: "'Courier New', monospace",
              textShadow: "2px 2px 0px rgba(0,0,0,1)",
            }}
          >
            Tap to capture your photo for ID
          </span>
        </div>
        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(0,0,0,0.55)_100%)]" />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
          }}
        />

        {/* Face tracking indicator */}
        {!usingFallback && (
          <div className="absolute top-20 right-4 z-30 flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${faceFound ? "bg-green-400" : "bg-yellow-400"} tracking-pulse`}
            />
            <span
              className="text-[10px] text-white/50 uppercase tracking-wider"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {faceFound ? "TRACKED" : "SCANNING"}
            </span>
          </div>
        )}

        {/* Loading state */}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full spin-slow" />
              <span
                className="text-sm text-white/60 tracking-widest uppercase"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                Initializing...
              </span>
            </div>
          </div>
        )}

        {/* Capture button */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center z-30">
          <button
            onClick={handleCapture}
            disabled={isCapturing || status === "loading"}
            className="relative w-20 h-20 rounded-full border-4 border-white/90 bg-transparent transition-all duration-150 active:scale-90 disabled:opacity-40"
            style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.8)" }}
          >
            <div className="absolute inset-[6px] rounded-full bg-white/90 transition-all duration-150 active:scale-90" />
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black/30 border-t-black rounded-full spin-slow" />
              </div>
            )}
          </button>
        </div>

        {/* Corner brackets */}
        <div className="absolute top-[25%] left-[15%] w-6 h-6 border-t-2 border-l-2 border-white/30 pointer-events-none z-20" />
        <div className="absolute top-[25%] right-[15%] w-6 h-6 border-t-2 border-r-2 border-white/30 pointer-events-none z-20" />
        <div className="absolute bottom-[35%] left-[15%] w-6 h-6 border-b-2 border-l-2 border-white/30 pointer-events-none z-20" />
        <div className="absolute bottom-[35%] right-[15%] w-6 h-6 border-b-2 border-r-2 border-white/30 pointer-events-none z-20" />
      </div>
    </div>
  );
}
