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
  const capUrl = `${BASE}monkey-cap-png.png`;

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
        const videoWidth = video.videoWidth;

        const face: FaceDetection = {
          x: bb.x + bb.width / 2,
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
  const face = smoothedFaceRef.current;
  if (!video || !canvas) return;

  setIsCapturing(true);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas to camera resolution
  const w = video.videoWidth;
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;

  // 1. Mirror the video frame
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -w, 0, w, h);
  ctx.restore();

  // 2. Overlay the cap onto the canvas image
  if (face) {
    const capImg = new Image();
    capImg.src = capUrl;
    
    const capWidth = face.width * 1.4;
    // IMPORTANT: Make sure this matches your PNG's proportions
    const capHeight = capWidth * 1.2; 

    ctx.save();
    // Move to face position (adjusted for mirrored canvas)
    ctx.translate(w - face.x, face.y);
    ctx.rotate(-4 * Math.PI / 180);
    // Center cap and move it up to the forehead (-0.45)
    ctx.drawImage(capImg, -capWidth / 2, -capHeight * 0.45, capWidth, capHeight);
    ctx.restore();
  }

  // 3. Apply the cinematic look
  drawBranding(ctx, w, h);

  const dataUrl = canvas.toDataURL("image/png");
  setIsCapturing(false);
  
  // Send the finished image back to App.tsx
  onCapture(dataUrl); 
}, [onCapture, capUrl]);

// Add this helper function at the very bottom of your CameraView.tsx file
const drawBranding = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  // 1. Subtle Grain/Overlay
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, w, h);

  // 2. Cinematic Vignette
  const gradient = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.4, // Inner circle radius
    w / 2,
    h / 2,
    h * 1.1  // Outer circle radius
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.7)"); // Darkness at edges
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // 3. CRT Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
};

return (
  <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
    {/* Camera container */}
    <div className="relative w-full h-screen overflow-hidden">
      {/* Mirrored video stream */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
        autoPlay
      />

      {/* 🧢 DYNAMIC MONKEY CAP OVERLAY */}
      {/* Only renders when a face is detected to avoid floating in empty space */}
      {faceFound && smoothedFaceRef.current && (
        <img
          src={capUrl}
          className="absolute z-30 pointer-events-none transition-all duration-75"
          style={{
            // smoothedFaceRef coordinates are relative to the video resolution
            // We convert them to percentages for CSS positioning
            left: `${(smoothedFaceRef.current.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
            top: `${(smoothedFaceRef.current.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
            
            // Dynamic width: Makes the cap 140% of the face width for a natural fit
            width: `${(smoothedFaceRef.current.width / (videoRef.current?.videoWidth || 1)) * 140}%`,
            
            // translate -50% on X centers it on the face
            // translate -45% on Y moves it up from the eyes to the forehead
            transform: "translate(-50%, -45%) rotate(-4deg)", 
          }}
        />
      )}

      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* UI Overlay: Title */}
      <div className="absolute top-[-25px] left-0 right-0 z-20 pt-safe">
        <div className="flex flex-col items-center">
          <img
            src={`${BASE}kidnapped-title.png`}
            alt="KIDNAPPED"
            className="w-[80%] max-w-xs object-contain"
          />
          <div className="h-[2px] bg-red-600 mt-1 scan-line w-full" />
        </div>
      </div>

      {/* UI Overlay: Bottom Instruction */}
      <div className="absolute bottom-32 left-0 right-0 z-20 flex justify-center text-center px-6">
        <span
          className="text-sm text-white/80 tracking-wide leading-relaxed"
          style={{
            fontFamily: "'Courier New', monospace",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          }}
        >
          {faceFound ? "IDENTITY DETECTED" : "ALIGN YOUR FACE"} <br />
          <span className="text-[10px] opacity-60">TAP TO GENERATE YOUR ID</span>
        </span>
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(0,0,0,0.55)_100%)]" />
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
        }}
      />

      {/* Face Tracking Status Indicator */}
      {!usingFallback && (
        <div className="absolute top-20 right-4 z-30 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full border border-white/10">
          <div
            className={`w-2 h-2 rounded-full ${faceFound ? "bg-green-400" : "bg-red-500 animate-pulse"}`}
          />
          <span
            className="text-[9px] text-white/70 uppercase tracking-widest"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {faceFound ? "LOCK" : "SCAN"}
          </span>
        </div>
      )}

      {/* Initialization Spinner */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
            <span className="text-xs text-white/40 tracking-[0.3em] uppercase">Booting System...</span>
          </div>
        </div>
      )}

      {/* Capture Button Container */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center z-40">
        <button
          onClick={handleCapture}
          disabled={isCapturing || status === "loading" || !faceFound}
          className="relative w-20 h-20 rounded-full border-4 border-white/90 bg-transparent transition-all duration-150 active:scale-95 disabled:opacity-20 disabled:grayscale"
          style={{ boxShadow: "0 0 20px rgba(0,0,0,0.8)" }}
        >
          <div className="absolute inset-[4px] rounded-full bg-white/90" />
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            </div>
          )}
        </button>
      </div>

      {/* Corner Brackets (Framing) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-[20%] left-[10%] w-8 h-8 border-t-2 border-l-2 border-white/20" />
        <div className="absolute top-[20%] right-[10%] w-8 h-8 border-t-2 border-r-2 border-white/20" />
        <div className="absolute bottom-[25%] left-[10%] w-8 h-8 border-b-2 border-l-2 border-white/20" />
        <div className="absolute bottom-[25%] right-[10%] w-8 h-8 border-b-2 border-r-2 border-white/20" />
      </div>
    </div>
  </div>
);
}
