import { BRAND_NAME } from "@/lib/brand";

type Props = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: { mark: "w-7 h-7", text: "text-base", icon: 14 },
  md: { mark: "w-8 h-8", text: "text-lg font-bold", icon: 15 },
  lg: { mark: "w-10 h-10", text: "text-xl font-bold", icon: 18 },
};

export default function BrandLogo({ size = "md", showName = true, className = "" }: Props) {
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${s.mark} flex items-center justify-center rounded-lg shrink-0 bg-gradient-to-br from-gold-400 to-gold-500 shadow-gold-sm`}
      >
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" aria-hidden className="text-navy-900">
          <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 8V16M9 10.5H15M9 13.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      {showName && (
        <span className={`${s.text} text-gold-400`}>{BRAND_NAME}</span>
      )}
    </span>
  );
}
