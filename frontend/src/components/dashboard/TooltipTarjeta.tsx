import type { TooltipContentProps } from "recharts";

interface Props extends TooltipContentProps {
  /** Sufijo de unidad que se muestra junto al valor: "unidades", "órdenes", etc. */
  sufijo?: string;
}

/**
 * Tooltip blanco con borde fino y sombra suave, como el de la referencia.
 * Recharts inyecta "active", "payload" y "label" en las props.
 */
export default function TooltipTarjeta({ active, payload, label, sufijo }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-semibold text-slate-500">{label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((fila, indice) => (
          <li key={`${String(fila.dataKey ?? indice)}`} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: fila.color ?? "var(--color-marca-500)" }}
            />
            <span className="text-slate-600">{fila.name}</span>
            <span className="tabular ml-auto font-semibold text-slate-800">
              {fila.value}
              {sufijo ? ` ${sufijo}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
