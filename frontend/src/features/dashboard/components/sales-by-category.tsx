import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { GlassCard } from "@/components/ui/glass-card";
import type { CategoriaBarra } from "../mock-data";

export function SalesByCategory({ data }: { data: CategoriaBarra[] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Solicitudes por estado
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Distribución de las solicitudes del período
        </p>
      </div>

      <div className="mt-4 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 44, left: 0, bottom: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="categoria"
              axisLine={false}
              tickLine={false}
              width={88}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
              content={<ChartTooltip />}
            />

            <Bar
              dataKey="cantidad"
              name="Solicitudes"
              radius={[0, 8, 8, 0]}
              maxBarSize={26}
            >
              {data.map((categoria) => (
                <Cell key={categoria.categoria} fill={categoria.color} />
              ))}
              <LabelList
                dataKey="porcentajeLabel"
                position="right"
                offset={8}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
