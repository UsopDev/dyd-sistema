import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useMisOrdenes } from "@/features/technician/hooks/use-technician-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import {
  FiltersBar,
  SearchFilter,
  SelectFilter,
} from "@/features/admin/components/filters";
import { TablePagination } from "@/features/admin/components/table-pagination";
import {
  ETIQUETA_ESTADO_ORDEN,
  ETIQUETA_ESTADO_SOLICITUD,
  TONO_ESTADO_ORDEN,
  TONO_ESTADO_SOLICITUD,
} from "@/lib/admin-labels";
import { formatFecha, formatSoles } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import { OPCIONES_ESTADO_ORDEN } from "@/lib/portal-options";
import type { OrdenTecnico } from "@/types/technician";
import { DetalleSolicitudTecnicoModal } from "./components/detalle-solicitud-modal";

const LIMITE = 20;

export function TechnicianOrdenesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [detalleSolicitudId, setDetalleSolicitudId] = useState<string | null>(
    null,
  );
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado]);

  const consulta = useMisOrdenes({
    q: qDebounced || undefined,
    estado: estado || undefined,
    pagina,
    limite: LIMITE,
  });

  const ordenes = consulta.data?.ordenes ?? [];
  const total = consulta.data?.total ?? 0;

  const columnas: Column<OrdenTecnico>[] = [
    {
      key: "orden",
      header: "Orden",
      cell: (orden) => (
        <div>
          <p className="font-semibold text-slate-900">
            {orden.codigo ?? "Sin código"}
          </p>
          <p className="text-xs text-slate-400">
            Creada el {formatFecha(orden.creado_en)}
          </p>
        </div>
      ),
    },
    {
      key: "solicitud",
      header: "Solicitud",
      cell: (orden) => (
        <div>
          <p className="font-medium text-slate-800">
            {orden.solicitud.codigo ?? "Sin código"}
          </p>
          <Badge variant={TONO_ESTADO_SOLICITUD[orden.solicitud.estado]}>
            {ETIQUETA_ESTADO_SOLICITUD[orden.solicitud.estado]}
          </Badge>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (orden) => (
        <Badge variant={TONO_ESTADO_ORDEN[orden.estado]}>
          {ETIQUETA_ESTADO_ORDEN[orden.estado]}
        </Badge>
      ),
    },
    {
      key: "inicio",
      header: "Inicio",
      cell: (orden) => formatFecha(orden.fecha_inicio),
    },
    {
      key: "fin",
      header: "Fin",
      cell: (orden) => formatFecha(orden.fecha_fin),
    },
    {
      key: "monto",
      header: "Monto",
      cell: (orden) =>
        orden.monto ? formatSoles(orden.monto) : "—",
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (orden) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setDetalleSolicitudId(orden.id_solicitud);
          }}
          aria-label={`Ver ${orden.codigo ?? "orden"}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mis órdenes"
        description="Órdenes de trabajo que tenés asignadas."
      />

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por código de orden"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={OPCIONES_ESTADO_ORDEN}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={ordenes}
          getRowKey={(orden) => orden.id_orden_trabajo}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(
                  consulta.error,
                  "No se pudieron cargar tus órdenes",
                )
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(orden) => setDetalleSolicitudId(orden.id_solicitud)}
          emptyTitle="No tenés órdenes asignadas"
          emptyDescription="Cuando te asignen una orden de trabajo, va a aparecer acá."
          minWidth="900px"
          footer={
            <TablePagination
              pagina={pagina}
              limite={LIMITE}
              total={total}
              onPageChange={setPagina}
              cargando={consulta.isFetching}
            />
          }
        />
      </GlassCard>

      <DetalleSolicitudTecnicoModal
        id={detalleSolicitudId}
        onClose={() => setDetalleSolicitudId(null)}
        titulo="Detalle del trabajo"
      />
    </div>
  );
}
