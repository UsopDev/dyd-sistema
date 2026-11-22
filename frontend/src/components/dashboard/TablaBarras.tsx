import type { MaterialBajo } from "../../lib/useResumenDashboard";

interface Props {
  materiales: MaterialBajo[];
  /** Máximo de filas que se muestran antes de resumir. */
  limite?: number;
}

/**
 * Tabla de materiales con barra de progreso inline.
 * La barra se mide contra el stock mínimo: 100% significa que está justo en el límite.
 */
export default function TablaBarras({ materiales, limite = 6 }: Props) {
  const visibles = materiales.slice(0, limite);
  const restantes = materiales.length - visibles.length;

  if (materiales.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="text-xs font-medium text-slate-700">Todo el inventario en regla</p>
        <p className="max-w-[16rem] text-[11px] text-slate-500">
          Ningún material está en o por debajo de su stock mínimo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {visibles.map((m) => {
        const actual = Number(m.stock_actual);
        const minimo = Number(m.stock_minimo);
        const proporcion = minimo > 0 ? Math.min(100, (actual / minimo) * 100) : 0;
        // Por debajo de la mitad del mínimo el estado es crítico.
        const color = proporcion < 50 ? "#f43f5e" : "#f59e0b";

        return (
          <div key={m.id_material}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium text-slate-700">{m.nombre}</span>
              <span className="tabular shrink-0 text-[11px] text-slate-500">
                {actual} / {minimo} {m.unidad}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(3, proporcion)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}

      {restantes > 0 && (
        <p className="pt-1 text-[11px] text-slate-500">
          y {restantes} {restantes === 1 ? "material más" : "materiales más"} con stock bajo.
        </p>
      )}
    </div>
  );
}
