"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

const NAV = [
  { href: "/dashboard", icon: "📊", labelKey: "dashboard" as const },
  { href: "/plans", icon: "⛏️", labelKey: "plans" as const },
  { href: "/withdraw", icon: "↗", labelKey: "withdraw" as const },
  { href: "/profile", icon: "👤", labelKey: "profile" as const },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  const links = NAV.map((item) => ({
    ...item,
    label:
      item.labelKey === "plans"
        ? tn("plans")
        : item.labelKey === "withdraw"
          ? tn("withdraw")
          : tc(item.labelKey),
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-e border-gray-800/80 bg-navy-800/50 backdrop-blur-xl p-4 gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-3">
          {tc("dashboard")}
        </p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              link.active
                ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            }`}
          >
            <span aria-hidden>{link.icon}</span>
            {link.label}
          </Link>
        ))}
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className={`mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              pathname.startsWith("/admin")
                ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            }`}
          >
            <span aria-hidden>⚙️</span>
            {tc("admin")}
          </Link>
        )}
      </aside>

      <div className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-800/80 bg-navy-800/95 backdrop-blur-xl safe-area-pb">
        <div className="flex justify-around items-center h-16 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors ${
                link.active ? "text-gold-400" : "text-gray-500"
              }`}
            >
              <span className="text-lg" aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
