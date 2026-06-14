import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { getAppUser } from "@/lib/session";
import LocaleProvider from "@/components/LocaleProvider";
import AnimatedBackground from "@/components/AnimatedBackground";
import AppProviders from "@/components/AppProviders";
import SupportChat from "@/components/SupportChat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Simple Mining",
  description: "Simple Mining — premium cloud mining investment platform. Earn passive income with trusted mining plans.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let appUser = null;
  let requires2FA = false;
  try {
    const session = await getAppUser();
    appUser = session.appUser;
    requires2FA = session.requires2FA;
  } catch (err) {
    console.error("[layout] getAppUser failed:", err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans text-gray-50 relative bg-navy-900 antialiased`}>
        <AnimatedBackground />
        <div className="relative z-10">
          <AuthProvider initialUser={appUser} initialRequires2FA={requires2FA}>
            <LocaleProvider>
              <AppProviders>{children}</AppProviders>
              <SupportChat />
            </LocaleProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
