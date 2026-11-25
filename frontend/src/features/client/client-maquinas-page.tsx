import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useMaquinasCliente } from "@/features/client/hooks/use-client-queries";
import { useDebouncedValue } from "@/features/admin/hooks/use-debounced-value";
import { DataTable, type Column } from "@/features/admin/components/data-table";
import {
  FiltersBar,
  SearchFilter,
  SelectFilter,
} from "@/features/admin/components/filters";
import { TablePagination } from "@/features/admin/components/table-pagination";
import {
  ETIQUETA_ESTADO_MAQUINA,
  TONO_ESTADO_MAQUINA,
} from "@/lib/admin-labels";
import { formatCantidad, formatFechaCalendario } from "@/lib/format";
import { mensajeDeError } from "@/lib/http";
import { OPCIONES_ESTADO_MAQUINA } from "@/lib/portal-options";
import {
  estadoMantenimiento,
  proximaProgramacion,
} from "@/lib/portal-utils";
import type { MaquinaPortalCliente } from "@/types/client";
import { DetalleMaquinaClienteModal } from "./components/detalle-maquina-modal";

const LIMITE = 20;

export function ClientMaquinasPage() {
  const [pagina, setPagina] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const qDebounced = useDebouncedValue(q);

  useEffect(() => {
    setPagina(1);
  }, [qDebounced, estado]);

  const consulta = useMaquinasCliente({
    q: qDebounced || undefined,
    estado: estado || undefined,
    pagina,
    limite: LIMITE,
  });

  const maquinas = consulta.data?.maquinas ?? [];
  const total = consulta.data?.total ?? 0;

  const columnas: Column<MaquinaPortalCliente>[] = [
    {
      key: "maquina",
      header: "Máquina",
      cell: (maquina) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-slate-900">{maquina.nombre}</p>
          <p className="text-xs text-slate-400">
            {maquina.codigo ?? "Sin código"}
          </p>
        </div>
      ),
    },
    {
      key: "marca",
      header: "Marca / modelo",
      cell: (maquina) => (
        <div className="min-w-[140px]">
          <p className="text-slate-700">{maquina.marca ?? "—"}</p>
          <p className="text-xs text-slate-400">{maquina.modelo ?? ""}</p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (maquina) => (
        <Badge variant={TONO_ESTADO_MAQUINA[maquina.estado]}>
          {ETIQUETA_ESTADO_MAQUINA[maquina.estado]}
        </Badge>
      ),
    },
    {
      key: "horas",
      header: "Horas de uso",
      cell: (maquina) => `${formatCantidad(maquina.horas_uso)} h`,
    },
    {
      key: "mantenimiento",
      header: "Próximo mantenimiento",
      cell: (maquina) => {
        const programacion = proximaProgramacion(maquina.programaciones);

        if (!programacion?.proximo_mant) {
          return <span className="text-slate-400">—</span>;
        }

        const estadoMant = estadoMantenimiento(programacion.proximo_mant);

        return (
          <div className="flex flex-col items-start gap-1">
            <span>{formatFechaCalendario(programacion.proximo_mant)}</span>
            <Badge variant={estadoMant.tono}>{estadoMant.etiqueta}</Badge>
          </div>
        );
      },
    },
    {
      key: "acciones",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      cell: (maquina) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setDetalleId(maquina.id_maquina);
          }}
          aria-label={`Ver ${maquina.nombre}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mis máquinas"
        description="Equipos registrados y sus mantenimientos programados."
      />

      <GlassCard className="p-4">
        <FiltersBar>
          <SearchFilter
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre, código o marca"
          />
          <SelectFilter
            value={estado}
            onChange={setEstado}
            placeholder="Todos los estados"
            options={OPCIONES_ESTADO_MAQUINA}
          />
        </FiltersBar>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <DataTable
          columns={columnas}
          rows={maquinas}
          getRowKey={(maquina) => maquina.id_maquina}
          loading={consulta.isLoading}
          error={
            consulta.error
              ? mensajeDeError(
                  consulta.error,
                  "No se pudieron cargar tus máquinas",
                )
              : null
          }
          onRetry={() => void consulta.refetch()}
          onRowClick={(maquina) => setDetalleId(maquina.id_maquina)}
          emptyTitle="No tenés máquinas registradas"
          emptyDescription="Cuando se registre un equipo a tu nombre, va a aparecer acá."
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

      <DetalleMaquinaClienteModal
        id={detalleId}
        onClose={() => setDetalleId(null)}
      />
    </div>
  );
}
