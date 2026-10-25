import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { AuthContext, type Usuario } from "./contexto";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir o recargar la página se restaura la sesión desde la cookie.
  useEffect(() => {
    api<{ usuario: Usuario }>("/auth/me")
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const entrar = useCallback(async (email: string, password: string) => {
    const r = await api<{ usuario: Usuario }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUsuario(r.usuario);
  }, []);

  const salir = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, salir }),
    [usuario, cargando, entrar, salir],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
