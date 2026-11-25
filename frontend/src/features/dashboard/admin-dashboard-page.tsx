import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/features/admin/components/states";
import { useSolicitudesPorMes } from "./hooks/use-admin-dashboard";
import {
  useIngresosPorMes,
  useMaterialesActivos,
  useResumen,
  useSolicitudesPorEstado,
  useStockBajo,
} from "./hooks/use-admin-dashboard";
import { HighlightCards } from "./components/highlight-cards";
import { InventoryStatus } from "./components/inventory-status";
import { KpiCard } from "./components/kpi-card";
import { PerformanceTrend } from "./components/performance-trend";
import { SalesByCategory } from "./components/sales-by-category";
import { mensajeDeError } from "@/lib/http";
import {
  formatMesClave,
  formatMesCorto,
  formatNumber,
  formatSoles,
  hoyISO,
} from "@/lib/format";
import {
  COLOR_ESTADO_SOLICITUD,
  ETIQUETA_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import type {
  CategoriaBarra,
  KpiCardData,
  PuntoRendimiento,
  SegmentoInventario,
} from "@/types/admin-dashboard";

interface MesCalculado {
  clave: string;
  desde: string;
  hasta: string;
}

function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function construirRango(cantidadMeses: number): {
  desde: string;
  hasta: string;
  meses: MesCalculado[];
} {
  const hoy = new Date();
  const meses: MesCalculado[] = [];

  for (let indice = cantidadMeses - 1; indice >= 0; indice -= 1) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - indice, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() - indice + 1, 0);
    const clave = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}`;

    meses.push({
      clave,
      desde: fechaLocalISO(inicio),
      hasta: fechaLocalISO(fin),
    });
  }

  return {
    desde: meses[0]?.desde ?? hoyISO(),
    hasta: hoyISO(),
    meses,
  };
}

function fechaLarga(): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function variacionPorcentual(actual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

export function AdminDashboardPage() {
  const [meses, setMeses] = useState(6);
  const rango = useMemo(() => construirRango(meses), [meses]);

  const resumen = useResumen(rango.desde, rango.hasta);
  const ingresos = useIngresosPorMes(rango.desde, rango.hasta);
  const estados = useSolicitudesPorEstado(rango.desde, rango.hasta);
  const stockBajo = useStockBajo();
  const materiales = useMaterialesActivos();
  const solicitudesMes = useSolicitudesPorMes(rango.meses);

  const error =
    resumen.error ??
    ingresos.error ??
    estados.error ??
    stockBajo.error ??
    materiales.error;

  const cargando =
    resumen.isLoading ||
    ingresos.isLoading ||
    estados.isLoading ||
    stockBajo.isLoading ||
    materiales.isLoading;

  const reintentar = () => {
    void resumen.refetch();
    void ingresos.refetch();
    void estados.refetch();
    void stockBajo.refetch();
    void materiales.refetch();
    solicitudesMes.forEach((consulta) => void consulta.refetch());
  };

  const seriesIngresos = ingresos.data?.data ?? [];
  const mesActual = seriesIngresos.at(-1)?.total ?? 0;
  const mesPrevio = seriesIngresos.at(-2)?.total ?? 0;
  const variacionIngresos = variacionPorcentual(mesActual, mesPrevio);

  const kpis: KpiCardData[] = [
    {
      id: "ingresos",
      label: "Ingresos totales",
      value: formatSoles(resumen.data?.ordenes.ingreso_total ?? 0),
      hint: `${formatNumber(resumen.data?.ordenes.finalizadas ?? 0)} órdenes finalizadas`,
      tone: "blue",
      icon: "wallet",
      ...(variacionIngresos !== null
        ? {
            trend: {
              valor: `${variacionIngresos >= 0 ? "+" : ""}${variacionIngresos}%`,
              direccion: variacionIngresos >= 0 ? "up" : "down",
            },
          }
        : {}),
    },
    {
      id: "clientes",
      label: "Clientes activos",
      value: formatNumber(resumen.data?.clientes_activos ?? 0),
      hint: "clientes habilitados en el sistema",
      tone: "sky",
      icon: "users",
    },
    {
      id: "solicitudes",
      label: "Solicitudes",
      value: formatNumber(resumen.data?.solicitudes.total ?? 0),
      hint: `${formatNumber(resumen.data?.solicitudes.en_proceso ?? 0)} en proceso · ${formatNumber(resumen.data?.solicitudes.finalizadas ?? 0)} finalizadas`,
      tone: "indigo",
      icon: "clipboard",
      badge: `${resumen.data?.solicitudes.tasa_finalizacion ?? 0}% finalizadas`,
    },
    {
      id: "maquinas",
      label: "Máquinas operativas",
      value: formatNumber(resumen.data?.maquinas_activas ?? 0),
      hint: "equipos disponibles para servicio",
      tone: "emerald",
      icon: "factory",
    },
  ];

  const rendimiento: PuntoRendimiento[] = rango.meses.map((mes, indice) => {
    const ingresoMes = seriesIngresos.find(
      (item) => item.mes === mes.clave,
    );

    return {
      mes: mes.clave,
      etiqueta: formatMesCorto(mes.clave),
      ingresos: ingresoMes?.total ?? 0,
      solicitudes: solicitudesMes[indice]?.data ?? 0,
    };
  });

  const totalMateriales = materiales.data?.length ?? 0;
  const materialesBajos = stockBajo.data?.materiales ?? [];
  const agotados = materialesBajos.filter(
    (material) => Number(material.stock_actual) <= 0,
  ).length;
  const bajoMinimo = materialesBajos.length - agotados;
  const enStock = Math.max(0, totalMateriales - materialesBajos.length);
  const porcentajeEnStock =
    totalMateriales > 0
      ? Math.round((enStock / totalMateriales) * 100)
      : 0;

  const inventario: SegmentoInventario[] = [
    { name: "En stock", value: enStock, color: "#2563eb" },
    { name: "Bajo stock", value: bajoMinimo, color: "#f59e0b" },
    { name: "Agotado", value: agotados, color: "#f43f5e" },
  ];

  const totalSolicitudes = estados.data?.total ?? 0;
  const categorias: CategoriaBarra[] = (estados.data?.data ?? []).map(
    (item) => {
      const porcentaje =
        totalSolicitudes > 0
          ? Math.round((item.cantidad / totalSolicitudes) * 100)
          : 0;

      return {
        categoria: ETIQUETA_ESTADO_SOLICITUD[item.estado],
        cantidad: item.cantidad,
        porcentaje,
        porcentajeLabel: `${porcentaje}%`,
        color: COLOR_ESTADO_SOLICITUD[item.estado],
      };
    },
  );

  const mejorMes = seriesIngresos.reduce<{
    mes: string;
    total: number;
    indice: number;
  } | null>((mejor, item, indice) => {
    if (!mejor || item.total > mejor.total) {
      return { ...item, indice };
    }
    return mejor;
  }, null);

  const mejorPeriodo =
    mejorMes && mejorMes.total > 0
      ? {
          periodo: formatMesClave(mejorMes.mes),
          monto: formatSoles(mejorMes.total),
          delta:
            variacionPorcentual(
              mejorMes.total,
              seriesIngresos[mejorMes.indice - 1]?.total ?? 0,
            )?.toFixed(1) ?? "—",
          barras: seriesIngresos
            .slice(-7)
            .map((item) => item.total),
        }
      : null;

  const atencion =
    materialesBajos.length > 0
      ? {
          valor: `${formatNumber(materialesBajos.length)} ${materialesBajos.length === 1 ? "material" : "materiales"}`,
          detalle: `${formatNumber(agotados)} agotados · ${formatNumber(bajoMinimo)} bajo mínimo`,
          sparkline: materialesBajos
            .slice(0, 7)
            .map((material) => Number(material.stock_actual)),
        }
      : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Panel de control"
        description="Resumen operativo de DYD: ingresos, solicitudes e inventario."
      >
        <span className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-xl lg:inline-flex">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          {fechaLarga()}
        </span>
        <Select
          value={String(meses)}
          onChange={(event) => setMeses(Number(event.target.value))}
          aria-label="Período del dashboard"
          className="h-9 w-auto min-w-[170px] text-xs"
        >
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Últimos 12 meses</option>
        </Select>
      </PageHeader>

      {error ? (
        <div className="rounded-2xl border border-white/60 bg-white/70 shadow-glass backdrop-blur-xl">
          <ErrorState mensaje={mensajeDeError(error)} onRetry={reintentar} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} loading={cargando} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <PerformanceTrend data={rendimiento} loading={cargando} />
            </div>
            <InventoryStatus
              data={inventario}
              porcentajeEnStock={porcentajeEnStock}
              loading={cargando}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SalesByCategory data={categorias} loading={cargando} />
            </div>
            <HighlightCards
              mejorPeriodo={mejorPeriodo}
              atencion={atencion}
              loading={cargando}
            />
          </div>
        </>
      )}
    </div>
  );
}
