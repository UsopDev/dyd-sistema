import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mensajeDeError } from "@/lib/http";
import type { Usuario } from "@/types/api";
import { AuthLayout } from "./auth-layout";
import { useStaffAuth } from "./staff-auth";

function destinoPara(usuario: Usuario, redirect: string | null): string {
  const base = usuario.rol === "ADMINISTRADOR" ? "/admin" : "/tecnico";
  return redirect && redirect.startsWith(base) ? redirect : base;
}

export function StaffLoginPage() {
  const { usuario, cargando, iniciarSesion } = useStaffAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cargando && usuario) {
    return (
      <Navigate
        to={destinoPara(usuario, searchParams.get("redirect"))}
        replace
      />
    );
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const autenticado = await iniciarSesion(email, password);
      navigate(destinoPara(autenticado, searchParams.get("redirect")), {
        replace: true,
      });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo iniciar sesión"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Acceso para administradores y técnicos."
    >
      <form className="space-y-4" onSubmit={manejarEnvio}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo corporativo</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="nombre@dyd.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={verPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setVerPassword((valor) => !valor)}
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200/70">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          {enviando ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <details className="mt-4 rounded-xl bg-slate-50/80 px-3.5 py-3 text-xs text-slate-500 ring-1 ring-slate-200/70">
        <summary className="cursor-pointer font-semibold text-slate-600">
          Credenciales demo
        </summary>
        <div className="mt-2 space-y-1">
          <p>
            Admin: <span className="font-mono">admin@dyd.com</span> ·{" "}
            <span className="font-mono">Admin1234</span>
          </p>
          <p>
            Técnico: <span className="font-mono">tecnico@dyd.com</span> ·{" "}
            <span className="font-mono">Tecnico1234</span>
          </p>
        </div>
      </details>
    </AuthLayout>
  );
}
