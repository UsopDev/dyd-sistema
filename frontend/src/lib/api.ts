// Cliente de la API. Las cookies de sesión viajan con credentials: "include".
export class ErrorApi extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

const SIN_REFRESCO = ["/auth/login", "/auth/refresh", "/auth/logout"];

// Si varias peticiones fallan a la vez, se renueva la sesión una sola vez.
let refrescando: Promise<boolean> | null = null;

function refrescar(): Promise<boolean> {
  refrescando ??= fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refrescando = null;
    });
  return refrescando;
}

function peticion(ruta: string, opciones: RequestInit): Promise<Response> {
  return fetch(`/api${ruta}`, {
    ...opciones,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opciones.headers as Record<string, string>) },
  });
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta = await peticion(ruta, opciones);

  // Token de acceso vencido: se intenta renovar y se repite la petición una vez.
  if (respuesta.status === 401 && !SIN_REFRESCO.includes(ruta) && (await refrescar())) {
    respuesta = await peticion(ruta, opciones);
  }

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      cuerpo && typeof cuerpo.error === "string" ? cuerpo.error : "Error de conexión con el servidor";
    throw new ErrorApi(respuesta.status, mensaje);
  }

  return cuerpo as T;
}
