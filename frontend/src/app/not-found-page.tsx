import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <Link to="/" className="mb-6">
        <Logo />
      </Link>

      <GlassCard className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Error 404
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          La dirección que abriste no existe o fue movida. Volvé al inicio para
          continuar.
        </p>

        <Link to="/" className="mt-6 block">
          <Button className="w-full">Ir al inicio</Button>
        </Link>
      </GlassCard>
    </div>
  );
}
