import { useState, useEffect } from "react";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grain relative flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] overflow-hidden select-none">
      {/* Scanlines */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

      {/* Background noise texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Horizontal scan line sweep */}
      <div
        className="absolute w-full h-[2px] bg-white opacity-[0.03] pointer-events-none"
        style={{
          animation: "scan-sweep 8s linear infinite",
          top: 0,
        }}
      />
      <style>{`
        @keyframes scan-sweep {
          0%   { top: -2px; }
          100% { top: 100vh; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
      `}</style>

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center px-8 text-center max-w-sm mx-auto">
        {/* Film tag decoration */}
        <div className="mb-8 flex items-center gap-3 opacity-40">
          <div className="h-px w-12 bg-white" />
          <span className="text-[10px] tracking-[0.4em] text-white uppercase font-mono">
            CLASSIFIED
          </span>
          <div className="h-px w-12 bg-white" />
        </div>

        {/* Main title */}
       <div className="mb-6 flex justify-center">
          <img
  src={`${import.meta.env.BASE_URL}kidnapped-title.png`}
  alt="KIDNAPPED"
  className={`w-[80%] max-w-[260px] object-contain ${
    glitchActive ? "glitch-img" : ""
  }`}
  style={{
    filter: glitchActive
      ? "drop-shadow(3px 0 red) drop-shadow(-3px 0 cyan)"
      : "drop-shadow(0 0 20px rgba(255,255,255,0.2))",
  }}
/>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white opacity-20 mb-8" />

        {/* Tagline */}

        <p
          className="text-[14px] tracking-[0.2em] text-white/70 uppercase mb-5"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          You have been shortlisted
        </p>

        <p
          className="text-[14px] tracking-[0.2em] text-white font-bold uppercase mb-5"
          style={{
          fontFamily: "'Special Elite', 'Courier New', monospace",
          textShadow: "0 0 20px rgba(255,255,255,0.3)",
          }}
          >
          Become A Kidnapper
        </p>

        

        {/* Accept button */}
        <button
          onClick={onStart}
          className="btn-glitch pulse-border relative px-12 py-4 border border-white/80 text-white tracking-[0.3em] uppercase text-sm font-bold transition-all duration-200 hover:bg-white hover:text-black active:scale-95"
          data-text="ACCEPT"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          ENROLL
        </button>

        {/* Small instruction */}
        <p
          className="mt-6 text-[10px] tracking-[0.2em] text-white/30 uppercase"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          camera and location access required
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 z-20">
        <div className="w-6 h-6 border-t border-l border-white/30" />
      </div>
      <div className="absolute top-6 right-6 z-20">
        <div className="w-6 h-6 border-t border-r border-white/30" />
      </div>
      <div className="absolute bottom-6 left-6 z-20">
        <div className="w-6 h-6 border-b border-l border-white/30" />
      </div>
      <div className="absolute bottom-6 right-6 z-20">
        <div className="w-6 h-6 border-b border-r border-white/30" />
      </div>

      {/* Film perforations decoration */}
      <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around pointer-events-none z-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-2 h-3 border border-white/10 rounded-[1px]" />
        ))}
      </div>
      <div className="absolute right-3 top-0 bottom-0 flex flex-col justify-around pointer-events-none z-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-2 h-3 border border-white/10 rounded-[1px]" />
        ))}
      </div>
    </div>
  );
}
