import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import type { Rol } from "../auth/contexto";

export default function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="p-8 text-slate-500">Cargando...</p>;
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;

  return <Outlet />;
}
