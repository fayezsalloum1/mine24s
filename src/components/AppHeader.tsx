"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import CryptoTicker from "./CryptoTicker";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import { BRAND_NAME } from "@/lib/brand";

export default function AppHeader({ showNotifications = true }: { showNotifications?: boolean }) {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <>
      <CryptoTicker />
      <header className="bg-gray-900/85 backdrop-blur-sm border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <Link href={session ? "/dashboard" : "/"} className="text-xl font-bold text-yellow-500 shrink-0">
            {BRAND_NAME}
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-400">
            {session && (
              <>
                <Link href="/dashboard" className="hover:text-white">{t("dashboard")}</Link>
                <Link href="/plans" className="hover:text-white">{tn("plans")}</Link>
              </>
            )}
            <Link href="/about" className="hover:text-white">{tn("about")}</Link>
            <Link href="/faq" className="hover:text-white">{tn("faq")}</Link>
            <Link href="/contact" className="hover:text-white">{tn("contact")}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {session && showNotifications && <NotificationBell />}
            {session && (
              <>
                <Link href="/profile" className="text-gray-400 hover:text-white text-sm hidden sm:inline">
                  {t("profile")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  {t("logout")}
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
