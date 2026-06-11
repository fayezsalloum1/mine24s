"use client";

const FALLBACKS: Record<string, string> = {
  starter: "/machines/starter.png",
  basic: "/machines/basic.png",
  pro: "/machines/pro.png",
  elite: "/machines/elite.png",
  ultimate: "/machines/ultimate.png",
};

function resolveImageSrc(src: string | null | undefined, alt: string): string {
  if (!src) return FALLBACKS[alt.toLowerCase()] || "/machines/starter.png";
  if (src.startsWith("data:")) return src;
  // If DB has .svg but real photos are .png, use png
  if (src.endsWith(".svg")) {
    return src.replace(".svg", ".png");
  }
  return src;
}

export default function MachineImage({
  src,
  alt,
  className = "w-full h-full object-cover",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const imageSrc = resolveImageSrc(src, alt);
  const fallback = FALLBACKS[alt.toLowerCase()] || "/machines/starter.png";

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.currentTarget;
        if (!target.src.endsWith(fallback)) {
          target.src = fallback;
        }
      }}
    />
  );
}
