import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    "X-Client": "OneDelivery-Admin/2.0",
  },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("od_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      refreshing = true;
      try {
        const refresh = localStorage.getItem("od_admin_refresh");
        if (!refresh) throw new Error("No refresh token");
        const { data } = await api.post("/auth/refresh", { refreshToken: refresh });
        localStorage.setItem("od_admin_token",   data.accessToken);
        localStorage.setItem("od_admin_refresh",  data.refreshToken);
        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        queue.forEach((p) => p.reject(e));
        queue = [];
        localStorage.removeItem("od_admin_token");
        localStorage.removeItem("od_admin_refresh");
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    if (!err.response) return Promise.reject(new Error("Network error. Check your connection."));
    if (err.response?.status === 429) return Promise.reject(new Error("Rate limit hit. Please wait."));
    return Promise.reject(err);
  }
);

export default api;
