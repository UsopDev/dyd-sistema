import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE = "/api";

interface RefreshState {
  promise: Promise<void> | null;
}

const refreshState: RefreshState = { promise: null };

function getRefreshEndpoint(): string {
  return "/api/auth/refresh";
}

function getMeEndpoint(): string {
  return "/api/auth/me";
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  // Request interceptor: ensure we have a valid session
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Skip auth check for login/refresh endpoints
      const url = config.url ?? "";
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/refresh")
      ) {
        return config;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor: handle 401 with single-flight refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Single-flight: if refresh already in progress, wait for it
        if (!refreshState.promise) {
          refreshState.promise = (async () => {
            try {
              await axios.post(getRefreshEndpoint(), {}, { withCredentials: true });
              // Refresh succeeded, verify session
              await axios.get(getMeEndpoint(), { withCredentials: true });
            } catch {
              // Refresh failed, clear any cached state
              throw new Error("Sesión expirada (staff)");
            } finally {
              refreshState.promise = null;
            }
          })();
        }

        try {
          await refreshState.promise;
          // Retry original request
          return client(originalRequest);
        } catch {
          // Redirect to login
          const loginPath = "/login";
          const currentPath = window.location.pathname + window.location.search;
          if (!currentPath.startsWith(loginPath)) {
            window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
          }
          throw error;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const staffApi = createApiClient();

// Helper to check if we're authenticated without triggering redirect
export async function checkAuth(): Promise<boolean> {
  try {
    await axios.get(getMeEndpoint(), { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await axios.post("/api/auth/logout", {}, { withCredentials: true });
}
