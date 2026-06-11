"use client";

const DEFAULT_HERO_VIDEO =
  "https://assets.mixkit.co/videos/preview/mixkit-server-room-with-lights-blinking-4675-large.mp4";

export default function MiningHeroVideo() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl mining-hero-video-wrap">
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || DEFAULT_HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/30" />
      <div className="absolute inset-0 mining-rig-grid opacity-30" />
      <div className="mining-rig-scanner opacity-40" />
    </div>
  );
}
