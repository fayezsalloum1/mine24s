import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import LocaleProvider from "@/components/LocaleProvider";
import AnimatedBackground from "@/components/AnimatedBackground";
import AppProviders from "@/components/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Cloud Mining",
  description: "Premium cloud mining investment platform — earn passive income with trusted mining plans.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans text-gray-50 relative bg-navy-900 antialiased`}>
        <AnimatedBackground />
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
