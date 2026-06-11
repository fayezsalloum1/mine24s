"use client";

export default function MiningBackground() {
  const particles = [
    { top: "12%", left: "8%", size: 3, delay: "0s", cyan: false },
    { top: "28%", left: "85%", size: 2, delay: "1.2s", cyan: true },
    { top: "55%", left: "15%", size: 2, delay: "2.4s", cyan: true },
    { top: "70%", left: "72%", size: 3, delay: "0.8s", cyan: false },
    { top: "85%", left: "40%", size: 2, delay: "3s", cyan: true },
    { top: "40%", left: "55%", size: 2, delay: "1.8s", cyan: false },
    { top: "18%", left: "62%", size: 2, delay: "2.8s", cyan: true },
    { top: "62%", left: "90%", size: 2, delay: "0.5s", cyan: false },
  ];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden mining-bg-base" aria-hidden>
      <div className="absolute inset-0 mining-grid opacity-60" />

      {/* Ambient glow orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-blue-600/5 blur-3xl" />

      {/* Mining rig silhouettes — desktop only for performance */}
      <svg
        className="absolute bottom-0 left-0 w-full h-auto opacity-[0.07] hidden sm:block pointer-events-none"
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#22d3ee">
          {[0, 180, 360, 540, 720, 900, 1080, 1260].map((x) => (
            <g key={x} transform={`translate(${x}, 0)`}>
              <rect x="20" y="80" width="120" height="90" rx="4" />
              <rect x="30" y="90" width="100" height="8" rx="2" opacity="0.6" />
              <rect x="30" y="105" width="100" height="8" rx="2" opacity="0.6" />
              <rect x="30" y="120" width="100" height="8" rx="2" opacity="0.6" />
              <rect x="30" y="135" width="100" height="8" rx="2" opacity="0.6" />
              <rect x="30" y="150" width="100" height="8" rx="2" opacity="0.6" />
              <circle cx="80" cy="60" r="18" fill="#f59e0b" opacity="0.8" />
              <rect x="70" y="40" width="20" height="25" rx="2" fill="#f59e0b" opacity="0.5" />
            </g>
          ))}
        </g>
      </svg>

      {/* Hash rate lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hash-lines" width="200" height="40" patternUnits="userSpaceOnUse">
            <text x="0" y="28" fontFamily="monospace" fontSize="14" fill="#f59e0b">
              0x7f3a...hash 0x9b2c...mine 0x4e1d...block
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hash-lines)" />
      </svg>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className={`mining-particle ${p.cyan ? "mining-particle-cyan" : ""}`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Subtle background video on larger screens */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] hidden md:block pointer-events-none"
        src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "https://assets.mixkit.co/videos/preview/mixkit-server-room-with-lights-blinking-4675-large.mp4"}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      />

      {/* Floating data streams */}
      {[10, 30, 55, 75, 90].map((left, i) => (
        <span
          key={i}
          className="mining-data-stream absolute text-[10px] font-mono text-cyan-500/20 pointer-events-none hidden sm:block"
          style={{ left: `${left}%`, animationDelay: `${i * 0.6}s` }}
        >
          0x{((i + 1) * 9731).toString(16)}…
        </span>
      ))}

      {/* Top vignette + bottom fade for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/20" />
    </div>
  );
}
