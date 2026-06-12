import { BRAND_NAME } from "@/lib/brand";

type Props = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: { mark: "w-7 h-7", text: "text-base", icon: 14 },
  md: { mark: "w-9 h-9", text: "text-lg sm:text-xl", icon: 16 },
  lg: { mark: "w-11 h-11", text: "text-2xl", icon: 20 },
};

export default function BrandLogo({ size = "md", showName = true, className = "" }: Props) {
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${s.mark} relative flex items-center justify-center rounded-xl shrink-0`}
        style={{
          background: "linear-gradient(145deg, #ffd166 0%, #f5a623 50%, #e8860b 100%)",
          boxShadow: "0 4px 20px -4px rgb(245 166 35 / 0.55), 0 0 0 1px rgb(255 255 255 / 0.2) inset",
        }}
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="text-black"
        >
          <path
            d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 8V16M9 10.5H15M9 13.5H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showName && (
        <span className={`${s.text} font-bold text-gradient-gold`}>
          {BRAND_NAME}
        </span>
      )}
    </span>
  );
}
