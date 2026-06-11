"use client";

/**
 * Hero visual: animated cloud + orbiting Bitcoin (local SVG scene).
 * Always works — no external CDN required.
 */
export default function MiningHeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#020b1a]">
      <iframe
        src="/machines/cloud_mining_background_gif.html"
        title="Cloud mining — Bitcoin animation"
        className="absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
        loading="eager"
        tabIndex={-1}
      />

      {/* Soft vignette — keeps animation visible */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/30" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/25 via-transparent to-slate-950/25" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
