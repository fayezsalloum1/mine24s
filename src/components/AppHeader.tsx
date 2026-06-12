"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import CryptoTicker from "./CryptoTicker";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import BrandLogo from "./BrandLogo";

export default function AppHeader({ showNotifications = true }: { showNotifications?: boolean }) {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <>
      <CryptoTicker />
      <header className="site-header">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-3">
          <Link href={session ? "/dashboard" : "/"} className="shrink-0 hover:opacity-90 transition-opacity">
            <BrandLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {session && (
              <>
                <Link href="/dashboard" className="nav-link">{t("dashboard")}</Link>
                <Link href="/plans" className="nav-link">{tn("plans")}</Link>
              </>
            )}
            <Link href="/about" className="nav-link">{tn("about")}</Link>
            <Link href="/faq" className="nav-link">{tn("faq")}</Link>
            <Link href="/contact" className="nav-link">{tn("contact")}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {session && showNotifications && <NotificationBell />}
            {session && (
              <>
                <Link href="/profile" className="nav-link hidden sm:inline-flex">{t("profile")}</Link>
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
                <Link href="/login" className="nav-link">{t("login")}</Link>
                <Link href="/register" className="btn-primary px-4 py-2 text-sm rounded-lg">
                  {t("register")}
                </Link>
              </div>
            )}
            <MobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
