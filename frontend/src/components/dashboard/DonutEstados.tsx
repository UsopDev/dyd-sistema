import { Cell, Pie, PieChart, ResponsiveContainer, type PieLabelRenderProps } from "recharts";

export interface Segmento {
  etiqueta: string;
  valor: number;
  color: string;
}

interface Props {
  datos: Segmento[];
  /** Texto que se muestra en el centro del donut. */
  centroValor?: number;
  centroEtiqueta?: string;
  /** Alto del gráfico en píxeles. */
  alto?: number;
  /** Muestra los porcentajes con línea guía, como en la referencia. */
  conEtiquetas?: boolean;
}

/**
 * Donut con porcentajes fuera y total al centro.
 * Los segmentos con valor 0 se ocultan para no dejar huecos en el anillo.
 *
 * El centro del anillo se fija en 50%/50% sin márgenes: así el texto del centro
 * queda exactamente sobre el centro geométrico del donut.
 */
export default function DonutEstados({
  datos,
  centroValor,
  centroEtiqueta,
  alto = 200,
  conEtiquetas = true,
}: Props) {
  const visibles = datos.filter((d) => d.valor > 0);
  const total = visibles.reduce((suma, d) => suma + d.valor, 0);

  return (
    <div className="relative" style={{ height: `${alto}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visibles}
            dataKey="valor"
            nameKey="etiqueta"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="70%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            label={
              conEtiquetas
                ? (props: PieLabelRenderProps) => `${((props.percent ?? 0) * 100).toFixed(1)}%`
                : undefined
            }
            labelLine={conEtiquetas ? { stroke: "#cbd5e1", strokeWidth: 1 } : undefined}
          >
            {visibles.map((d) => (
              <Cell key={d.etiqueta} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {centroValor !== undefined && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-bold leading-none text-slate-800">
            {centroValor}
          </span>
          {centroEtiqueta && (
            <span className="etiqueta-micro mt-1 text-center">{centroEtiqueta}</span>
          )}
        </div>
      )}

      {total === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
          Sin datos
        </div>
      )}
    </div>
  );
}
