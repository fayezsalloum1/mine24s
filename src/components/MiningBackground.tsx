"use client";

export default function MiningBackground() {
  const particles = [
    { top: "55%", left: "8%", size: 2, delay: "0s", cyan: false },
    { top: "72%", left: "85%", size: 2, delay: "1.2s", cyan: true },
    { top: "88%", left: "25%", size: 2, delay: "2.4s", cyan: true },
    { top: "65%", left: "72%", size: 2, delay: "0.8s", cyan: false },
  ];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden mining-bg-base" aria-hidden>
      {/* Grid only in lower half — keeps hero text area clean */}
      <div className="absolute inset-x-0 bottom-0 top-[45%] mining-grid opacity-40 md:opacity-50" />

      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl" />

      {/* Rig silhouettes — bottom only, desktop */}
      <svg
        className="absolute bottom-0 left-0 w-full h-auto opacity-[0.06] hidden md:block pointer-events-none"
        viewBox="0 0 1440 200"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#22d3ee">
          {[0, 360, 720, 1080].map((x) => (
            <g key={x} transform={`translate(${x}, 0)`}>
              <rect x="20" y="80" width="120" height="90" rx="4" />
              <circle cx="80" cy="60" r="18" fill="#f59e0b" opacity="0.8" />
            </g>
          ))}
        </g>
      </svg>

      {particles.map((p, i) => (
        <span
          key={i}
          className={`mining-particle hidden sm:block ${p.cyan ? "mining-particle-cyan" : ""}`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}

      <video
        className="absolute inset-0 w-full h-full object-cover opacity-[0.08] hidden lg:block pointer-events-none"
        src={
          process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
          "https://assets.mixkit.co/videos/preview/mixkit-server-room-with-lights-blinking-4675-large.mp4"
        }
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      />

      {/* Strong top scrim so hero text never fights the background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 from-0% via-slate-950/88 via-[35%] to-slate-950/75 to-100%" />
      <div className="absolute inset-0 bg-slate-950/30 md:bg-transparent" />
    </div>
  );
}
