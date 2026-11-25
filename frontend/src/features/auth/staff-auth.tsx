import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { createStaffApi } from "@/lib/http";
import type { RespuestaLoginStaff, Usuario } from "@/types/api";

interface StaffAuthValue {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  // El realm staff no aplica dentro del portal de cliente.
  const { pathname } = useLocation();
  const [debeRestaurar] = useState(() => !pathname.startsWith("/cliente"));
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(debeRestaurar);

  const api = useMemo(() => createStaffApi(() => setUsuario(null)), []);

  useEffect(() => {
    if (!debeRestaurar) return;

    let activo = true;

    api
      .get<{ usuario: Usuario }>("/auth/me")
      .then(({ data }) => {
        if (activo) setUsuario(data.usuario);
      })
      .catch(() => {
        if (activo) setUsuario(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [api, debeRestaurar]);

  const iniciarSesion = async (email: string, password: string) => {
    const { data } = await api.post<RespuestaLoginStaff>("/auth/login", {
      email,
      password,
    });
    setUsuario(data.usuario);
    return data.usuario;
  };

  const cerrarSesion = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUsuario(null);
    }
  };

  return (
    <StaffAuthContext.Provider
      value={{ usuario, cargando, iniciarSesion, cerrarSesion }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth(): StaffAuthValue {
  const contexto = useContext(StaffAuthContext);

  if (!contexto) {
    throw new Error("useStaffAuth debe usarse dentro de StaffAuthProvider");
  }

  return contexto;
}
