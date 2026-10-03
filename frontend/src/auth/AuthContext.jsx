import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, getAccessToken, clearAccessToken } from "@/services/apiClient";
import { login as loginRequest, register as registerRequest } from "@/services/apiAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (!getAccessToken()) {
        if (active) setLoading(false);
        return;
      }
      try {
        const current = await apiRequest("/users/me", { auth: true });
        if (active) setUser(current);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    const clearUser = () => setUser(null);
    window.addEventListener("trackhire:unauthorized", clearUser);
    restore();
    return () => {
      active = false;
      window.removeEventListener("trackhire:unauthorized", clearUser);
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    async login(credentials) {
      setLoading(true);
      try {
        const result = await loginRequest(credentials);
        setUser(result.user);
        return result.user;
      } finally {
        setLoading(false);
      }
    },
    async register(profile) {
      setLoading(true);
      try {
        await registerRequest(profile);
        const result = await loginRequest({ email: profile.email, password: profile.password });
        setUser(result.user);
        return result.user;
      } finally {
        setLoading(false);
      }
    },
    logout() {
      clearAccessToken();
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook lives beside its provider so auth context usage stays centralized.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
