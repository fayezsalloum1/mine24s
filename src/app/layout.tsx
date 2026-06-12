import type { Metadata } from "next";
import { Cairo, Orbitron } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import LocaleProvider from "@/components/LocaleProvider";
import MiningBackground from "@/components/MiningBackground";
import AppProviders from "@/components/AppProviders";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Cloud Mining",
  description: "Cloud Mining — Virtual Mining Investment Platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cairo.variable} ${orbitron.variable} font-sans text-white relative iconic-theme antialiased`}>
        <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
          <MiningBackground />
        </div>
        <div className="relative z-10">
          <SessionProvider session={session}>
            <LocaleProvider>
              <AppProviders>{children}</AppProviders>
            </LocaleProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
