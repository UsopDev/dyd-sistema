import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Boxes,
  CalendarRange,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Percent,
  Printer,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/features/admin/components/states";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import { SalesByCategory } from "@/features/dashboard/components/sales-by-category";
import {
  useReporteClientes,
  useReporteEstados,
  useReporteIngresos,
  useReporteMateriales,
  useReportePrioridades,
  useReporteResumen,
  useReporteTecnicos,
  useReporteTiempoDiagnostico,
  useReporteTiempoOrden,
  useReporteTipos,
} from "@/features/admin/hooks/use-reportes";
import { dashboardApi } from "@/lib/admin-api";
import { mensajeDeError } from "@/lib/http";
import {
  fechaISO,
  formatCantidad,
  formatCompactSoles,
  formatMesCorto,
  formatNumber,
  formatSoles,
  hoyISO,
  inicioMesAtras,
} from "@/lib/format";
import {
  COLOR_ESTADO_SOLICITUD,
  ETIQUETA_ESTADO_SOLICITUD,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
} from "@/lib/admin-labels";
import type {
  CategoriaBarra,
} from "@/types/admin-dashboard";
import type {
  MaterialUsado,
  ReporteExportable,
  SolicitudClienteItem,
  TecnicoRendimiento,
} from "@/types/admin";

const EXPORTABLES: Array<{ value: ReporteExportable; label: string }> = [
  { value: "resumen", label: "Resumen general" },
  { value: "solicitudes-por-estado", label: "Solicitudes por estado" },
  { value: "solicitudes-por-tipo", label: "Solicitudes por tipo" },
  { value: "solicitudes-por-prioridad", label: "Solicitudes por prioridad" },
  { value: "solicitudes-por-tecnico", label: "Solicitudes por técnico" },
  { value: "solicitudes-por-cliente", label: "Solicitudes por cliente" },
  { value: "tiempo-promedio-diagnostico", label: "Tiempo de diagnóstico" },
  { value: "tiempo-promedio-orden", label: "Tiempo de orden" },
  { value: "materiales-mas-usados", label: "Materiales más usados" },
  { value: "ingresos-por-mes", label: "Ingresos por mes" },
  { value: "tecnicos-rendimiento", label: "Rendimiento de técnicos" },
];

const COLOR_TIPO: Record<string, string> = {
  PREVENTIVO: "#2563eb",
  CORRECTIVO: "#f59e0b",
};

const COLOR_PRIORIDAD: Record<string, string> = {
  ALTA: "#f43f5e",
  MEDIA: "#f59e0b",
  BAJA: "#64748b",
};

function ReporteKpi({
  icon: Icono,
  label,
  value,
  hint,
  loading,
  tono,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  loading?: boolean;
  tono: "blue" | "sky" | "indigo" | "emerald";
}) {
  if (loading) {
    return (
      <GlassCard className="p-5">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="mt-4 h-3 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-3 h-3 w-40" />
      </GlassCard>
    );
  }

  const tonos = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  } as const;

  return (
    <GlassCard className="p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tonos[tono]}`}
      >
        <Icono className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[30px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="mt-2.5 text-[11px] text-slate-400">{hint}</p>
    </GlassCard>
  );
}

