import { Outlet, useNavigate } from "react-router-dom";
import { ClipboardList, Factory, LayoutDashboard } from "lucide-react";
import { useClientAuth } from "@/features/auth/client-auth";
import { iniciales } from "@/lib/format";
import { AppShell, type NavItem } from "./app-shell";

const navCliente: NavItem[] = [
  { label: "Panel", to: "/cliente", icon: LayoutDashboard },
  { label: "Mis solicitudes", to: "/cliente/solicitudes", icon: ClipboardList, soon: true },
  { label: "Mis máquinas", to: "/cliente/maquinas", icon: Factory, soon: true },
];

export function ClientLayout() {
  const { cliente, cerrarSesion } = useClientAuth();
  const navigate = useNavigate();

  if (!cliente) return null;

  const onLogout = async () => {
    await cerrarSesion();
    navigate("/cliente/login", { replace: true });
  };

  return (
    <AppShell
      portalLabel="Portal de clientes"
      nav={navCliente}
      user={{
        nombre: cliente.razon_social,
        rol: "Cliente",
        iniciales: iniciales(cliente.razon_social),
      }}
      onLogout={onLogout}
    >
      <Outlet />
    </AppShell>
  );
}
