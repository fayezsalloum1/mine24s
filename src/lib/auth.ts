import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { check2FAVerified, clear2FAVerified } from "@/lib/otp-store";
import { verifySupabaseLoginToken } from "@/lib/supabase/login-token";

const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60;
const SESSION_MAX_AGE_DEFAULT = 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        supabaseToken: { label: "Supabase Token", type: "text" },
        twoFactorVerified: { label: "2FA Verified", type: "text" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.supabaseToken) {
          const email = verifySupabaseLoginToken(credentials.supabaseToken);
          if (!email) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || user.isFrozen) return null;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            rememberMe: true,
          };
        }

        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user) return null;
        if (user.isFrozen) return null;
        if (!user.emailVerified) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        if (user.twoFactorEnabled) {
          if (credentials.twoFactorVerified !== "true") return null;
          if (!check2FAVerified(user.id)) return null;
          clear2FAVerified();
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          rememberMe: credentials.rememberMe === "true",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        const rememberMe = (user as { rememberMe?: boolean }).rememberMe;
        const maxAge = rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_REMEMBER,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
