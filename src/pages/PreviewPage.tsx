import { useRef, useMemo } from "react";
import html2canvas from "html2canvas";

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

// ✅ Proper ordinal fix
function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function PreviewPage({ imageDataUrl, onRetake }: PreviewPageProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  // ✅ Stable identity (generated once)
  const identity = useMemo(() => {
    const kidnapperNo = Math.floor(1000 + Math.random() * 9000);
    const batch = Math.floor(50 + Math.random() * 50);
    const city = cities[Math.floor(Math.random() * cities.length)];

    return {
      line1: `Kidnapper No. ${kidnapperNo}`,
      line2: `${getOrdinal(batch)} Batch, Trained at ${city}`,
    };
  }, []);

  const handleDownload = async () => {
    if (!exportRef.current) return;

    // ✅ Ensure fonts + layout are fully ready
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#050505",
      scale: 3,
      useCORS: true,
      allowTaint: false,
      removeContainer: true,
    });

    const link = document.createElement("a");
    link.download = "kidnapped_story.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };


  const handleShare = async () => {
  if (!exportRef.current) return;

  try {
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: "#050505",
      scale: 3, // or 4 if you want extra sharpness
      useCORS: true,
      allowTaint: false,
    });

    const dataUrl = canvas.toDataURL("image/png");

    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const file = new File([blob], "kidnapped.png", {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "KIDNAPPED",
        text: "I am the kidnapper",
        files: [file],
      });
    } else {
      // fallback: download
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
      {/* ================= EXPORT CANVAS ================= */}
      <div
        ref={exportRef}
       style={{
  position: "absolute",
  top: 0,
  left: 0,
  width: "1080px",
  height: "1920px",
  background: "#050505",
  display: "flex",
  flexDirection: "column",
  padding: "100px 80px",
  boxSizing: "border-box",
  fontFamily: "Courier New, monospace",
  zIndex: -1,
  opacity: 0,
  pointerEvents: "none",
}}
      >
        {/* LOGO */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <img src="./kidnapped-title.png" style={{ width: "600px" }} />
        </div>

        {/* IMAGE */}
        <div
          style={{
            width: "100%",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.15)",
            marginBottom: "50px",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            {/* base image */}
            <img
              src={imageDataUrl}
              crossOrigin="anonymous"
              style={{ width: "100%", display: "block" }}
            />

            {/* monkey cap overlay */}
            <img
              src="./monkey-cap-png.png"
              style={{
                position: "absolute",
                top: "10%",
                left: "50%",
                transform: "translateX(-50%) rotate(-4deg)",
                width: "60%",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* IDENTITY */}
        <h2
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: "28px", // ✅ fixed (was too small before export)
            letterSpacing: "4px",
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.8,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "60px",
          }}
        >
          <div>{identity.line1}</div>
          <div>{identity.line2}</div>
        </h2>

        {/* CTA SECTION */}
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "28px", marginBottom: "40px" }}>
            Tag two friends who should be kidnapped next
          </div>

          <div style={{ color: "white", fontSize: "42px", letterSpacing: "4px", marginBottom: "50px" }}>
            @_______________   @_______________
          </div>

          <div style={{ color: "#ff3b3b", fontSize: "32px", marginBottom: "20px" }}>
            #KIDNAPPEDSHORTFILM
          </div>

          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "26px" }}>
            @sarath.chandra.k | @suhas_venigalla2704 | @siddu_yolo | @akhil_flawless |
            @yeswanth_karthikeya | @samhiiii___ | @shiva_koyyada | @music_mantra.mp3 |
            @abhi._gfx | @harishparthu123 | @devendardeadpool | @sketch.with.saran
          </div>
        </div>
      </div>

      {/* ================= UI PREVIEW ================= */}
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
              left: "20%", // Since width is 60%, (100 - 60) / 2 = 20% to center it
              width: "60%",
              transform: "rotate(-4deg)" 
            }}
          />
          </div>
        </div>

        {/* UI identity (smaller version) */}
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

        {/* Buttons */}
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