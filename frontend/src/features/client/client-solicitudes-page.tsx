import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSolicitudesCliente } from "@/features/client/hooks/use-client-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import {
  FiltersBar,
  SearchFilter,
  SelectFilter,
} from "@/features/admin/components/filters";
import { TablePagination } from "@/features/admin/components/table-pagination";
import {
  ETIQUETA_ESTADO_SOLICITUD,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_TIPO_SERVICIO,
  TONO_ESTADO_SOLICITUD,
  TONO_PRIORIDAD,
  TONO_TIPO_SERVICIO,
} from "@/lib/admin-labels";
import { formatFecha } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import {
  OPCIONES_ESTADO_SOLICITUD,
  OPCIONES_PRIORIDAD,
  OPCIONES_TIPO_SERVICIO,
} from "@/lib/portal-options";
import type { SolicitudPortalCliente } from "@/types/client";
import { DetalleSolicitudClienteModal } from "./components/detalle-solicitud-modal";

const LIMITE = 20;

export function ClientSolicitudesPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado, prioridad, tipo]);

  const consulta = useSolicitudesCliente({
    q: qDebounced || undefined,
    estado: estado || undefined,
    prioridad: prioridad || undefined,
    tipo_servicio: tipo || undefined,
    pagina,
    limite: LIMITE,
  });

  const solicitudes = consulta.data?.solicitudes ?? [];
  const total = consulta.data?.total ?? 0;

  const columnas: Column<SolicitudPortalCliente>[] = [
    {
      key: "solicitud",
      header: "Solicitud",
      cell: (solicitud) => (
        <div className="min-w-[210px] max-w-[320px]">
          <p className="font-semibold text-slate-900">
            {solicitud.codigo ?? "Sin código"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {solicitud.descripcion}
          </p>
        </div>
      ),
    },
    {
      key: "maquina",
      header: "Máquina",
      cell: (solicitud) => (
        <div className="min-w-[150px]">
          <p className="font-medium text-slate-800">
            {solicitud.maquina.nombre}
          </p>
          <p className="text-xs text-slate-400">
            {solicitud.maquina.codigo ?? "Sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (solicitud) => (
        <Badge variant={TONO_TIPO_SERVICIO[solicitud.tipo_servicio]}>
          {ETIQUETA_TIPO_SERVICIO[solicitud.tipo_servicio]}
        </Badge>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cell: (solicitud) => (
        <Badge variant={TONO_PRIORIDAD[solicitud.prioridad]}>
          {ETIQUETA_PRIORIDAD[solicitud.prioridad]}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (solicitud) => (
        <Badge variant={TONO_ESTADO_SOLICITUD[solicitud.estado]}>
          {ETIQUETA_ESTADO_SOLICITUD[solicitud.estado]}
        </Badge>
      ),
    },
    {
      key: "fecha",
      header: "Recepción",
      cell: (solicitud) => formatFecha(solicitud.fecha_recepcion),
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (solicitud) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setDetalleId(solicitud.id_solicitud);
          }}
          aria-label={`Ver ${solicitud.codigo ?? "solicitud"}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mis solicitudes"
        description="Estado y avance de los servicios que pediste."
      />

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por código o descripción"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={OPCIONES_ESTADO_SOLICITUD}
          />
          <SelectFilter
            value={prioridad}
            onChange={setPrioridad}
            placeholder="Toda prioridad"
            options={OPCIONES_PRIORIDAD}
          />
          <SelectFilter
            value={tipo}
            onChange={setTipo}
            placeholder="Todo tipo"
            options={OPCIONES_TIPO_SERVICIO}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={solicitudes}
          getRowKey={(solicitud) => solicitud.id_solicitud}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(
                  consulta.error,
                  "No se pudieron cargar tus solicitudes",
                )
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(solicitud) => setDetalleId(solicitud.id_solicitud)}
          emptyTitle="Todavía no tenés solicitudes"
          emptyDescription="Cuando registres un pedido de servicio, va a aparecer acá."
          minWidth="980px"
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

      <DetalleSolicitudClienteModal
        id={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </div>
  );
}
