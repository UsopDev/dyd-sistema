import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const enlace = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1 text-sm ${isActive ? "bg-slate-600" : "hover:bg-slate-700"}`;

export default function Layout() {
  const { usuario, salir } = useAuth();
  const navegar = useNavigate();

  async function cerrarSesion() {
    await salir();
    navegar("/login", { replace: true });
  }

  const nombre = [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(" ") || usuario?.email;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-slate-800 px-6 py-3 text-white">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold">DyD Sistema</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={enlace}>
              Inicio
            </NavLink>
            <NavLink to="/clientes" className={enlace}>
              Clientes
            </NavLink>
            <NavLink to="/maquinas" className={enlace}>
              Maquinaria
            </NavLink>
            <NavLink to="/materiales" className={enlace}>
              Materiales
            </NavLink>
            <NavLink to="/solicitudes" className={enlace}>
              Solicitudes
            </NavLink>
            <NavLink to="/ordenes" className={enlace}>
              Órdenes
            </NavLink>
            <NavLink to="/preventivo" className={enlace}>
              Preventivo
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            {nombre} · {usuario?.rol === "ADMINISTRADOR" ? "Administrador" : "Técnico"}
          </span>
          <button
            onClick={cerrarSesion}
            className="rounded bg-slate-600 px-3 py-1 hover:bg-slate-500"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}