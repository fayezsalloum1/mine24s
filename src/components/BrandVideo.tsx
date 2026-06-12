"use client";

import { useState } from "react";

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
  const [failed, setFailed] = useState(false);

  if (failed && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (failed) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        className={
          objectFit === "contain"
            ? "absolute inset-0 h-full w-full object-contain"
            : "absolute inset-0 h-full w-full object-cover"
        }
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={title}
        onError={() => setFailed(true)}
      />
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
      )}
    </div>
  );
}
