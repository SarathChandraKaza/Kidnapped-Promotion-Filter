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

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-8 pb-12 px-6 bg-[#0a0a0a]">

      {/* ================= EXPORT CANVAS ================= */}
      <div
        ref={exportRef}
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          width: "1080px",
          height: "1920px",
          background: "#050505",
          display: "flex",
          flexDirection: "column",
          padding: "100px 80px",
          boxSizing: "border-box",
          fontFamily: "Courier New, monospace",
          zIndex: -9999,
        }}
      >
        {/* LOGO */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "50px" }}>
          <img src="/kidnapped-title.png" style={{ width: "600px" }} />
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
          <img
            src={imageDataUrl}
            crossOrigin="anonymous"
            style={{ width: "100%", display: "block" }}
          />
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
            @__________   @__________
          </div>

          <div style={{ color: "#ff3b3b", fontSize: "32px", marginBottom: "20px" }}>
            #KIDNAPPEDSHORTFILM
          </div>

          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "26px" }}>
            @sarath.chandra.k
          </div>
        </div>
      </div>

      {/* ================= UI PREVIEW ================= */}
      <div className="w-full max-w-[340px] flex flex-col items-center">

        <img
          src="/kidnapped-title.png"
          className="w-48 mb-8 opacity-90"
          alt="Logo"
        />

        <div className="w-full rounded-xl overflow-hidden border border-white/10 mb-6">
          <img src={imageDataUrl} className="w-full block" />
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
            onClick={() =>
              navigator.share?.({
                title: "KIDNAPPED",
                text: "I am the kidnapper",
                url: imageDataUrl,
              })
            }
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