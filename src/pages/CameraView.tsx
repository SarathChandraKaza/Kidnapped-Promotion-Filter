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
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const capImageRef = useRef<HTMLImageElement | null>(null);
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

  const drawCapOnCanvas = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const cap = capImageRef.current;
    if (!canvas || !video || !cap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const face = smoothedFaceRef.current;
    if (!face) return;

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    const faceX = face.x * scaleX;
    const faceY = face.y * scaleY;
    const faceW = face.width * scaleX;
    const faceH = face.height * scaleY;

    // Cap sizing: wider than face, positioned above head
    const capW = faceW * 2.2;
    const capH = capW * 0.75;

    // Mirror for front camera: invert x position
    const mirroredFaceX = canvas.width - (faceX + faceW);

    // Center cap horizontally over face
    const capX = mirroredFaceX + faceW / 2 - capW / 2;

    // Position cap above the top of face with slight overlap
    const capY = faceY - capH * 0.72;

    // Slight natural tilt
    const tiltAngle = -0.05; // ~-3 degrees

    ctx.save();
    ctx.translate(capX + capW / 2, capY + capH / 2);
    ctx.rotate(tiltAngle);
    ctx.drawImage(cap, -capW / 2, -capH / 2, capW, capH);
    ctx.restore();
  }, []);

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

  const renderLoop = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    if (smoothedFaceRef.current) {
      drawCapOnCanvas();
    }

    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [drawCapOnCanvas]);

  useEffect(() => {
    let mounted = true;

    const img = new Image();
    img.onload = () => {
      capImageRef.current = img;
    };
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
        animFrameRef.current = requestAnimationFrame(renderLoop);
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
  }, [detectFace, detectFaceWithFallback, onError, renderLoop, usingFallback, capUrl]);

  // When fallback is triggered, start detection
  useEffect(() => {
    if (usingFallback && status === "loading") {
      setStatus("no-face");
    }
  }, [usingFallback, status]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current;
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
    const drawText = () => {
      // Subtle grain overlay
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, w, h);

      // Vignette
      const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Scanlines
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.04)";
        ctx.fillRect(0, y, w, 1);
      }

      const fontBase = Math.min(w, h);

      // Top: KIDNAPPED
      ctx.font = `bold ${fontBase * 0.12}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText("KIDNAPPED", w / 2 + 2, fontBase * 0.14 + 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("KIDNAPPED", w / 2, fontBase * 0.14);

      // Red underline
      ctx.strokeStyle = "#cc0000";
      ctx.lineWidth = fontBase * 0.004;
      const textW = ctx.measureText("KIDNAPPED").width;
      ctx.beginPath();
      ctx.moveTo(w / 2 - textW / 2, fontBase * 0.14 + fontBase * 0.01);
      ctx.lineTo(w / 2 + textW / 2, fontBase * 0.14 + fontBase * 0.01);
      ctx.stroke();

      // Bottom text
      ctx.font = `${fontBase * 0.06}px 'Courier New', monospace`;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText("I am the kidnapper", w / 2 + 1, h - fontBase * 0.28 + 1);
      ctx.fillStyle = "#eeeeee";
      ctx.fillText("I am the kidnapper", w / 2, h - fontBase * 0.28);

      // Hashtag
      ctx.font = `bold ${fontBase * 0.055}px 'Courier New', monospace`;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText("#Kidnapped", w / 2 + 1, h - fontBase * 0.17 + 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("#Kidnapped", w / 2, h - fontBase * 0.17);

      // Handle
      ctx.font = `${fontBase * 0.045}px 'Courier New', monospace`;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillText("@sarath.chandra.k", w / 2 + 1, h - fontBase * 0.09 + 1);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText("@sarath.chandra.k", w / 2, h - fontBase * 0.09);

      // Tag instruction at bottom
      ctx.font = `${fontBase * 0.035}px 'Courier New', monospace`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("Tag 2 people who should be kidnapped next", w / 2, h - fontBase * 0.03);
    };

    // Draw cap overlay if available
    if (overlayCanvas && overlayCanvas.width > 0) {
      ctx.drawImage(overlayCanvas, 0, 0, w, h);
    }

    drawText();

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

        {/* Overlay canvas (cap drawing) - also mirrored to match video */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Hidden capture canvas (not mirrored, captures final output) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top: KIDNAPPED text */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
          <div className="flex flex-col items-center pt-6">
            <span
              className="text-4xl font-bold tracking-[0.25em] text-white uppercase"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)",
              }}
            >
              KIDNAPPED
            </span>
            <div
              className="h-[2px] bg-red-600 mt-1"
              style={{ width: "85%" }}
            />
          </div>
        </div>

        {/* Bottom overlay texts */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
          <div className="flex flex-col items-center pb-28 gap-1">
            <span
              className="text-xl text-white tracking-wider"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "1px 1px 6px rgba(0,0,0,0.9)",
              }}
            >
              I am the kidnapper
            </span>
            <span
              className="text-base font-bold text-white tracking-widest"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "1px 1px 6px rgba(0,0,0,0.9)",
              }}
            >
              #Kidnapped
            </span>
            <span
              className="text-sm text-white/70 tracking-wide"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "1px 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              @sarath.chandra.k
            </span>
            <span
              className="text-xs text-white/50 tracking-wide text-center px-4"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              Tag 2 people who should be kidnapped next
            </span>
          </div>
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
