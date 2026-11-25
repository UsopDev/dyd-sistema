import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Logo } from "@/components/ui/logo";
import { useStaffAuth } from "@/features/auth/staff-auth";

export function ForbiddenPage() {
  const { usuario } = useStaffAuth();

  const destino = usuario
    ? usuario.rol === "ADMINISTRADOR"
      ? "/admin"
      : "/tecnico"
    : "/login";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <Link to="/" className="mb-6">
        <Logo />
      </Link>

      <GlassCard className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Error 403
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
          No tenés acceso a esta sección
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Tu usuario no cuenta con los permisos necesarios. Si creés que es un
          error, contactá al administrador del sistema.
        </p>

        <Link to={destino} className="mt-6 block">
          <Button className="w-full">Volver a mi panel</Button>
        </Link>
      </GlassCard>
    </div>
  );
}
