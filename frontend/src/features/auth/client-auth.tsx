import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { createClientApi } from "@/lib/http";
import type { ClienteSesion, RespuestaLoginCliente } from "@/types/api";

interface ClientAuthValue {
  cliente: ClienteSesion | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<ClienteSesion>;
  cerrarSesion: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthValue | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  // El realm cliente solo se sondea donde puede haber sesión de cliente.
  // Evita 401 innecesarios en el panel de staff (/admin, /tecnico, /login).
  const { pathname } = useLocation();
  const [debeRestaurar] = useState(
    () => pathname === "/" || pathname.startsWith("/cliente"),
  );
  const [cliente, setCliente] = useState<ClienteSesion | null>(null);
  const [cargando, setCargando] = useState(debeRestaurar);

  const api = useMemo(() => createClientApi(() => setCliente(null)), []);

  useEffect(() => {
    if (!debeRestaurar) return;

    let activo = true;

    api
      .get<{ cliente: ClienteSesion }>("/cliente/auth/me")
      .then(({ data }) => {
        if (activo) setCliente(data.cliente);
      })
      .catch(() => {
        if (activo) setCliente(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [api, debeRestaurar]);

  const iniciarSesion = async (email: string, password: string) => {
    const { data } = await api.post<RespuestaLoginCliente>(
      "/cliente/auth/login",
      { email, password },
    );
    setCliente(data.cliente);
    return data.cliente;
  };

  const cerrarSesion = async () => {
    try {
      await api.post("/cliente/auth/logout");
    } finally {
      setCliente(null);
    }
  };

  return (
    <ClientAuthContext.Provider
      value={{ cliente, cargando, iniciarSesion, cerrarSesion }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth(): ClientAuthValue {
  const contexto = useContext(ClientAuthContext);

  if (!contexto) {
    throw new Error("useClientAuth debe usarse dentro de ClientAuthProvider");
  }

  return contexto;
}
