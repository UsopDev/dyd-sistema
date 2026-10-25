import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

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
      <header className="flex items-center justify-between bg-slate-800 px-6 py-3 text-white">
        <span className="text-lg font-bold">DyD Sistema</span>
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
