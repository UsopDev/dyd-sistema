import { useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { useResumenDashboard } from "../lib/useResumenDashboard";
import AlertasPreventivo from "../components/AlertasPreventivo";
import Tarjeta from "../components/dashboard/Tarjeta";
import Kpi from "../components/dashboard/Kpi";
import Esqueleto from "../components/dashboard/Esqueleto";
import DonutEstados, { type Segmento } from "../components/dashboard/DonutEstados";
import MedidorGauge from "../components/dashboard/MedidorGauge";
import BarrasComparativas from "../components/dashboard/BarrasComparativas";
import TablaBarras from "../components/dashboard/TablaBarras";
import {
  COLORES_ESTADO,
  ESTADOS_ORDEN,
  ESTADOS_SOLICITUD,
  HEX_ESTADO,
  HEX_ORDEN,
  PRIORIDADES,
  type EstadoOrden,
  type EstadoSolicitud,
} from "../lib/etiquetas";

const SOLICITUDES: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
  "EN_PROCESO",
  "FINALIZADA",
  "CANCELADA",
];

const ORDENES: EstadoOrden[] = ["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"];

/** Etapa de la orden relacionada con cada estado de solicitud. */
const ETAPA_SOLICITUD: Partial<Record<EstadoSolicitud, string>> = {
  ASIGNADA: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
};

const ETAPA_ORDEN: Record<EstadoOrden, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function porcentaje(parte: number, total: number): number {
  if (total === 0) return 0;
  return (parte / total) * 100;
}

function BotonRefrescar({ alRefrescar }: { alRefrescar: () => void }) {
  return (
    <button
      onClick={alRefrescar}
      className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      Actualizar
    </button>
  );
}

