"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  requires2FA: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export default function AuthProvider({
  children,
  initialUser,
  initialRequires2FA = false,
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
  initialRequires2FA?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [requires2FA, setRequires2FA] = useState(initialRequires2FA);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setRequires2FA(Boolean(data.requires2FA));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setRequires2FA(false);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, requires2FA, refresh, signOut }),
    [user, loading, requires2FA, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