function ReporteIngresos({
  data,
  loading,
}: {
  data: Array<{ mes: string; total: number }>;
  loading: boolean;
}) {
  const puntos = data.map((item) => ({
    ...item,
    etiqueta: formatMesCorto(item.mes),
  }));

  return (
    <GlassCard className="p-5 sm:p-6">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Ingresos por mes
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Facturación de órdenes finalizadas en el período.
        </p>
      </div>

      {loading ? (
        <Skeleton className="mt-4 h-[280px] w-full rounded-2xl" />
      ) : puntos.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
          Sin ingresos registrados en el período
        </div>
      ) : (
        <div className="mt-4 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={puntos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillReporteIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="etiqueta"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(valor: number) => formatCompactSoles(valor)}
                width={56}
              />
              <Tooltip cursor={{ stroke: "#bfdbfe", strokeWidth: 1 }} content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Ingresos"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#fillReporteIngresos)"
                dot={{ r: 3, fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}

function BarrasSimple({
  items,
  colores,
  vacio,
}: {
  items: Array<{ etiqueta: string; cantidad: number }>;
  colores: Record<string, string>;
  vacio: string;
}) {
  const maximo = Math.max(...items.map((item) => item.cantidad), 1);

  if (items.every((item) => item.cantidad === 0)) {
    return <p className="py-6 text-center text-xs text-slate-400">{vacio}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.etiqueta}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-600">{item.etiqueta}</span>
            <span className="font-bold tabular-nums text-slate-900">
              {formatNumber(item.cantidad)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.cantidad / maximo) * 100, 3)}%`,
                backgroundColor: colores[item.etiqueta] ?? "#2563eb",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportesPage() {
  const [desde, setDesde] = useState(() => inicioMesAtras(5));
  const [hasta, setHasta] = useState(() => hoyISO());
  const [exportando, setExportando] = useState<ReporteExportable | null>(null);
  const [tipoExport, setTipoExport] = useState<ReporteExportable>("resumen");
  const [formatoExport, setFormatoExport] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const { toast } = useToast();

  const rangoInvalido = Boolean(desde && hasta && desde > hasta);
  const rango = {
    desde: desde || undefined,
    hasta: hasta || undefined,
    enabled: !rangoInvalido,
  };

  const resumen = useReporteResumen(rango);
  const ingresos = useReporteIngresos(rango);
  const estados = useReporteEstados(rango);
  const tipos = useReporteTipos(rango);
  const prioridades = useReportePrioridades(rango);
  const tiempoDiagnostico = useReporteTiempoDiagnostico(rango);
  const tiempoOrden = useReporteTiempoOrden(rango);
  const materiales = useReporteMateriales(rango);
  const tecnicos = useReporteTecnicos(rango);
  const clientes = useReporteClientes(rango);

  const error =
    resumen.error ??
    ingresos.error ??
    estados.error ??
    tipos.error ??
    prioridades.error ??
    tiempoDiagnostico.error ??
    tiempoOrden.error ??
    materiales.error ??
    tecnicos.error ??
    clientes.error;

  const cargando =
    resumen.isLoading ||
    ingresos.isLoading ||
    estados.isLoading ||
    tipos.isLoading ||
    prioridades.isLoading;

  const reintentar = () => {
    void resumen.refetch();
    void ingresos.refetch();
    void estados.refetch();
    void tipos.refetch();
    void prioridades.refetch();
    void tiempoDiagnostico.refetch();
    void tiempoOrden.refetch();
    void materiales.refetch();
    void tecnicos.refetch();
    void clientes.refetch();
  };

  const abrirVistaPrevia = async () => {
    setVistaPreviaAbierta(true);
  };

  const exportar = async () => {
    setExportando(tipoExport);

    try {
      if (formatoExport === "xlsx") {
        await dashboardApi.descargarXlsx(tipoExport, rango.desde, rango.hasta);
      } else if (formatoExport === "pdf") {
        await dashboardApi.descargarPdf(tipoExport, rango.desde, rango.hasta);
      } else {
        await dashboardApi.descargarCsv(tipoExport, rango.desde, rango.hasta);
      }
      toast({
        title: "Reporte descargado",
        description: EXPORTABLES.find((item) => item.value === tipoExport)?.label,
        variant: "success",
      });
    } catch (errorDescarga) {
      toast({
        title: "No se pudo descargar el reporte",
        description: mensajeDeError(errorDescarga),
        variant: "error",
      });
    } finally {
      setExportando(null);
    }
  };

  const totalEstados = estados.data?.total ?? 0;
  const categoriasEstado: CategoriaBarra[] = (estados.data?.data ?? []).map(
    (item) => {
      const porcentaje =
        totalEstados > 0
          ? Math.round((item.cantidad / totalEstados) * 100)
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

  const itemsTipo = (tipos.data?.data ?? []).map((item) => ({
    etiqueta: ETIQUETA_TIPO_SERVICIO[item.tipo],
    cantidad: item.cantidad,
  }));

  const itemsPrioridad = (prioridades.data?.data ?? []).map((item) => ({
    etiqueta: ETIQUETA_PRIORIDAD[item.prioridad],
    cantidad: item.cantidad,
  }));

  const columnasTecnicos: Column<TecnicoRendimiento>[] = [
    {
      key: "tecnico",
      header: "Técnico",
      cell: (item) => (
        <span className="font-semibold text-slate-900">{item.tecnico.nombre}</span>
      ),
    },
    {
      key: "ordenes",
      header: "Órdenes",
      cell: (item) => (
        <span className="tabular-nums">{formatNumber(item.ordenes_finalizadas)}</span>
      ),
    },
    {
      key: "tiempo",
      header: "Tiempo prom.",
      cell: (item) => `${formatCantidad(item.tiempo_promedio_dias)} días`,
    },
    {
      key: "monto",
      header: "Facturado",
      cell: (item) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatSoles(item.monto_total)}
        </span>
      ),
    },
  ];

  const columnasMateriales: Column<MaterialUsado>[] = [
    {
      key: "material",
      header: "Material",
      cell: (item) => (
        <div>
          <p className="font-medium text-slate-800">{item.nombre}</p>
          <p className="text-xs text-slate-400">{item.codigo ?? "Sin código"}</p>
        </div>
      ),
    },
    {
      key: "cantidad",
      header: "Cantidad",
      cell: (item) => (
        <span className="tabular-nums font-semibold">{formatCantidad(item.cantidad)}</span>
      ),
    },
  ];

  const columnasClientes: Column<SolicitudClienteItem>[] = [
    {
      key: "cliente",
      header: "Cliente",
      cell: (item) => item.cliente?.razon_social ?? "Sin cliente",
    },
    {
      key: "solicitudes",
      header: "Solicitudes",
      cell: (item) => (
        <span className="font-semibold tabular-nums">{formatNumber(item.cantidad)}</span>
      ),
    },
  ];

  const aplicarUltimosDias = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 29);
    setDesde(fechaISO(fecha));
    setHasta(hoyISO());
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Reportes"
        description="Indicadores operativos y comerciales del período."
      />

      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Desde
              </span>
              <Input
                type="date"
                value={desde}
                max={hasta || hoyISO()}
                onChange={(event) => setDesde(event.target.value)}
                className="sm:w-[165px]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Hasta
              </span>
              <Input
                type="date"
                value={hasta}
                min={desde || undefined}
                max={hoyISO()}
                onChange={(event) => setHasta(event.target.value)}
                className="sm:w-[165px]"
              />
            </label>

            <div className="flex flex-wrap gap-1.5 pb-0.5">
              <Button type="button" variant="ghost" size="sm" onClick={aplicarUltimosDias}>
                <CalendarRange className="h-3.5 w-3.5" />
                30 días
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDesde(inicioMesAtras(5));
                  setHasta(hoyISO());
                }}
              >
                6 meses
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDesde(`${new Date().getFullYear()}-01-01`);
                  setHasta(hoyISO());
                }}
              >
                Este año
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Reporte
              </span>
              <Select
                value={tipoExport}
                onChange={(event) =>
                  setTipoExport(event.target.value as ReporteExportable)
                }
                aria-label="Reporte a exportar"
                className="sm:w-[240px]"
              >
                {EXPORTABLES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block sm:hidden">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Formato
              </span>
              <Select
                value={formatoExport}
                onChange={(event) =>
                  setFormatoExport(event.target.value as "csv" | "xlsx" | "pdf")
                }
                aria-label="Formato de exportación"
                className="w-full"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (.xlsx)</option>
              </Select>
            </label>
            <label className="hidden sm:block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Formato
              </span>
              <Select
                value={formatoExport}
                onChange={(event) =>
                  setFormatoExport(event.target.value as "csv" | "xlsx")
                }
                aria-label="Formato de exportación"
                className="sm:w-[140px]"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (.xlsx)</option>
              </Select>
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => void abrirVistaPrevia()}
              disabled={Boolean(vistaPreviaAbierta) || rangoInvalido}
            >
              <FileText className="h-4 w-4" />
              Vista previa
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void exportar()}
              disabled={Boolean(exportando) || rangoInvalido}
            >
              {exportando ? (
                <Download className="h-4 w-4 animate-pulse" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar
            </Button>
          </div>
        </div>

        {rangoInvalido && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 ring-1 ring-rose-100">
            La fecha desde no puede ser posterior a la fecha hasta.
          </p>
        )}
      </GlassCard>

      {error && (
        <div className="rounded-2xl border border-white/60 bg-white/70 shadow-glass backdrop-blur-xl">
          <ErrorState
            mensaje={mensajeDeError(error, "No se pudieron cargar los reportes")}
            onRetry={reintentar}
            compacto
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReporteKpi
          icon={ClipboardList}
          label="Solicitudes"
          value={formatNumber(resumen.data?.solicitudes.total ?? 0)}
          hint={`${formatNumber(resumen.data?.solicitudes.finalizadas ?? 0)} finalizadas`}
          loading={cargando}
          tono="indigo"
        />
        <ReporteKpi
          icon={Percent}
          label="Tasa de finalización"
          value={`${resumen.data?.solicitudes.tasa_finalizacion ?? 0}%`}
          hint={`${formatNumber(resumen.data?.solicitudes.en_proceso ?? 0)} en proceso`}
          loading={cargando}
          tono="sky"
        />
        <ReporteKpi
          icon={Wallet}
          label="Ingresos totales"
          value={formatSoles(resumen.data?.ordenes.ingreso_total ?? 0)}
          hint={`${formatNumber(resumen.data?.ordenes.finalizadas ?? 0)} órdenes finalizadas`}
          loading={cargando}
          tono="blue"
        />
        <ReporteKpi
          icon={Users}
          label="Clientes activos"
          value={formatNumber(resumen.data?.clientes_activos ?? 0)}
          hint={`${formatNumber(resumen.data?.maquinas_activas ?? 0)} máquinas operativas`}
          loading={cargando}
          tono="emerald"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesByCategory data={categoriasEstado} loading={estados.isLoading} />
        </div>

        <GlassCard className="p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Tiempos promedio
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Días entre recepción, diagnóstico y cierre.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-blue-500">
                <Clock className="h-3.5 w-3.5" />
                Diagnóstico
              </div>
              {tiempoDiagnostico.isLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                    {tiempoDiagnostico.data &&
                    tiempoDiagnostico.data.total > 0
                      ? `${formatCantidad(tiempoDiagnostico.data.promedio_dias)} días`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatNumber(tiempoDiagnostico.data?.total ?? 0)} diagnósticos
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-500">
                <Wrench className="h-3.5 w-3.5" />
                Orden de trabajo
              </div>
              {tiempoOrden.isLoading ? (
                <Skeleton className="mt-2 h-8 w-24" />
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                    {tiempoOrden.data && tiempoOrden.data.total > 0
                      ? `${formatCantidad(tiempoOrden.data.promedio_dias)} días`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatNumber(tiempoOrden.data?.total ?? 0)} órdenes
                  </p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Tipo de servicio
              </p>
              <div className="mt-3">
                <BarrasSimple
                  items={itemsTipo}
                  colores={COLOR_TIPO}
                  vacio="Sin datos en el período"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Prioridad
              </p>
              <div className="mt-3">
                <BarrasSimple
                  items={itemsPrioridad}
                  colores={COLOR_PRIORIDAD}
                  vacio="Sin datos en el período"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <ReporteIngresos
        data={ingresos.data?.data ?? []}
        loading={ingresos.isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5">
            <Wrench className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Rendimiento de técnicos
            </h2>
          </div>
          <div className="mt-3">
            <DataTable
              columns={columnasTecnicos}
              rows={tecnicos.data?.data ?? []}
              getRowKey={(item) => item.tecnico.id_usuario}
              loading={tecnicos.isLoading}
              emptyTitle="Sin órdenes finalizadas"
              emptyDescription="No hay técnicos con órdenes cerradas en el período."
              skeletonRows={4}
              minWidth="560px"
            />
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5">
            <Boxes className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Materiales más usados
            </h2>
          </div>
          <div className="mt-3">
            <DataTable
              columns={columnasMateriales}
              rows={materiales.data?.data ?? []}
              getRowKey={(item) => item.id_material}
              loading={materiales.isLoading}
              emptyTitle="Sin consumos"
              emptyDescription="No se registraron materiales en órdenes del período."
              skeletonRows={4}
              minWidth="420px"
            />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5">
          <Users className="h-4 w-4 text-blue-600" />
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Solicitudes por cliente
          </h2>
          <Badge variant="neutral" className="ml-auto">
            {formatNumber(clientes.data?.data?.length ?? 0)} clientes
          </Badge>
        </div>
        <div className="mt-3">
          <DataTable
            columns={columnasClientes}
            rows={clientes.data?.data ?? []}
            getRowKey={(item, indice) =>
              item.cliente?.id_cliente ?? `sin-cliente-${indice}`
            }
            loading={clientes.isLoading}
            emptyTitle="Sin solicitudes"
            emptyDescription="No hay solicitudes registradas en el período."
            skeletonRows={4}
            minWidth="420px"
          />
        </div>
      </GlassCard>
      {vistaPreviaAbierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setVistaPreviaAbierta(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Vista previa de impresión</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setVistaPreviaAbierta(false)} aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-[70vh] overflow-auto p-4">
              <iframe
                src={"/api/reportes/exportar/" + tipoExport + "?fecha_desde=" + (rango.desde ?? "") + "&fecha_hasta=" + (rango.hasta ?? "") + "&format=pdf"}
                className="w-full h-full border-0"
                title="Vista previa del reporte"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
