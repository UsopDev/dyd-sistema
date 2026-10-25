import { useState, type SyntheticEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const { usuario, cargando, entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargando && usuario) return <Navigate to="/" replace />;

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await entrar(email.trim(), password);
      navegar("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-slate-800">DyD Sistema</h1>
        <p className="mb-6 text-sm text-slate-500">Inicia sesión para continuar</p>

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
        />

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
