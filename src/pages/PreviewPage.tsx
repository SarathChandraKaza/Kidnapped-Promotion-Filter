import { useRef } from "react";
import html2canvas from "html2canvas";

interface PreviewPageProps {
  imageDataUrl: string;
  onRetake: () => void;
}

export function PreviewPage({ imageDataUrl, onRetake }: PreviewPageProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
      if (!exportRef.current) return;

      // wait for layout + images
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 3,
        useCORS: true,
        allowTaint: false,
      });

      const link = document.createElement("a");
      link.download = "kidnapped_story.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center pt-10">

      {/* 🔥 HIDDEN EXPORT (9:16 STORY) */}
      <div
        ref={exportRef}
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          width: "1080px",
          height: "1920px",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "60px 40px",
          visibility: "visible",
        }}
      >
        {/* Logo */}
        <img
          src="/kidnapped-title.png"
          style={{
            width: "70%",
            maxWidth: "500px",
            marginBottom: "20px",
          }}
        />

        {/* Image */}
        <img
          src={imageDataUrl}
            crossOrigin="anonymous"
          style={{
            width: "100%",
            border: "2px solid rgba(255,255,255,0.1)",
            marginBottom: "20px",
          }}
        />

        {/* Text */}
        <div
          style={{
            color: "white",
            fontFamily: "Courier New, monospace",
            letterSpacing: "4px",
            fontSize: "32px",
            marginBottom: "40px",
            textAlign: "center",
          }}
        >
          I AM THE KIDNAPPER
        </div>

        {/* Footer */}
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Courier New, monospace",
            letterSpacing: "3px",
            fontSize: "20px",
          }}
        >
          YOUR DATA
        </div>
      </div>

      {/* 🔥 VISIBLE UI (unchanged look) */}
      <div className="flex flex-col items-center w-full max-w-sm px-6">

        <img
          src="/kidnapped-title.png"
          className="w-[70%] max-w-[220px] mb-1"
        />

        <div className="w-full mb-1 -mt-3">
          <img src={imageDataUrl} className="w-full" />
        </div>

        <span className="text-white tracking-widest mb-4 text-sm">
          I AM THE KIDNAPPER
        </span>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">

          <div className="flex gap-3">
            <button
              onClick={onRetake}
              className="flex-1 py-3 border border-white text-white text-xs"
            >
              RETAKE
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 py-3 border border-white text-white text-xs"
            >
              DOWNLOAD
            </button>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "KIDNAPPED",
                  text: "I am the kidnapper",
                  url: imageDataUrl,
                });
              }
            }}
            className="w-full py-3 bg-white text-black text-xs"
          >
            SHARE IMAGE
          </button>

          <button
            onClick={() => window.open("https://www.youtube.com", "_blank")}
            className="w-full py-3 border border-red-500 text-red-400 text-xs"
          >
            WATCH SHORT FILM
          </button>
        </div>
      </div>
    </div>
  );
}