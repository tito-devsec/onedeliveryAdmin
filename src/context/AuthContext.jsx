import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: check for stored token
  useEffect(() => {
    const token = localStorage.getItem("od_admin_token");
    if (!token) { setLoading(false); return; }
    // Verify token by fetching /auth/me
    api.get("/auth/me")
      .then(({ data }) => {
        if (data.user?.role === "admin") {
          setUser(data.user);
        } else {
          // Not an admin — clear token
          localStorage.removeItem("od_admin_token");
          localStorage.removeItem("od_admin_refresh");
        }
      })
      .catch(() => {
        localStorage.removeItem("od_admin_token");
        localStorage.removeItem("od_admin_refresh");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.user?.role !== "admin") {
      throw new Error("Access denied. Admin account required.");
    }
    localStorage.setItem("od_admin_token",   data.accessToken);
    localStorage.setItem("od_admin_refresh",  data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("od_admin_refresh");
    try { await api.post("/auth/logout", { refreshToken }); } catch {}
    localStorage.removeItem("od_admin_token");
    localStorage.removeItem("od_admin_refresh");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
