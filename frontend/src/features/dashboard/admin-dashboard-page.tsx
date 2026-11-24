import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { HighlightCards } from "./components/highlight-cards";
import { InventoryStatus } from "./components/inventory-status";
import { KpiCard } from "./components/kpi-card";
import { PerformanceTrend } from "./components/performance-trend";
import { SalesByCategory } from "./components/sales-by-category";
import {
  categoryData,
  inventarioPorcentajeEnStock,
  inventoryData,
  kpiCards,
  performanceData,
} from "./mock-data";

function fechaLarga(): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Panel de control"
        description="Resumen operativo de DYD: ingresos, solicitudes e inventario."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-xl">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          {fechaLarga()}
        </span>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceTrend data={performanceData} />
        </div>
        <InventoryStatus
          data={inventoryData}
          porcentajeEnStock={inventarioPorcentajeEnStock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesByCategory data={categoryData} />
        </div>
        <HighlightCards />
      </div>
    </div>
  );
}
