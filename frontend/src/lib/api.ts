import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE = "/api";

type Realm = "staff" | "cliente";

interface RefreshState {
  promise: Promise<void> | null;
  realm: Realm;
}

const refreshState: Record<Realm, RefreshState> = {
  staff: { promise: null, realm: "staff" },
  cliente: { promise: null, realm: "cliente" },
};

function getRefreshEndpoint(realm: Realm): string {
  return realm === "staff" ? "/api/auth/refresh" : "/api/cliente/auth/refresh";
}

function getMeEndpoint(realm: Realm): string {
  return realm === "staff" ? "/api/auth/me" : "/api/cliente/auth/me";
}

function createApiClient(realm: Realm): AxiosInstance {
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
        url.includes("/auth/refresh") ||
        url.includes("/cliente/auth/login") ||
        url.includes("/cliente/auth/refresh")
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
        
        const state = refreshState[realm];
        
        // Single-flight: if refresh already in progress, wait for it
        if (!state.promise) {
          state.promise = (async () => {
            try {
              await axios.post(getRefreshEndpoint(realm), {}, { withCredentials: true });
              // Refresh succeeded, verify session
              await axios.get(getMeEndpoint(realm), { withCredentials: true });
            } catch {
              // Refresh failed, clear any cached state
              throw new Error(`Sesión expirada (${realm})`);
            } finally {
              state.promise = null;
            }
          })();
        }
        
        try {
          await state.promise;
          // Retry original request
          return client(originalRequest);
        } catch {
          // Redirect to appropriate login
          const loginPath = realm === "staff" ? "/login" : "/cliente/login";
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

export const staffApi = createApiClient("staff");
export const clienteApi = createApiClient("cliente");

// Helper to check if we're authenticated without triggering redirect
export async function checkAuth(realm: Realm): Promise<boolean> {
  try {
    await axios.get(getMeEndpoint(realm), { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

export async function logout(realm: Realm): Promise<void> {
  const endpoint = realm === "staff" ? "/api/auth/logout" : "/api/cliente/auth/logout";
  await axios.post(endpoint, {}, { withCredentials: true });
}
