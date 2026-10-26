import { useAuth } from "../auth/useAuth";
import AlertasPreventivo from "../components/AlertasPreventivo";

export default function Inicio() {
  const { usuario } = useAuth();

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-slate-800">Panel principal</h2>
        <p className="mt-2 text-slate-600">
          Sesión iniciada como <strong>{usuario?.rol}</strong>.
        </p>
      </div>
      <AlertasPreventivo />
    </div>
  );
}
