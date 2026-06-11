"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import CryptoTicker from "./CryptoTicker";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import { BRAND_NAME } from "@/lib/brand";

export default function AppHeader({ showNotifications = true }: { showNotifications?: boolean }) {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <>
      <CryptoTicker />
      <header className="site-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0 group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-black text-sm font-black shadow-gold-sm">
              ⛏
            </span>
            <span className="text-lg sm:text-xl font-bold text-gradient-gold group-hover:opacity-90 transition-opacity">
              {BRAND_NAME}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {session && (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
                  {t("dashboard")}
                </Link>
                <Link href="/plans" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
                  {tn("plans")}
                </Link>
              </>
            )}
            <Link href="/about" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
              {tn("about")}
            </Link>
            <Link href="/faq" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
              {tn("faq")}
            </Link>
            <Link href="/contact" className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
              {tn("contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {session && showNotifications && <NotificationBell />}
            {session && (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  {t("profile")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden sm:inline text-sm text-red-400 hover:text-red-300 px-2 py-1 transition-colors"
                >
                  {t("logout")}
                </button>
              </>
            )}
            {!session && (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="text-sm text-amber-400 hover:text-amber-300 px-3 py-1.5 transition-colors">
                  {t("login")}
                </Link>
                <Link href="/register" className="text-sm btn-primary px-4 py-2 rounded-lg">
                  {t("register")}
                </Link>
              </div>
            )}
            <div className="relative">
              <MobileNav />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
