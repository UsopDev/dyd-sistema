import { Link } from "react-router";
import { useConsulta } from "../lib/useConsulta";
import { COLORES_MANT, ESTADOS_MANT, restante, type Programacion } from "../lib/etiquetas";

export default function AlertasPreventivo() {
  const { datos, error, cargando } = useConsulta<{ preventivos: Programacion[]; total: number }>(
    "/preventivos/alertas",
  );

  return (
    <div className="mt-4 rounded-xl bg-white p-6 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Alertas de mantenimiento preventivo</h2>
        <Link to="/preventivo" className="text-sm text-blue-700 hover:underline">
          Ver todas
        </Link>
      </div>

      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}
      {datos && datos.preventivos.length === 0 && (
        <p className="text-sm text-slate-500">No hay mantenimientos próximos ni vencidos.</p>
      )}

      {datos?.preventivos.map((p) => (
        <div
          key={p.id_programacion}
          className="flex items-center justify-between border-t border-slate-100 py-2 text-sm"
        >
          <span>
            <strong className="text-slate-800">{p.maquina.nombre}</strong> · {p.descripcion}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-slate-500">Restante: {restante(p)}</span>
            <span className={`rounded px-2 py-0.5 text-xs ${COLORES_MANT[p.estado_mantenimiento.estado]}`}>
              {ESTADOS_MANT[p.estado_mantenimiento.estado]}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
