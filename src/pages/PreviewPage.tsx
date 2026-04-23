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
    const PAD = 80;
    const innerW = W - PAD * 2;

    const FS = {
      identity: 32,
      tagline: 32,
      handles: 48,
      hashtag: 38,
      credits: 28,
    };

    const titleDrawW = 600;
    const titleH = Math.round((titleImg.height / titleImg.width) * titleDrawW);

    // photoImg is already cropped to 3:4 by CameraView — use its natural ratio.
    const photoH = Math.round((photoImg.height / photoImg.width) * innerW);

    const credits =
      "@sarath.chandra.k | @suhas_venigalla2704 | @siddu_yolo | @akhil_flawless | " +
      "@yeswanth_karthikeya | @samhiiii___ | @shiva_koyyada | @music_mantra.mp3 | " +
      "@abhi._gfx | @harishparthu123 | @devendardeadpool | @sketch.with.saran";

    const mCanvas = document.createElement("canvas");
    mCanvas.width = W;
    mCanvas.height = 10;
    const mCtx = mCanvas.getContext("2d")!;
    mCtx.font = `${FS.credits}px "Courier New", monospace`;
    const creditLines = wrapLines(mCtx, credits, innerW);
    const creditsLineH = Math.round(FS.credits * 1.6);

    const totalH =
      100 +
      titleH +
      40 +
      photoH +
      70 +
      FS.identity + FS.identity * 2 +
      20 +
      90 +
      FS.tagline +
      60 +
      FS.handles +
      70 +
      FS.hashtag +
      40 +
      creditLines.length * creditsLineH +
      120;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = Math.ceil(totalH);

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, canvas.height);
    ctx.textAlign = "center";

    let y = 100;

    ctx.drawImage(titleImg, (W - titleDrawW) / 2, y, titleDrawW, titleH);
    y += titleH + 40;

    const roundRect = (x: number, ry: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, ry);
      ctx.lineTo(x + w - r, ry);
      ctx.quadraticCurveTo(x + w, ry, x + w, ry + r);
      ctx.lineTo(x + w, ry + h - r);
      ctx.quadraticCurveTo(x + w, ry + h, x + w - r, ry + h);
      ctx.lineTo(x + r, ry + h);
      ctx.quadraticCurveTo(x, ry + h, x, ry + h - r);
      ctx.lineTo(x, ry + r);
      ctx.quadraticCurveTo(x, ry, x + r, ry);
      ctx.closePath();
    };

    ctx.save();
    roundRect(PAD, y, innerW, photoH, 24);
    ctx.clip();
    ctx.drawImage(photoImg, PAD, y, innerW, photoH);
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    roundRect(PAD, y, innerW, photoH, 24);
    ctx.stroke();

    const capW = innerW * 0.6;
    const capH = Math.round((capImg.height / capImg.width) * capW);
    ctx.save();
    ctx.translate(PAD + innerW / 2, y + photoH * 0.10 + capH / 2);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.drawImage(capImg, -capW / 2, -capH / 2, capW, capH);
    ctx.restore();

    y += photoH + 70;

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `${FS.identity}px "Courier New", monospace`;
    ctx.fillText(identity.line1.toUpperCase(), W / 2, y);
    y += FS.identity + 20;
    ctx.fillText(identity.line2.toUpperCase(), W / 2, y);
    y += FS.identity * 2 + 90;

    ctx.font = `${FS.tagline}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Tag two friends who should be kidnapped next", W / 2, y);
    y += FS.tagline + 60;

    ctx.font = `${FS.handles}px "Courier New", monospace`;
    ctx.fillStyle = "white";
    ctx.fillText("@_______________   @_______________", W / 2, y);
    y += FS.handles + 70;

    ctx.font = `bold ${FS.hashtag}px "Courier New", monospace`;
    ctx.fillStyle = "#ff3b3b";
    ctx.fillText("#KIDNAPPEDSHORTFILM", W / 2, y);
    y += FS.hashtag + 40;

    ctx.font = `${FS.credits}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (const line of creditLines) {
      ctx.fillText(line, W / 2, y);
      y += creditsLineH;
    }

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
