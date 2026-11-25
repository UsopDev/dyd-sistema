import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

interface ConfigConReintento extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function crearApi(
  refreshPath: string,
  onSessionExpired: () => void,
): AxiosInstance {
  const api = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  let refrescando: Promise<void> | null = null;

  const refrescar = () => {
    if (!refrescando) {
      refrescando = axios
        .post(`/api${refreshPath}`, null, {
          withCredentials: true,
          timeout: 15000,
        })
        .then(() => undefined)
        .finally(() => {
          refrescando = null;
        });
    }
    return refrescando;
  };

  api.interceptors.response.use(
    (respuesta) => respuesta,
    async (error: AxiosError) => {
      const original = error.config as ConfigConReintento | undefined;
      const status = error.response?.status;
      const url = original?.url ?? "";
      const esRutaDeSesion =
        url.includes(refreshPath) ||
        url.endsWith("/login") ||
        url.endsWith("/logout");

      if (status !== 401 || !original || original._retry || esRutaDeSesion) {
        return Promise.reject(error);
      }

      original._retry = true;

      try {
        await refrescar();
        return api(original);
      } catch (refreshError) {
        if (
          axios.isAxiosError(refreshError) &&
          (refreshError.response?.status === 401 ||
            refreshError.response?.status === 403)
        ) {
          onSessionExpired();
        }
        return Promise.reject(error);
      }
    },
  );

  return api;
}

export function createStaffApi(onSessionExpired: () => void): AxiosInstance {
  return crearApi("/auth/refresh", onSessionExpired);
}

export function mensajeDeError(
  error: unknown,
  porDefecto = "Ocurrió un error inesperado",
): string {
  if (axios.isAxiosError(error)) {
    const datos = error.response?.data as { error?: string } | undefined;
    return datos?.error ?? porDefecto;
  }
  return porDefecto;
}
