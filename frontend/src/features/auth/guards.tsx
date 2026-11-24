import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import type { RolUsuario } from "@/types/api";
import { useClientAuth } from "./client-auth";
import { useStaffAuth } from "./staff-auth";

export function RootRedirect() {
  const staff = useStaffAuth();
  const cliente = useClientAuth();

  if (staff.cargando || cliente.cargando) {
    return <FullPageLoader />;
  }

  if (staff.usuario) {
    return (
      <Navigate
        to={staff.usuario.rol === "ADMINISTRADOR" ? "/admin" : "/tecnico"}
        replace
      />
    );
  }

  if (cliente.cliente) {
    return <Navigate to="/cliente" replace />;
  }

  return <Navigate to="/login" replace />;
}

export function RequireStaff({
  roles,
  children,
}: {
  roles?: RolUsuario[];
  children: ReactNode;
}) {
  const { usuario, cargando } = useStaffAuth();
  const location = useLocation();

  if (cargando) {
    return <FullPageLoader />;
  }

  if (!usuario) {
    const destino = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/login?redirect=${encodeURIComponent(destino)}`} replace />
    );
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export function RequireClient({ children }: { children: ReactNode }) {
  const { cliente, cargando } = useClientAuth();
  const location = useLocation();

  if (cargando) {
    return <FullPageLoader />;
  }

  if (!cliente) {
    const destino = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/cliente/login?redirect=${encodeURIComponent(destino)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
