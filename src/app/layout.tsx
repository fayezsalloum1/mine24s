import type { Metadata } from "next";
import { Cairo } from "next/font/google";
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
      <body className={`${cairo.variable} font-sans text-white relative`}>
        <MiningBackground />
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
