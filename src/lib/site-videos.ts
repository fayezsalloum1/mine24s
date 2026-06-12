/**
 * Brand video slots — drop MP4/WebM files into public/videos/ or set env URLs.
 *
 * Recommended files:
 *   public/videos/hero.mp4       — landing hero (datacenter / Bitcoin / clouds)
 *   public/videos/auth.mp4       — login & register side panel
 *   public/videos/about.mp4      — About Us company story
 *   public/videos/operations.mp4 — optional “See our operations” section
 */
export const SITE_VIDEOS = {
  hero: process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/videos/hero.mp4",
  auth: process.env.NEXT_PUBLIC_AUTH_VIDEO_URL || "/videos/auth.mp4",
  about: process.env.NEXT_PUBLIC_ABOUT_VIDEO_URL || "/videos/about.mp4",
  operations:
    process.env.NEXT_PUBLIC_OPERATIONS_VIDEO_URL || "/videos/operations.mp4",
} as const;

export const MARKETING_CLIPS = [
  {
    src: "/videos/clip-mstr-shares.mp4",
    titleKey: "clipMstrSharesTitle" as const,
    descKey: "clipMstrSharesDesc" as const,
  },
  {
    src: "/videos/clip-mstr-exposure.mp4",
    titleKey: "clipMstrExposureTitle" as const,
    descKey: "clipMstrExposureDesc" as const,
  },
] as const;
