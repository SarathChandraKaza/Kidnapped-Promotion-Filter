import { useMemo } from "react";
import { analytics } from "@/analytics";

interface PreviewPageProps {
  imageDataUrl: string;
  onRetake: () => void;
}

const cities = [
  "Dehradun",
  "Hyderabad",
  "Bengaluru",
  "Lucknow",
  "Bhopal",
  "Chandigarh",
  "Jaipur",
  "Pune",
  "Ahmedabad",
  "Kolkata",
];

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PreviewPage({ imageDataUrl, onRetake }: PreviewPageProps) {
  const identity = useMemo(() => {
    const kidnapperNo = Math.floor(Math.random() * 100) + 1;
    const batch = Math.floor(50 + Math.random() * 50);
    const city = cities[Math.floor(Math.random() * cities.length)];
    return {
      line1: `Roll No. ${kidnapperNo}`,
      line2: `${getOrdinal(batch)} Batch, Trained at ${city}`,
    };
  }, []);

  const buildCanvas = async (): Promise<HTMLCanvasElement> => {
    await document.fonts.ready;

    const [photoImg, titleImg, capImg] = await Promise.all([
      loadImage(imageDataUrl),
      loadImage("./kidnapped-title.png"),
      loadImage("./monkey-cap-png.png"),
    ]);

    const W = 1080;

    const L = {
      pad: 80,
      top: 20,
      titleGap: 0,
      schoolH: 50,
      schoolGap: 5,
      imageGap: 50,
      identityGap: 40,
      identityBottom: 70,
      taglineGap: 30,
      handlesGap: 30,
      instagramGap: 30,
      hashtagGap: 10,
    };

    const FS = {
      identity: 32,
      tagline: 32,
      handles: 48,
      instagram: 26,
      hashtag: 28,
      credits: 28,
    };

    const innerW = W - L.pad * 2;
    const titleDrawW = 600;
    const titleH = Math.round((titleImg.height / titleImg.width) * titleDrawW);
    const photoH = Math.round((photoImg.height / photoImg.width) * innerW);

    const totalH =
      L.top +
      titleH +
      L.schoolH +
      L.schoolGap +
      L.titleGap +
      photoH +
      L.imageGap +
      140 +
      FS.tagline +
      L.taglineGap +
      FS.handles +
      L.handlesGap +
      FS.hashtag +
      L.hashtagGap +
      40;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = Math.ceil(totalH);

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, canvas.height);
    ctx.textAlign = "center";

    let y = L.top;

    ctx.drawImage(titleImg, (W - titleDrawW) / 2, y, titleDrawW, titleH);
    y += titleH + L.titleGap;

    const boxStartY = y - 40;

    ctx.font = `italic 400 45px "Georgia", "Times New Roman", serif`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText("PARAYANA SCHOOL OF KIDNAPPING", W / 2, y);
    y += L.schoolH + L.schoolGap;

    const roundRect = (
      x: number,
      y0: number,
      w: number,
      h: number,
      r: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y0);
      ctx.lineTo(x + w - r, y0);
      ctx.quadraticCurveTo(x + w, y0, x + w, y0 + r);
      ctx.lineTo(x + w, y0 + h - r);
      ctx.quadraticCurveTo(x + w, y0 + h, x + w - r, y0 + h);
      ctx.lineTo(x + r, y0 + h);
      ctx.quadraticCurveTo(x, y0 + h, x, y0 + h - r);
      ctx.lineTo(x, y0 + r);
      ctx.quadraticCurveTo(x, y0, x + r, y0);
      ctx.closePath();
    };

    ctx.save();
    roundRect(L.pad, y, innerW, photoH, 24);
    ctx.clip();
    ctx.drawImage(photoImg, L.pad, y, innerW, photoH);
    ctx.drawImage(capImg, L.pad, y, innerW, photoH);
    ctx.restore();

    y += photoH + L.imageGap;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 ${FS.identity}px "Courier New", monospace`;
    ctx.fillText(identity.line1.toUpperCase(), W / 2, y);
    y += L.identityGap;
    ctx.fillText(identity.line2.toUpperCase(), W / 2, y);

    const boxEndY = y;
    y += L.identityBottom;

    ctx.save();
    const boxX = L.pad - 20;
    const boxW = innerW + 40;
    const boxY = boxStartY - 20;
    const boxH = boxEndY - boxStartY + 40;

    ctx.shadowColor = "rgba(255,255,255,0.15)";
    ctx.shadowBlur = 25;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 30);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 30);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4, 28);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
    gradient.addColorStop(0, "rgba(255,255,255,0.12)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.04)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 30);
    ctx.fill();
    ctx.restore();

    ctx.font = `400 ${FS.tagline}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("Tag two friends who should be KIDNAPPED next", W / 2, y);
    y += FS.tagline + L.taglineGap;

    ctx.font = `700 ${FS.handles}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = "white";
    ctx.fillText("@_______________   @_______________", W / 2, y);
    y += FS.handles + L.handlesGap;

    const iconSize = 30;
    const spacing = 16;
    ctx.font = `400 ${FS.instagram}px "Verdana", sans-serif`;
    const instaText = "@lawnmates.kino";
    const textWidth = ctx.measureText(instaText).width;
    const totalWidth = iconSize + spacing + textWidth;
    let startX = W / 2 - totalWidth / 2;
    const iconY = y - iconSize / 2;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(startX, iconY, iconSize, iconSize, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      startX + iconSize / 2,
      iconY + iconSize / 2,
      iconSize / 4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      startX + iconSize * 0.75,
      iconY + iconSize * 0.25,
      3,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(instaText, startX + iconSize + spacing, y);
    y += FS.instagram + L.instagramGap;

    ctx.font = `700 ${FS.hashtag}px "Verdana", sans-serif`;
    ctx.fillStyle = "#ff3b3b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("#KIDNAPPEDSHORTFILM", W / 2, y);

    return canvas;
  };

  // ── GENERATE ID (Download) ────────────────────────────────
  const handleDownload = async () => {
    analytics.trackGenerateId(); // ← TRACK
    try {
      const baseCanvas = await buildCanvas();
      const storyW = 1080,
        storyH = 1920;
      const storyCanvas = document.createElement("canvas");
      storyCanvas.width = storyW;
      storyCanvas.height = storyH;
      const ctx = storyCanvas.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, storyW, storyH);
      const scale = Math.min(
        storyW / baseCanvas.width,
        storyH / baseCanvas.height,
      );
      const drawW = baseCanvas.width * scale;
      const drawH = baseCanvas.height * scale;
      const x = (storyW - drawW) / 2;
      const y = (storyH - drawH) / 2;
      ctx.drawImage(baseCanvas, x, y, drawW, drawH);
      const link = document.createElement("a");
      link.download = "kidnapped_id.png";
      link.href = storyCanvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // ── POST ID (Share) ───────────────────────────────────────
  const handleShare = async () => {
    analytics.trackPostId(); // ← TRACK
    try {
      const baseCanvas = await buildCanvas();
      const storyW = 1080,
        storyH = 1920;
      const storyCanvas = document.createElement("canvas");
      storyCanvas.width = storyW;
      storyCanvas.height = storyH;
      const ctx = storyCanvas.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, storyW, storyH);
      const scale = Math.min(
        storyW / baseCanvas.width,
        storyH / baseCanvas.height,
      );
      const drawW = baseCanvas.width * scale;
      const drawH = baseCanvas.height * scale;
      const x = (storyW - drawW) / 2;
      const y = (storyH - drawH) / 2 - 60;
      ctx.drawImage(baseCanvas, x, y, drawW, drawH);
      const dataUrl = storyCanvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "kidnapped_id.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "KIDNAPPED",
          text: "I just got my ID. What about you? Share your ID on Instagram and tag @lawnmates.kino 👀 #kidnappedshortfilm",
          files: [file],
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "kidnapped_id.png";
        link.click();
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // ── WATCH KIDNAPPED ───────────────────────────────────────
  const handleWatch = () => {
    analytics.trackWatchKidnapped(); // ← TRACK
    analytics.flush(); // flush immediately on exit
    window.open("https://www.youtube.com/watch?v=TC0EsYiUmGw", "_blank");
  };

  return (
    <div className="relative h-screen flex flex-col items-center pt-8 pb-12 px-6 bg-[#0a0a0a] overflow-y-auto">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        <img
          src="./kidnapped-title.png"
          className="w-48 mb-8 opacity-90"
          alt="Logo"
        />

        <div className="w-full rounded-xl overflow-hidden border border-white/10 mb-6">
          <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
            <img
              src={imageDataUrl}
              className="absolute inset-0 w-full h-full object-cover block"
            />
            <img
              src="./monkey-cap-png.png"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              style={{ zIndex: 10 }}
              alt="Cap Overlay"
            />
          </div>
        </div>

        <p className="text-white/40 text-[10px] tracking-widest mb-4">
          NOTE: THIS PHOTO WILL BE USED FOR YOUR OFFICIAL ID
        </p>

        <div className="w-full space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onRetake}
              className="flex-1 py-3 border border-white/20 text-white text-xs tracking-widest"
            >
              RETAKE
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 border border-white/20 text-white text-xs tracking-widest"
            >
              GENERATE ID CARD
            </button>
          </div>
          <button
            onClick={handleShare}
            className="w-full py-3 bg-white text-black text-xs font-bold tracking-widest"
          >
            POST YOUR ID
          </button>
          <button
            onClick={handleWatch}
            className="w-full py-3 border border-red-500 text-red-400 text-xs tracking-widests"
          >
            WATCH OUR FILM "KIDNAPPED" ON YOUTUBE
          </button>
        </div>
      </div>
    </div>
  );
}
