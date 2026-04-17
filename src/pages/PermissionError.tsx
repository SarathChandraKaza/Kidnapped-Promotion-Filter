interface PermissionErrorProps {
  onRetry: () => void;
}

export function PermissionError({ onRetry }: PermissionErrorProps) {
  return (
    <div className="grain relative flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] overflow-hidden px-8 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

      <div className="relative z-20 max-w-xs">
        <div className="text-4xl mb-6">⚠</div>
        <h2
          className="text-xl tracking-[0.2em] text-white uppercase mb-4 font-bold"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          ACCESS DENIED
        </h2>
        <p
          className="text-sm text-white/50 mb-2 tracking-wider"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Camera permission was denied.
        </p>
        <p
          className="text-xs text-white/30 mb-10 tracking-wide leading-relaxed"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          To proceed, allow camera access in your browser settings and try again.
        </p>
        <button
          onClick={onRetry}
          className="px-10 py-3 border border-white/50 text-white tracking-[0.25em] uppercase text-sm font-bold hover:bg-white hover:text-black transition-all duration-200"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          RETRY
        </button>
      </div>
    </div>
  );
}
