import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronRight,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  soon?: boolean;
}

interface AppShellProps {
  portalLabel: string;
  nav: NavItem[];
  user: {
    nombre: string;
    rol: string;
    iniciales: string;
  };
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

interface SidebarContentProps {
  nav: NavItem[];
  user: AppShellProps["user"];
  onLogout: AppShellProps["onLogout"];
  onNavigate?: () => void;
}

function SidebarContent({ nav, user, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5 pr-12">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menú
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icono = item.icon;

            if (item.soon) {
              return (
                <div
                  key={item.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
                  title="Disponible en la próxima fase"
                >
                  <Icono className="h-[18px] w-[18px]" />
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    Pronto
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-80" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3">
        <div className="rounded-2xl border border-white/60 bg-white/60 p-3 shadow-sm ring-1 ring-slate-900/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user.iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {user.nombre}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user.rol}</p>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  portalLabel,
  nav,
  user,
  onLogout,
  children,
}: AppShellProps) {
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setAbierto(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[268px] border-r border-white/60 bg-white/70 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          nav={nav}
          user={user}
          onLogout={onLogout}
          onNavigate={() => setAbierto(false)}
        />
      </aside>

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/60 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 ring-1 ring-slate-200/70 transition hover:bg-white hover:text-slate-900 lg:hidden"
              onClick={() => setAbierto(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {portalLabel}
              </p>
              <p className="truncate text-sm font-bold text-slate-900">
                DYD Sistema
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge variant="warning" className="hidden sm:inline-flex">
                Datos demo
              </Badge>
              <div className="hidden items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 ring-1 ring-slate-200/70 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {user.iniciales}
                </div>
                <div className="leading-tight">
                  <p className="max-w-[130px] truncate text-xs font-bold text-slate-900">
                    {user.nombre}
                  </p>
                  <p className="text-[10px] text-slate-500">{user.rol}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
