interface PreviewPageProps {
  imageDataUrl: string;
  onRetake: () => void;
  onDownload: () => void;
}

export function PreviewPage({ imageDataUrl, onRetake, onDownload }: PreviewPageProps) {
  return (
    <div className="grain relative flex flex-col items-center justify-start min-h-screen bg-[#0a0a0a] overflow-hidden pt-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.75)_100%)] pointer-events-none z-10" />

      {/* Corner decorations */}
      <div className="absolute top-5 left-5 z-20 w-6 h-6 border-t border-l border-white/30" />
      <div className="absolute top-5 right-5 z-20 w-6 h-6 border-t border-r border-white/30" />
      <div className="absolute bottom-5 left-5 z-20 w-6 h-6 border-b border-l border-white/30" />
      <div className="absolute bottom-5 right-5 z-20 w-6 h-6 border-b border-r border-white/30" />

<div className="relative z-20 flex flex-col items-center w-full max-w-sm px-6">

     {/* 🔥 Logo on top */}
     <img
      src="/kidnapped-title.png"
      alt="KIDNAPPED"
      className="w-[70%] max-w-[220px] object-contain mb-1"
    />

    {/* Image preview */}
      <div
        className="relative w-full overflow-hidden mb-1 -mt-3"
        style={{
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.8)",
        }}
      >

      <img
        src={imageDataUrl}
        alt="Captured selfie"
        className="w-full h-auto block"
      />
</div>

  {/* 🔥 Text BELOW image */}
    <span
      className="text-sm text-white tracking-widest mb-4"
      style={{
        fontFamily: "'Courier New', monospace",
        textShadow: "2px 2px 0px black",
      }}
    >
      I AM THE KIDNAPPER
    </span>

    {/* Buttons */}
    <div className="flex flex-col gap-3 w-full">

      {/* Row: Retake + Download (same style) */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onRetake}
          className="flex-1 py-3 border border-white/40 text-white tracking-[0.2em] uppercase text-xs font-bold hover:border-white hover:text-white transition-all"
        >
          RETAKE
        </button>

        <button
          onClick={onDownload}
          className="flex-1 py-3 border border-white/40 text-white tracking-[0.2em] uppercase text-xs font-bold hover:border-white hover:text-white transition-all"
        >
          DOWNLOAD
        </button>
      </div>

      {/* Primary: Share (old download style) */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: "KIDNAPPED",
              text: "I am the kidnapper",
              url: imageDataUrl,
            });
          } else {
            alert("Sharing not supported on this device");
          }
        }}
        className="w-full py-3 bg-white text-black tracking-[0.2em] uppercase text-xs font-bold hover:bg-white/90 transition-all active:scale-95"
      >
        SHARE IMAGE
      </button>

      {/* Watch film */}
      <button
        onClick={() => {
          window.open("https://www.youtube.com", "_blank");
        }}
        className="w-full py-3 border border-red-500 text-red-400 tracking-[0.2em] uppercase text-xs font-bold hover:bg-red-500 hover:text-black transition-all"
      >
        WATCH SHORT FILM
      </button>

    </div>
</div>
    </div>
  );
}
