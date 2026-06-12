"use client";

import BrandVideo from "@/components/BrandVideo";
import { SITE_VIDEOS } from "@/lib/site-videos";

function CloudBitcoinFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#020b1a]">
      <iframe
        src="/machines/cloud_mining_background_gif.html"
        title="Simple Mining — Bitcoin animation"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 border-0"
        loading="eager"
        tabIndex={-1}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-slate-950/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/25 via-transparent to-slate-950/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/15 blur-3xl" />
    </div>
  );
}

export default function MiningHeroVideo() {
  return (
    <div className="hero-video-frame">
      <BrandVideo
        src={SITE_VIDEOS.hero}
        title="Simple Mining — hero"
        className="absolute inset-0 rounded-2xl bg-black"
        fallback={<CloudBitcoinFallback />}
        overlay={false}
        objectFit="contain"
      />
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gold-500/20" />
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        LIVE · 24/7 MINING
      </div>
    </div>
  );
}
