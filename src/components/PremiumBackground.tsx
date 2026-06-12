"use client";

export default function PremiumBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-900" aria-hidden>
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
      <div className="absolute inset-0 bg-dot-pattern bg-dot opacity-20" />
      <div className="absolute inset-0 bg-hero-gradient animate-gradient-shift" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-profit/5 rounded-full blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/40 via-transparent to-navy-900/80" />
    </div>
  );
}
