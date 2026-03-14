import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

export type UserRole = "student" | "instructor" | "admin";

export interface AuthProfile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  degree: string | null;
  institution: string | null;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  setError: (error: string | null) => void;
}

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  if (!supabase) return null;

  // Safety timeout so a slow/broken profile query doesn't block the whole app.
  const timeout = new Promise<AuthProfile | null>((resolve) =>
    setTimeout(() => resolve(null), 5000),
  );

  const query = (async () => {
    const client = supabase!;

    const { data, error } = await client
      .from("profiles")
      .select(
        "id, role, full_name, avatar_url, degree, institution, current_streak, best_streak, created_at",
      )
      .eq("id", userId)
      .single();

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.error("[AuthContext] Failed to load profile", error);
      return null;
    }

    return {
      id: data.id,
      role: data.role as UserRole,
      full_name: data.full_name ?? "",
      avatar_url: data.avatar_url ?? null,
      degree: data.degree ?? null,
      institution: data.institution ?? null,
      current_streak: data.current_streak ?? 0,
      best_streak: data.best_streak ?? 0,
      created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    };
  })();

  return Promise.race([query, timeout]);
}

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "instructor":
      return "/instructor/dashboard";
    default:
      return "/dashboard";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setState({
      ...initialState,
      loading: false,
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const getSession = async () => {
      const client = supabase!;
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session?.user) {
        setState((s) => ({ ...s, user: null, session: null, profile: null, loading: false }));
        return;
      }
      const profile = await fetchProfile(session.user.id);
      setState((s) => ({
        ...s,
        user: session.user,
        session,
        profile,
        loading: false,
      }));
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setState((s) => ({ ...s, user: null, session: null, profile: null }));
        return;
      }
      const profile = await fetchProfile(session.user.id);
      setState((s) => ({
        ...s,
        user: session.user,
        session,
        profile,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    ...state,
    signOut,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRedirectPath(): string {
  const { profile } = useAuth();
  return getRedirectPath(profile?.role ?? "student");
}

export { getRedirectPath };
