import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  requestOtp: (email: string) => Promise<{ devCode?: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (patch: {
    notificationsEnabled?: boolean;
    preferredMethod?: "otp" | "password";
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestOtp = useCallback(async (email: string) => {
    setError(null);
    const data = await api.post<{ ok: boolean; devCode?: string }>("/auth/request-otp", { email });
    return { devCode: data.devCode };
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    setError(null);
    const data = await api.post<{ ok: boolean; user: User }>("/auth/verify-otp", { email, code });
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    const data = await api.post<{ ok: boolean; user: User }>("/auth/signup", {
      email,
      password,
      displayName,
    });
    setUser(data.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await api.post<{ ok: boolean; user: User }>("/auth/login", { email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const updateSettings = useCallback(
    async (patch: { notificationsEnabled?: boolean; preferredMethod?: "otp" | "password" }) => {
      const data = await api.put<{ user: User }>("/auth/settings", patch);
      setUser(data.user);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        refresh,
        requestOtp,
        verifyOtp,
        signup,
        login,
        logout,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
