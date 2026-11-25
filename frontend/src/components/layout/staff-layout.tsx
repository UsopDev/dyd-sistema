import { Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Package,
  Receipt,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { useStaffAuth } from "@/features/auth/staff-auth";
import { iniciales } from "@/lib/format";
import { AppShell, type NavItem } from "./app-shell";

const navAdmin: NavItem[] = [
  { label: "Panel", to: "/admin", icon: LayoutDashboard },
  { label: "Solicitudes", to: "/admin/solicitudes", icon: ClipboardList },
  { label: "Diagnósticos", to: "/admin/diagnosticos", icon: Stethoscope },
  { label: "Cotizaciones", to: "/admin/cotizaciones", icon: Receipt },
  { label: "Órdenes de trabajo", to: "/admin/ordenes", icon: Wrench },
  { label: "Clientes", to: "/admin/clientes", icon: Building2 },
  { label: "Máquinas", to: "/admin/maquinas", icon: Factory },
  { label: "Materiales", to: "/admin/materiales", icon: Package },
  { label: "Preventivos", to: "/admin/preventivos", icon: CalendarClock },
  { label: "Usuarios", to: "/admin/usuarios", icon: Users },
  { label: "Reportes", to: "/admin/reportes", icon: BarChart3 },
];

const navTecnico: NavItem[] = [
  { label: "Panel", to: "/tecnico", icon: LayoutDashboard },
  { label: "Mis solicitudes", to: "/tecnico/solicitudes", icon: ClipboardList },
  { label: "Mis órdenes", to: "/tecnico/ordenes", icon: Wrench },
  { label: "Diagnósticos", to: "/tecnico/diagnosticos", icon: Stethoscope },
];

export function StaffLayout() {
  const { usuario, cerrarSesion } = useStaffAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const esAdmin = usuario.rol === "ADMINISTRADOR";
  const nombre = `${usuario.nombres} ${usuario.apellidos}`;

  const onLogout = async () => {
    await cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell
      portalLabel={esAdmin ? "Administración" : "Portal técnico"}
      nav={esAdmin ? navAdmin : navTecnico}
      user={{
        nombre,
        rol: esAdmin ? "Administrador" : "Técnico",
        iniciales: iniciales(nombre),
      }}
      onLogout={onLogout}
    >
      <Outlet />
    </AppShell>
  );
}
