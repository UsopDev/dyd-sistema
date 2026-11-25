import { useEffect, useState } from "react";
import { Eye, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useMisSolicitudes } from "@/features/technician/hooks/use-technician-queries";
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
import type { EstadoSolicitud } from "@/types/admin";
import type { SolicitudTecnico } from "@/types/technician";
import { DetalleSolicitudTecnicoModal } from "./components/detalle-solicitud-modal";

const LIMITE = 20;

export function TechnicianSolicitudesPage({
  estadoInicial,
  titulo = "Mis solicitudes",
  descripcion = "Solicitudes nuevas para diagnosticar y las que tenés asignadas.",
}: {
  estadoInicial?: EstadoSolicitud;
  titulo?: string;
  descripcion?: string;
}) {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>(estadoInicial ?? "");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [abrirFormDiagnostico, setAbrirFormDiagnostico] = useState(false);
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setEstado(estadoInicial ?? "");
  }, [estadoInicial]);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado, prioridad, tipo]);

  const consulta = useMisSolicitudes({
    q: qDebounced || undefined,
    estado: estado || undefined,
    prioridad: prioridad || undefined,
    tipo_servicio: tipo || undefined,
    pagina,
    limite: LIMITE,
  });

  const solicitudes = consulta.data?.solicitudes ?? [];
  const total = consulta.data?.total ?? 0;

  const columnas: Column<SolicitudTecnico>[] = [
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
      header: "Máquina / cliente",
      cell: (solicitud) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-slate-800">
            {solicitud.maquina.nombre}
          </p>
          <p className="text-xs text-slate-400">
            {solicitud.cliente?.razon_social ?? "Máquina propia de DYD"}
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
        <div className="flex items-center justify-end gap-1">
          {solicitud.estado === "RECIBIDA" && (
            <Button
              type="button"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setDetalleId(solicitud.id_solicitud);
                setAbrirFormDiagnostico(true);
              }}
            >
              <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
              Diagnosticar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setDetalleId(solicitud.id_solicitud);
              setAbrirFormDiagnostico(false);
            }}
            aria-label={`Ver ${solicitud.codigo ?? "solicitud"}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={titulo} description={descripcion} />

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
          onRowClick={(solicitud) => {
            setDetalleId(solicitud.id_solicitud);
            setAbrirFormDiagnostico(false);
          }}
          emptyTitle="No hay solicitudes para mostrar"
          emptyDescription="No hay solicitudes nuevas para diagnosticar ni asignadas a vos en este momento."
          minWidth="1040px"
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
        id={detalleId}
        onClose={() => {
          setDetalleId(null);
          setAbrirFormDiagnostico(false);
        }}
        abrirFormAlCargar={abrirFormDiagnostico}
      />
    </div>
  );
}
