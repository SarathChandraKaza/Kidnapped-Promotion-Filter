import { useMemo } from "react";

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
    const kidnapperNo = Math.floor(1000 + Math.random() * 9000);
    const batch = Math.floor(50 + Math.random() * 50);
    const city = cities[Math.floor(Math.random() * cities.length)];
    return {
      line1: `Kidnapper No. ${kidnapperNo}`,
      line2: `${getOrdinal(batch)} Batch, Trained at ${city}`,
    };
  }, []);

  // ─── Core canvas renderer (no DOM, no html2canvas, no viewport limits) ──
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

    // Calculate heights from actual image aspect ratios
    const titleDrawW = 600;
    const titleH = Math.round((titleImg.height / titleImg.width) * titleDrawW);
    const photoH = Math.round((photoImg.height / photoImg.width) * innerW);

    const identityFontSize = 32;
    const identityLineH = identityFontSize * 2;
    const identityBlockH = identityLineH * 2 + 20;

    const ctaTaglineSize = 32;
    const ctaHandlesSize = 48;
    const ctaHashtagSize = 38;
    const ctaCreditsSize = 28;

    // Estimate total height so canvas is tall enough
    const totalH =
      100 +
      titleH + 30 +
      photoH + 60 +
      identityBlockH + 80 +
      ctaTaglineSize * 1.6 + 50 +
      ctaHandlesSize * 1.6 + 60 +
      ctaHashtagSize * 1.6 + 30 +
      ctaCreditsSize * 6 +   // generous credits estimate
      120;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = Math.ceil(totalH);

    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, canvas.height);

    let y = 100;

    // ── Title logo ────────────────────────────────────────────────────────
    ctx.drawImage(titleImg, (W - titleDrawW) / 2, y, titleDrawW, titleH);
    y += titleH + 30;

    // ── Photo with rounded rect clip ──────────────────────────────────────
    const photoX = PAD;
    const photoY = y;
    const radius = 24;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    ctx.save();
    roundRect(photoX, photoY, innerW, photoH, radius);
    ctx.clip();
    ctx.drawImage(photoImg, photoX, photoY, innerW, photoH);
    ctx.restore();

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    roundRect(photoX, photoY, innerW, photoH, radius);
    ctx.stroke();

    // ── Monkey cap overlay ────────────────────────────────────────────────
    const capW = innerW * 0.6;
    const capH = Math.round((capImg.height / capImg.width) * capW);
    const capCX = PAD + innerW / 2;
    const capCY = photoY + photoH * 0.10 + capH / 2;

    ctx.save();
    ctx.translate(capCX, capCY);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.drawImage(capImg, -capW / 2, -capH / 2, capW, capH);
    ctx.restore();

    y += photoH + 60;

    // ── Identity text ─────────────────────────────────────────────────────
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `${identityFontSize}px "Courier New", monospace`;
    ctx.fillText(identity.line1.toUpperCase(), W / 2, y + identityFontSize);
    ctx.fillText(identity.line2.toUpperCase(), W / 2, y + identityFontSize + identityLineH);
    y += identityBlockH + 80;

    // ── CTA: tagline ──────────────────────────────────────────────────────
    ctx.font = `${ctaTaglineSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Tag two friends who should be kidnapped next", W / 2, y);
    y += Math.round(ctaTaglineSize * 1.6) + 50;

    // ── CTA: handles ─────────────────────────────────────────────────────
    ctx.font = `${ctaHandlesSize}px "Courier New", monospace`;
    ctx.fillStyle = "white";
    ctx.fillText("@_______________   @_______________", W / 2, y);
    y += Math.round(ctaHandlesSize * 1.6) + 60;

    // ── CTA: hashtag ──────────────────────────────────────────────────────
    ctx.font = `bold ${ctaHashtagSize}px "Courier New", monospace`;
    ctx.fillStyle = "#ff3b3b";
    ctx.fillText("#KIDNAPPEDSHORTFILM", W / 2, y);
    y += Math.round(ctaHashtagSize * 1.6) + 30;

    // ── CTA: credits (word-wrapped) ───────────────────────────────────────
    const credits =
      "@sarath.chandra.k | @suhas_venigalla2704 | @siddu_yolo | @akhil_flawless | " +
      "@yeswanth_karthikeya | @samhiiii___ | @shiva_koyyada | @music_mantra.mp3 | " +
      "@abhi._gfx | @harishparthu123 | @devendardeadpool | @sketch.with.saran";

    ctx.font = `${ctaCreditsSize}px "Courier New", monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";

    const words = credits.split(" ");
    let line = "";
    const lineH = Math.round(ctaCreditsSize * 1.5);

    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > innerW && line !== "") {
        ctx.fillText(line.trim(), W / 2, y);
        y += lineH;
        line = word + " ";
      } else {
        line = test;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), W / 2, y);

    return canvas;
  };

  // ─── Download ────────────────────────────────────────────────────────────
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

  // ─── Share ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      const canvas = await buildCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "kidnapped.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "KIDNAPPED",
          text: "I am the kidnapper",
          files: [file],
        });
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

  // ─── UI (unchanged visual) ────────────────────────────────────────────────
  return (
    <div className="relative h-screen flex flex-col items-center pt-8 pb-12 px-6 bg-[#0a0a0a] overflow-y-auto">
      <div className="w-full max-w-[340px] flex flex-col items-center">

        <img
          src="./kidnapped-title.png"
          className="w-48 mb-8 opacity-90"
          alt="Logo"
        />

        <div className="w-full rounded-xl overflow-hidden border border-white/10 mb-6">
          <div className="relative w-full">
            <img src={imageDataUrl} className="w-full block" />
            <img
              src="./monkey-cap-png.png"
              className="absolute pointer-events-none"
              style={{
                top: "10%",
                left: "20%",
                width: "60%",
                transform: "rotate(-4deg)",
              }}
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
              DOWNLOAD
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-3 bg-white text-black text-xs font-bold tracking-widest"
          >
            SHARE STORY
          </button>

          <button
            onClick={() => window.open("https://www.youtube.com", "_blank")}
            className="w-full py-3 border border-red-500 text-red-400 text-xs tracking-widest"
          >
            WATCH SHORT FILM
          </button>
        </div>
      </div>
    </div>
  );
}