function EnviarAlertas() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    setMensaje(null);
    try {
      const r = (await api("/alertas-correo/enviar?forzar=true", { method: "POST" })) as {
        enviadas: number;
        fallidas: number;
        revisadas: number;
      };
      setMensaje(`Revisadas: ${r.revisadas} · Enviadas: ${r.enviadas} · Fallidas: ${r.fallidas}`);
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={enviar}
        disabled={enviando}
        className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar alertas"}
      </button>
      {mensaje && <p className="text-right text-[11px] text-slate-500">{mensaje}</p>}
    </div>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const { datos, cargando, refrescar } = useResumenDashboard();

  const totalSolicitudes = datos
    ? SOLICITUDES.reduce((suma, e) => suma + datos.solicitudes[e], 0)
    : 0;
  const totalOrdenes = datos ? ORDENES.reduce((suma, e) => suma + datos.ordenes[e], 0) : 0;

  const solicitudesAbiertas =
    (datos?.solicitudes.RECIBIDA ?? 0) +
    (datos?.solicitudes.EN_DIAGNOSTICO ?? 0) +
    (datos?.solicitudes.COTIZADA ?? 0) +
    (datos?.solicitudes.ASIGNADA ?? 0);
  const ordenesActivas = (datos?.ordenes.PENDIENTE ?? 0) + (datos?.ordenes.EN_PROCESO ?? 0);

  const segmentosSolicitudes: Segmento[] = SOLICITUDES.map((estado) => ({
    etiqueta: ESTADOS_SOLICITUD[estado],
    valor: datos?.solicitudes[estado] ?? 0,
    color: HEX_ESTADO[estado],
  }));

  // Compara cada etapa con su equivalente en solicitudes y en órdenes.
  const etapas = ["Pendiente", "En proceso", "Finalizada"];
  const barras = etapas.map((etapa) => {
    const estadoSolicitud = SOLICITUDES.find((e) => ETAPA_SOLICITUD[e] === etapa);
    const estadoOrden = ORDENES.find((e) => ETAPA_ORDEN[e] === etapa);
    return {
      etapa,
      solicitudes: estadoSolicitud ? (datos?.solicitudes[estadoSolicitud] ?? 0) : 0,
      ordenes: estadoOrden ? (datos?.ordenes[estadoOrden] ?? 0) : 0,
    };
  });

  const avanceOrdenes = porcentaje(datos?.ordenes.FINALIZADA ?? 0, totalOrdenes);
  const avanceSolicitudes = porcentaje(datos?.solicitudes.FINALIZADA ?? 0, totalSolicitudes);
  const preventivosAlDia = porcentaje(datos?.preventivos.alDia ?? 0, datos?.preventivos.total ?? 0);

  const horaActualizacion = new Date().toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      {/* Encabezado de la sección, con la hora de actualización a la derecha. */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Panel de control</h2>
          <p className="text-xs text-slate-500">
            Bienvenido, <strong className="font-semibold text-slate-700">{usuario?.nombres ?? usuario?.email}</strong>
            {esAdmin ? " · Resumen general del taller" : " · Resumen de tu trabajo"}
          </p>
        </div>
        <p className="text-[11px] text-slate-400">Actualizado a las {horaActualizacion}</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Resumen */}
        <Tarjeta
          titulo="Resumen del taller"
          className="col-span-12 lg:col-span-3"
          acciones={<BotonRefrescar alRefrescar={refrescar} />}
        >
          <div className="grid grid-cols-2 gap-4">
            <Kpi
              etiqueta="Solicitudes abiertas"
              valor={solicitudesAbiertas}
              detalle={`${totalSolicitudes} en total`}
              cargando={cargando}
            />
            <Kpi
              etiqueta="Órdenes activas"
              valor={ordenesActivas}
              detalle={`${totalOrdenes} en total`}
              color="#6366f1"
              cargando={cargando}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <Kpi
              etiqueta="Máquinas"
              valor={datos?.contextuales.maquinas ?? 0}
              color="#64748b"
              cargando={cargando}
            />
            <Kpi
              etiqueta="Clientes"
              valor={datos?.contextuales.clientes ?? 0}
              color="#64748b"
              cargando={cargando}
            />
          </div>
        </Tarjeta>

        {/* Donut de solicitudes */}
        <Tarjeta
          titulo="Solicitudes por estado"
          className="col-span-12 md:col-span-6 lg:col-span-3"
          acciones={
            <Link to="/solicitudes" className="text-xs text-marca-600 hover:underline">
              Ver
            </Link>
          }
        >
          {cargando ? (
            <Esqueleto alto={180} />
          ) : (
            <DonutEstados
              datos={segmentosSolicitudes}
              centroValor={totalSolicitudes}
              centroEtiqueta="solicitudes"
              alto={180}
            />
          )}

          {!cargando && (
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {SOLICITUDES.map((estado) => (
                <li key={estado} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: HEX_ESTADO[estado] }}
                  />
                  <span className="truncate text-slate-600">{ESTADOS_SOLICITUD[estado]}</span>
                  <span className="tabular ml-auto font-semibold text-slate-700">
                    {datos?.solicitudes[estado] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {/* Gauge de órdenes */}
        <Tarjeta
          titulo={esAdmin ? "Avance de órdenes" : "Avance de mis órdenes"}
          className="col-span-6 lg:col-span-3"
        >
          {cargando ? (
            <Esqueleto alto={170} className="mx-auto w-full max-w-[200px]" />
          ) : (
            <MedidorGauge
              valor={avanceOrdenes}
              color="var(--color-marca-500)"
              pie="finalizadas"
              insignia={`${datos?.ordenes.EN_PROCESO ?? 0} en proceso`}
              ancho={200}
            />
          )}
        </Tarjeta>

        {/* Gauge de preventivos */}
        <Tarjeta
          titulo="Preventivos al día"
          className="col-span-6 lg:col-span-3"
          acciones={
            esAdmin ? <EnviarAlertas /> : (
              <Link to="/preventivo" className="text-xs text-marca-600 hover:underline">
                Ver
              </Link>
            )
          }
        >
          {cargando ? (
            <Esqueleto alto={170} className="mx-auto w-full max-w-[200px]" />
          ) : (
            <MedidorGauge
              valor={preventivosAlDia}
              color="#10b981"
              pie="en regla"
              insignia={
                (datos?.preventivos.vencidos ?? 0) > 0
                  ? `${datos?.preventivos.vencidos} vencidos`
                  : `${datos?.preventivos.proximos ?? 0} próximos`
              }
              ancho={200}
            />
          )}
        </Tarjeta>

        {/* Cumplimiento */}
        <Tarjeta titulo="Cumplimiento" className="col-span-12 md:col-span-6 lg:col-span-4">
          {cargando ? (
            <div className="space-y-3">
              <Esqueleto alto={120} />
              <Esqueleto alto={32} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MedidorGauge
                  valor={avanceSolicitudes}
                  color="#6366f1"
                  pie="solicitudes"
                  titulo="Solicitudes"
                  ancho={130}
                />
                <MedidorGauge
                  valor={avanceOrdenes}
                  color="var(--color-marca-500)"
                  pie="órdenes"
                  titulo="Órdenes"
                  ancho={130}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="etiqueta-micro">En proceso</p>
                  <p className="tabular mt-0.5 text-lg font-bold text-slate-800">
                    {datos?.solicitudes.EN_PROCESO ?? 0}
                    <span className="ml-1 text-xs font-normal text-slate-500">solicitudes</span>
                  </p>
                </div>
                <div>
                  <p className="etiqueta-micro">Canceladas</p>
                  <p className="tabular mt-0.5 text-lg font-bold text-slate-800">
                    {(datos?.solicitudes.CANCELADA ?? 0) + (datos?.ordenes.CANCELADA ?? 0)}
                    <span className="ml-1 text-xs font-normal text-slate-500">en total</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </Tarjeta>

        {/* Stock bajo */}
        <Tarjeta
          titulo="Materiales con stock bajo"
          className="col-span-12 md:col-span-6 lg:col-span-4"
          acciones={
            <Link to="/materiales" className="text-xs text-marca-600 hover:underline">
              Inventario
            </Link>
          }
        >
          {cargando ? (
            <div className="space-y-3">
              <Esqueleto alto={14} />
              <Esqueleto alto={14} />
              <Esqueleto alto={14} />
            </div>
          ) : (
            <TablaBarras materiales={datos?.stockBajo ?? []} />
          )}
        </Tarjeta>

        {/* Carga operativa */}
        <Tarjeta titulo="Carga operativa por etapa" className="col-span-12 lg:col-span-4">
          {cargando ? (
            <Esqueleto alto={220} />
          ) : (
            <BarrasComparativas datos={barras} alto={220} />
          )}
        </Tarjeta>

        {/* Solicitudes prioritarias */}
        <Tarjeta
          titulo="Solicitudes prioritarias"
          className="col-span-12 lg:col-span-7"
          acciones={
            <Link to="/solicitudes" className="text-xs text-marca-600 hover:underline">
              Ver todas
            </Link>
          }
          sinPadding
        >
          {cargando ? (
            <div className="space-y-3 p-4">
              <Esqueleto alto={32} />
              <Esqueleto alto={32} />
              <Esqueleto alto={32} />
            </div>
          ) : (datos?.prioritarias.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">No hay solicitudes registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500">
                    <th className="px-4 py-2 font-medium">Código</th>
                    <th className="px-4 py-2 font-medium">Máquina</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium">Prioridad</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {datos?.prioritarias.map((s) => (
                    <tr key={s.id_solicitud} className="hover:bg-slate-50/60">
                      <td className="tabular px-4 py-2 font-medium text-slate-700">
                        {s.codigo ?? "—"}
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-2 text-slate-600">
                        {s.maquina.nombre}
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-2 text-slate-600">
                        {s.cliente?.razon_social ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {s.tipo_servicio === "PREVENTIVO" ? "Preventivo" : "Correctivo"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{PRIORIDADES[s.prioridad]}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] ${COLORES_ESTADO[s.estado]}`}
                        >
                          {ESTADOS_SOLICITUD[s.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        {/* Alertas de preventivo */}
        <div className="col-span-12 lg:col-span-5">
          <AlertasPreventivo
            preventivos={datos?.alertasPreventivo ?? []}
            cargando={cargando}
          />
        </div>

        {/* Detalle de órdenes por estado */}
        <Tarjeta
          titulo="Órdenes por estado"
          className="col-span-12"
          acciones={
            <Link to="/ordenes" className="text-xs text-marca-600 hover:underline">
              Ver órdenes
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ORDENES.map((estado) => (
              <Link
                key={estado}
                to="/ordenes"
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: HEX_ORDEN[estado] }}
                  />
                  {ESTADOS_ORDEN[estado]}
                </span>
                <span className="tabular text-sm font-bold text-slate-800">
                  {datos?.ordenes[estado] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </Tarjeta>
      </div>

      {/* Nota de roles al pie, para admins */}
      {esAdmin && (
        <p className="text-[11px] text-slate-400">
          Como administrador ves la totalidad de solicitudes y órdenes del taller.
        </p>
      )}
    </div>
  );
}
