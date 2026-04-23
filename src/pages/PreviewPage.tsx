import { useMemo } from "react";

interface PreviewPageProps {
  imageDataUrl: string;
  onRetake: () => void;
}

const cities = [
  "Dehradun", "Hyderabad", "Bengaluru", "Lucknow", "Bhopal",
  "Chandigarh", "Jaipur", "Pune", "Ahmedabad", "Kolkata",
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

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function PreviewPage({ imageDataUrl, onRetake }: PreviewPageProps) {
  const identity = useMemo(() => {
    const kidnapperNo = Math.floor(1000 + Math.random() * 9000);
    const batch = Math.floor(50 + Math.random() * 50);
    const city = cities[Math.floor(Math.random() * cities.length)];
    return {
      line1: `Kidnapper No. ${kidnapperNo}`,
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

  // ======================
  // 🎛️ EASY TWEAK CONFIG
  // ======================
  const L = {
    pad: 80,
    top: 20,

    titleGap: 20,
    imageGap: 50,

    identityGap: 40,
    identityBottom: 60,

    taglineGap: 10,
    handlesGap: 1,

    hashtagGap: 1,
  };

  const FS = {
    identity: 32,
    tagline: 32,
    handles: 48,
    hashtag: 38,
    credits: 28,
  };

  const innerW = W - L.pad * 2;

  const titleDrawW = 600;
  const titleH = Math.round((titleImg.height / titleImg.width) * titleDrawW);

  const photoH = Math.round((photoImg.height / photoImg.width) * innerW);

  // ======================
  // HEIGHT CALC (IMPORTANT)
  // ======================
  const totalH =
    L.top +
    titleH +
    L.titleGap +
    photoH +
    L.imageGap +
    140 + // identity block approx
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

  // ======================
  // TITLE
  // ======================
  ctx.drawImage(titleImg, (W - titleDrawW) / 2, y, titleDrawW, titleH);
  y += titleH + L.titleGap;

  // ======================
  // PHOTO BLOCK
  // ======================
  const roundRect = (x: number, y0: number, w: number, h: number, r: number) => {
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
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  roundRect(L.pad, y, innerW, photoH, 24);
  ctx.stroke();

  // cap overlay
  const capW = innerW * 0.6;
  const capH = Math.round((capImg.height / capImg.width) * capW);

  ctx.save();
  ctx.translate(L.pad + innerW / 2, y + photoH * 0.1 + capH / 2);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.drawImage(capImg, -capW / 2, -capH / 2, capW, capH);
  ctx.restore();

  y += photoH + L.imageGap;

  // ======================
  // IDENTITY
  // ======================
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `${FS.identity}px "Courier New", monospace`;

  ctx.fillText(identity.line1.toUpperCase(), W / 2, y);
  y += L.identityGap;

  ctx.fillText(identity.line2.toUpperCase(), W / 2, y);
  y += L.identityBottom;

  // ======================
  // TAGLINE
  // ======================
  ctx.font = `${FS.tagline}px "Courier New", monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Tag two friends who should be kidnapped next", W / 2, y);
  y += FS.tagline + L.taglineGap;

  // ======================
  // HANDLES
  // ======================
  ctx.font = `${FS.handles}px "Courier New", monospace`;
  ctx.fillStyle = "white";
  ctx.fillText("@_______________   @_______________", W / 2, y);
  y += FS.handles + L.handlesGap;

  // ======================
  // HASHTAG
  // ======================
  ctx.font = `bold ${FS.hashtag}px "Courier New", monospace`;
  ctx.fillStyle = "#ff3b3b";
  ctx.fillText("#KIDNAPPEDSHORTFILM", W / 2, y);

  return canvas;
};

  const handleDownload = async () => {
    try {
      const canvas = await buildCanvas();
      const link = document.createElement("a");
      link.download = "kidnapped_story.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleShare = async () => {
    try {
      const canvas = await buildCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "kidnapped.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "KIDNAPPED", text: "I am the kidnapper", files: [file] });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "kidnapped.png";
        link.click();
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="relative h-screen flex flex-col items-center pt-8 pb-12 px-6 bg-[#0a0a0a] overflow-y-auto">
      <div className="w-full max-w-[340px] flex flex-col items-center">

        <img src="./kidnapped-title.png" className="w-48 mb-8 opacity-90" alt="Logo" />

        {/* Photo preview — enforces the same 3:4 ratio as the download canvas */}
        <div className="w-full rounded-xl overflow-hidden border border-white/10 mb-6">
          <div
            className="relative w-full"
            style={{ aspectRatio: "3 / 4" }}
          >
            <img
              src={imageDataUrl}
              className="absolute inset-0 w-full h-full object-cover block"
            />
            <img
              src="./monkey-cap-png.png"
              className="absolute pointer-events-none"
              style={{ top: "10%", left: "20%", width: "60%", transform: "rotate(-4deg)" }}
            />
          </div>
        </div>

        <h2
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "11px",
            letterSpacing: "5px",
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.8,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div>{identity.line1}</div>
          <div>{identity.line2}</div>
        </h2>

        <div className="w-full space-y-3">
          <div className="flex gap-3">
            <button onClick={onRetake} className="flex-1 py-3 border border-white/20 text-white text-xs tracking-widest">
              RETAKE
            </button>
            <button onClick={handleDownload} className="flex-1 py-3 border border-white/20 text-white text-xs tracking-widest">
              DOWNLOAD
            </button>
          </div>
          <button onClick={handleShare} className="w-full py-3 bg-white text-black text-xs font-bold tracking-widest">
            SHARE STORY
          </button>
          <button onClick={() => window.open("https://www.youtube.com", "_blank")} className="w-full py-3 border border-red-500 text-red-400 text-xs tracking-widest">
            WATCH SHORT FILM
          </button>
        </div>
      </div>
    </div>
  );
}
