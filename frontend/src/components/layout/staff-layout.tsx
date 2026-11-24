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
  { label: "Solicitudes", to: "/admin/solicitudes", icon: ClipboardList, soon: true },
  { label: "Diagnósticos", to: "/admin/diagnosticos", icon: Stethoscope, soon: true },
  { label: "Cotizaciones", to: "/admin/cotizaciones", icon: Receipt, soon: true },
  { label: "Órdenes de trabajo", to: "/admin/ordenes", icon: Wrench, soon: true },
  { label: "Clientes", to: "/admin/clientes", icon: Building2, soon: true },
  { label: "Máquinas", to: "/admin/maquinas", icon: Factory, soon: true },
  { label: "Materiales", to: "/admin/materiales", icon: Package, soon: true },
  { label: "Preventivos", to: "/admin/preventivos", icon: CalendarClock, soon: true },
  { label: "Usuarios", to: "/admin/usuarios", icon: Users, soon: true },
  { label: "Reportes", to: "/admin/reportes", icon: BarChart3, soon: true },
];

const navTecnico: NavItem[] = [
  { label: "Panel", to: "/tecnico", icon: LayoutDashboard },
  { label: "Mis solicitudes", to: "/tecnico/solicitudes", icon: ClipboardList, soon: true },
  { label: "Mis órdenes", to: "/tecnico/ordenes", icon: Wrench, soon: true },
  { label: "Diagnósticos", to: "/tecnico/diagnosticos", icon: Stethoscope, soon: true },
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
