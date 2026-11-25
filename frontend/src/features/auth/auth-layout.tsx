import { BarChart3, ClipboardList, Wrench, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

interface Caracteristica {
  icono: LucideIcon;
  texto: string;
}

interface ContenidoPortal {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  caracteristicas: Caracteristica[];
}

const contenido: ContenidoPortal = {
  etiqueta: "Equipo DYD",
  titulo: "Mantenimiento industrial, bajo control.",
  descripcion:
    "Gestioná solicitudes, diagnósticos, cotizaciones y órdenes de trabajo desde un solo lugar.",
  caracteristicas: [
    { icono: ClipboardList, texto: "Solicitudes y órdenes en tiempo real" },
    { icono: Wrench, texto: "Diagnósticos con adjuntos y trazabilidad" },
    { icono: BarChart3, texto: "Reportes operativos y financieros" },
  ],
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const datos = contenido;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-blue-900/25 blur-3xl" />

        <div className="relative">
          <Logo invertido />
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-50 ring-1 ring-white/20">
            {datos.etiqueta}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight">
            {datos.titulo}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-blue-50/90">
            {datos.descripcion}
          </p>
          <ul className="mt-8 space-y-3">
            {datos.caracteristicas.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-blue-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Icono className="h-4 w-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-blue-100/80">
          Soldaduras Especiales y Rectificaciones DYD E.I.R.L.
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>

          <GlassCard className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </GlassCard>

          {footer && <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
