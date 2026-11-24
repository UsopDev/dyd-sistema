import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mensajeDeError } from "@/lib/http";
import { AuthLayout } from "./auth-layout";
import { useClientAuth } from "./client-auth";

export function ClientLoginPage() {
  const { cliente, cargando, iniciarSesion } = useClientAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get("redirect");
  const destino = redirect && redirect.startsWith("/cliente") ? redirect : "/cliente";

  if (!cargando && cliente) {
    return <Navigate to={destino} replace />;
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await iniciarSesion(email, password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo iniciar sesión"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      portal="client"
      title="Portal de clientes"
      subtitle="Consultá tus solicitudes, máquinas y mantenimientos."
      footer={
        <>
          ¿Sos parte del equipo DYD?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Acceso interno
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={manejarEnvio}>
        <div className="space-y-1.5">
          <Label htmlFor="cliente-email">Correo</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="cliente-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="contacto@empresa.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cliente-password">Contraseña</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="cliente-password"
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
        <div className="mt-2">
          <p>
            Cliente: <span className="font-mono">cliente@dyd.com</span> ·{" "}
            <span className="font-mono">Cliente1234</span>
          </p>
        </div>
      </details>
    </AuthLayout>
  );
}
