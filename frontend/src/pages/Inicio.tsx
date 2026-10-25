import { useAuth } from "../auth/useAuth";

export default function Inicio() {
  const { usuario } = useAuth();

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-slate-800">Panel principal</h2>
      <p className="mt-2 text-slate-600">
        Sesión iniciada como <strong>{usuario?.rol}</strong>. Aquí irán los accesos a cada módulo.
      </p>
    </div>
  );
}
