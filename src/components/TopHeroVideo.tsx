"use client";

import { useEffect, useRef } from "react";

const HERO_VIDEO_SRC = "/videos/2.mp4";

export default function TopHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* browser may block until user gesture */
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, []);

  return (
    <section className="w-full bg-black/40 border-b border-gold-500/15">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="relative w-full overflow-hidden rounded-2xl border border-gold-500/30 bg-black shadow-2xl shadow-black/50 aspect-video max-h-[420px]">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Simple Mining platform video"
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
