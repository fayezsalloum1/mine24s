"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  const links = user
    ? [
        { href: "/dashboard", label: t("dashboard") },
        { href: "/plans", label: tn("plans") },
        { href: "/withdraw", label: tn("withdraw") },
        { href: "/profile", label: t("profile") },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: t("admin") }] : []),
      ]
    : [];

  const publicLinks = [
    { href: "/about", label: tn("about") },
    { href: "/faq", label: tn("faq") },
    { href: "/contact", label: tn("contact") },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-slate-700/60 bg-slate-800/50 hover:border-amber-500/40 transition-colors"
        aria-label="Menu"
        aria-expanded={open}
      >
        <span className={`block w-5 h-0.5 bg-amber-400 transition-all ${open ? "rotate-45 translate-y-1.5" : ""}`} />
        <span className={`block w-5 h-0.5 bg-amber-400 my-1 transition-all ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-amber-400 transition-all ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[7.5rem] bg-black/50 z-40" onClick={() => setOpen(false)} />
          <nav className="absolute top-full left-0 right-0 z-50 mobile-menu-enter mx-4 mt-2 rounded-2xl border border-slate-700/60 bg-slate-900/98 backdrop-blur-xl shadow-panel overflow-hidden">
            {user ? (
              <>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-3.5 text-slate-200 hover:bg-amber-500/10 hover:text-amber-400 border-b border-slate-800/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="block w-full text-left px-5 py-3.5 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-3.5 text-slate-200 hover:bg-amber-500/10 hover:text-amber-400 border-b border-slate-800/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="block px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-center"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
