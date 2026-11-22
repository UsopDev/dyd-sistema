import { Link } from "react-router";
import {
  COLORES_MANT,
  ESTADOS_MANT,
  restante,
  type Programacion,
} from "../lib/etiquetas";
import Tarjeta from "./dashboard/Tarjeta";

interface Props {
  preventivos: Programacion[];
  cargando: boolean;
}

/** Tarjeta de alertas de mantenimiento preventivo, con el chrome nuevo. */
export default function AlertasPreventivo({ preventivos, cargando }: Props) {
  return (
    <Tarjeta
      titulo="Alertas de mantenimiento preventivo"
      acciones={
        <Link to="/preventivo" className="text-xs text-marca-600 hover:underline">
          Ver todas
        </Link>
      }
      className="h-full"
    >
      {cargando && <p className="py-4 text-center text-xs text-slate-500">Cargando...</p>}

      {!cargando && preventivos.length === 0 && (
        <p className="py-6 text-center text-xs text-slate-500">
          No hay mantenimientos próximos ni vencidos.
        </p>
      )}

      <ul className="divide-y divide-slate-100">
        {preventivos.map((p) => (
          <li key={p.id_programacion} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-800">{p.maquina.nombre}</p>
              <p className="truncate text-[11px] text-slate-500">{p.descripcion}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-[11px] text-slate-500 sm:inline">{restante(p)}</span>
              <span
                className={`rounded px-2 py-0.5 text-[11px] ${COLORES_MANT[p.estado_mantenimiento.estado]}`}
              >
                {ESTADOS_MANT[p.estado_mantenimiento.estado]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
