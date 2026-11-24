import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";

interface Modulo {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

interface PortalPlaceholderProps {
  title: string;
  description: string;
  modules: Modulo[];
}

export function PortalPlaceholder({
  title,
  description,
  modules,
}: PortalPlaceholderProps) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />

      <GlassCard className="overflow-hidden p-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-6 py-8 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />

          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-50 ring-1 ring-white/25">
            <Sparkles className="h-3 w-3" />
            Fase 1
          </span>
          <h2 className="relative mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Estamos preparando este panel
          </h2>
          <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-blue-50/90">
            El acceso, la sesión y la navegación ya están funcionando. Los
            módulos operativos se habilitan en la próxima fase del proyecto.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          {modules.map(({ icono: Icono, titulo, descripcion }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-white/70 bg-white/60 p-4 ring-1 ring-slate-900/[0.03]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Icono className="h-5 w-5" />
                </span>
                <Badge variant="neutral">Pronto</Badge>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {descripcion}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
