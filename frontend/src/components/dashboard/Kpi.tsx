interface Props {
  etiqueta: string;
  valor: string | number;
  /** Texto auxiliar bajo el número: contexto o tendencia. */
  detalle?: string;
  /** Color del valor. Por defecto usa el azul de la marca. */
  color?: string;
  /** Muestra un guion en lugar del número mientras carga. */
  cargando?: boolean;
}

/**
 * Cifra grande de la tarjeta de resumen.
 * Los números usan cifras tabulares para no saltar de posición al actualizarse.
 */
export default function Kpi({ etiqueta, valor, detalle, color, cargando }: Props) {
  return (
    <div className="min-w-0">
      <p className="etiqueta-micro truncate">{etiqueta}</p>
      <p
        className="tabular mt-1 truncate text-2xl font-bold leading-tight"
        style={{ color: color ?? "var(--color-marca-600)" }}
      >
        {cargando ? "—" : valor}
      </p>
      {detalle && <p className="mt-0.5 truncate text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
