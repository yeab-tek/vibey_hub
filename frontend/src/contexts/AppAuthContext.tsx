"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usersApi, type User, calculateLevel } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface AppAuthState {
  user: (User & { level: string }) | null;
  allUsers: User[];
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppAuthContext = createContext<AppAuthState | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<(User & { level: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await usersApi.list();
      setAllUsers(users);
      return users;
    } catch (err) {
      console.warn("[AppAuth] Failed to fetch users:", err);
      setAllUsers([]);
      return [];
    }
  }, []);

  const syncProfileForEmail = useCallback(
    async (authUserId: string, email: string, fallbackName?: string) => {
      let users = await fetchUsers();
      let profile = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!profile) {
        profile = await usersApi.create({
          id: authUserId,
          name: fallbackName || email.split("@")[0],
          email,
          role: "intern",
        });
        users = await fetchUsers();
      }

      setCurrentUser({ ...profile, level: calculateLevel(profile.total_points) });
    },
    [fetchUsers]
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user?.email) {
        await syncProfileForEmail(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user?.email) {
          setLoading(true);
          await syncProfileForEmail(session.user.id, session.user.email);
          setLoading(false);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      if (data.user) {
        await syncProfileForEmail(data.user.id, email, name);
      }
    },
    [syncProfileForEmail]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  return (
    <AppAuthContext.Provider
      value={{
        user: currentUser,
        allUsers,
        loading,
        authError,
        signIn,
        signUp,
        logout,
        refresh,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AppAuthProvider");
  return ctx;
}
