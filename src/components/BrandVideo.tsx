"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  fallback?: React.ReactNode;
  className?: string;
  title?: string;
  overlay?: boolean;
  objectFit?: "cover" | "contain";
};

export default function BrandVideo({
  src,
  fallback,
  className = "",
  title = "Video",
  overlay = true,
  objectFit = "cover",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    video.muted = true;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* autoplay blocked */
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [src, failed]);

  if (failed && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (failed) {
    return null;
  }

  const fitClass =
    objectFit === "contain"
      ? "h-full w-full object-contain"
      : "h-full w-full object-cover";

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className={fitClass}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={title}
        onError={() => setFailed(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
      )}
    </div>
  );
}
