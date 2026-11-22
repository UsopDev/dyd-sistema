import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TooltipTarjeta from "./TooltipTarjeta";

export interface BarraDato {
  etapa: string;
  solicitudes: number;
  ordenes: number;
}

interface Props {
  datos: BarraDato[];
  alto?: number;
}

/**
 * Barras agrupadas: compara solicitudes y órdenes por etapa.
 * Usa dos variantes de la familia azul para no romper la paleta de la marca.
 */
export default function BarrasComparativas({ datos, alto = 240 }: Props) {
  const maximo = Math.max(1, ...datos.flatMap((d) => [d.solicitudes, d.ordenes]));

  return (
    <div style={{ height: `${alto}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 20, right: 8, left: -12, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-grafico-pista)" />
          <XAxis
            dataKey="etapa"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, maximo + 1]}
            width={38}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            content={<TooltipTarjeta />}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 4 }}
          />
          <Bar
            dataKey="solicitudes"
            name="Solicitudes"
            fill="var(--color-marca-500)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            label={{ position: "top", fontSize: 10, fill: "#475569" }}
          />
          <Bar
            dataKey="ordenes"
            name="Órdenes"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            label={{ position: "top", fontSize: 10, fill: "#475569" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
