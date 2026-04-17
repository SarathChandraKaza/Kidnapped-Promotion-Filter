interface PreviewPageProps {
  imageDataUrl: string;
  onRetake: () => void;
  onDownload: () => void;
}

export function PreviewPage({ imageDataUrl, onRetake, onDownload }: PreviewPageProps) {
  return (
    <div className="grain relative flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.75)_100%)] pointer-events-none z-10" />

      {/* Corner decorations */}
      <div className="absolute top-5 left-5 z-20 w-6 h-6 border-t border-l border-white/30" />
      <div className="absolute top-5 right-5 z-20 w-6 h-6 border-t border-r border-white/30" />
      <div className="absolute bottom-5 left-5 z-20 w-6 h-6 border-b border-l border-white/30" />
      <div className="absolute bottom-5 right-5 z-20 w-6 h-6 border-b border-r border-white/30" />

      <div className="relative z-20 flex flex-col items-center w-full max-w-sm px-6 gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-white/30" />
          <span
            className="text-xs tracking-[0.35em] text-white/50 uppercase"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            CAPTURED
          </span>
          <div className="h-px w-8 bg-white/30" />
        </div>

        {/* Image preview */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.8)",
          }}
        >
          <img
            src={imageDataUrl}
            alt="Captured selfie"
            className="w-full h-auto block"
          />
          {/* Film strip marks */}
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
            <div className="w-2 h-3 border border-white/20 rounded-sm" />
          </div>
        </div>

        {/* Share instruction */}
        <p
          className="text-xs text-white/40 tracking-[0.15em] uppercase text-center"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Share on Instagram
        </p>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={onRetake}
            className="flex-1 py-3.5 border border-white/30 text-white/60 tracking-[0.2em] uppercase text-xs font-bold hover:border-white/60 hover:text-white transition-all duration-200"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            RETAKE
          </button>
          <button
            onClick={onDownload}
            className="flex-1 py-3.5 bg-white text-black tracking-[0.2em] uppercase text-xs font-bold hover:bg-white/90 transition-all duration-200 active:scale-95"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            DOWNLOAD
          </button>
        </div>

        {/* Instagram share hint */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 opacity-40">
            <div className="h-px w-6 bg-white" />
            <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <div className="h-px w-6 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
