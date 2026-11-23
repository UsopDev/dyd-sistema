import { useState, type ReactNode, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";
import Campo, { estiloInput } from "../components/Campo";
import {
  COLORES_ORDEN,
  ESTADOS_GENERAL,
  ESTADOS_ORDEN,
  TIPOS_SERVICIO,
  fechaHora,
  type EstadoOrden,
  type TipoServicio,
} from "../lib/etiquetas";

interface Resumen {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
  monto: string | null;
  creado_en: string;
  solicitud: { id_solicitud: string; codigo: string | null };
  tecnico: { nombres: string; apellidos: string };
}

interface Detalle {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
  trabajo_realizado: string | null;
  monto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  solicitud: {
    codigo: string | null;
    tipo_servicio: TipoServicio;
    descripcion: string;
    maquina: { nombre: string; codigo: string | null };
    cliente: { razon_social: string } | null;
  };
  diagnostico: {
    estado_general: keyof typeof ESTADOS_GENERAL;
    fallas_detectadas: string;
    recomendaciones: string | null;
  };
  tecnico: { nombres: string; apellidos: string };
  materiales: {
    id_orden_material: string;
    cantidad: string;
    precio_unitario: string | null;
    subtotal: string | null;
    material: { codigo: string | null; nombre: string; unidad: string };
  }[];
}

interface Respuesta {
  ordenes: Resumen[];
  total: number;
  pagina: number;
  limite: number;
}

interface Material {
  id_material: string;
  nombre: string;
  unidad: string;
  stock_actual: string;
  activo: boolean;
}

const LIMITE = 10;
const dinero = (n: string | number | null) => (n === null ? "—" : Number(n).toFixed(2));

function Etiqueta({ estado }: { estado: EstadoOrden }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${COLORES_ORDEN[estado]}`}>
      {ESTADOS_ORDEN[estado]}
    </span>
  );
}

function RegistrarMaterial({ idOrden, alGuardar }: { idOrden: string; alGuardar: () => void }) {
  const [recargaMat, setRecargaMat] = useState(0);
  const { datos } = useConsulta<{ materiales: Material[] }>("/materiales?limite=100", {}, recargaMat);
  const materiales = (datos?.materiales ?? []).filter((m) => m.activo);
  const [idMaterial, setIdMaterial] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api(`/ordenes/${idOrden}/materiales`, {
        method: "POST",
        body: JSON.stringify({ id_material: idMaterial, cantidad: Number(cantidad) }),
      });
      setRecargaMat((n) => n + 1);
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el material");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-3 rounded bg-slate-50 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Campo etiqueta="Material usado">
            <select
              required
              value={idMaterial}
              onChange={(e) => setIdMaterial(e.target.value)}
              className={estiloInput}
            >
              <option value="">Selecciona un material</option>
              {materiales.map((m) => (
                <option key={m.id_material} value={m.id_material}>
                  {m.nombre} ({m.unidad}) · stock {Number(m.stock_actual)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="w-28">
          <Campo etiqueta="Cantidad">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={estiloInput}
            />
          </Campo>
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="mb-3 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Registrando..." : "Registrar"}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

function FormularioFinalizar({
  idOrden,
  alGuardar,
  alCancelar,
}: {
  idOrden: string;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const [trabajo, setTrabajo] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api(`/ordenes/${idOrden}/finalizar`, {
        method: "POST",
        body: JSON.stringify({
          trabajo_realizado: trabajo.trim(),
          ...(monto !== "" ? { monto: Number(monto) } : {}),
        }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-4">
      <Campo etiqueta="Trabajo realizado *">
        <textarea
          required
          minLength={5}
          maxLength={5000}
          rows={3}
          value={trabajo}
          onChange={(e) => setTrabajo(e.target.value)}
          className={estiloInput}
        />
      </Campo>
      <Campo etiqueta="Monto final (opcional)">
        <input
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          {enviando ? "Finalizando..." : "Finalizar orden"}
        </button>
        <button
          type="button"
          onClick={alCancelar}
          className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Volver
        </button>
      </div>
    </form>
  );
}

function VistaOrden({
  id,
  esAdmin,
  alCambiar,
}: {
  id: string;
  esAdmin: boolean;
  alCambiar: () => void;
}) {
  const [recarga, setRecarga] = useState(0);
  const [finalizando, setFinalizando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const { datos, error, cargando } = useConsulta<{ orden: Detalle }>(`/ordenes/${id}`, {}, recarga);

  if (error) return <p className="text-red-700">{error}</p>;
  if (cargando || !datos) return <p className="text-slate-500">Cargando...</p>;

  const o = datos.orden;

  function refrescar() {
    setFinalizando(false);
    setRecarga((n) => n + 1);
    alCambiar();
  }

  async function accion(ruta: string, confirmacion?: string) {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setErrorAccion(null);

    try {
      await api(`/ordenes/${id}/${ruta}`, { method: "POST" });
      refrescar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo completar la acción");
    }
  }

  const fila = (nombre: string, valor: ReactNode) => (
    <div className="mb-2 flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-slate-500">{nombre}</span>
      <span className="text-slate-800">{valor}</span>
    </div>
  );

  return (
    <div>
      <p className="mb-3 text-xl font-bold text-slate-800">{o.codigo ?? "Sin código"}</p>
      {fila("Estado", <Etiqueta estado={o.estado} />)}
      {fila("Solicitud", o.solicitud.codigo ?? "—")}
      {fila("Tipo de servicio", TIPOS_SERVICIO[o.solicitud.tipo_servicio])}
      {fila(
        "Máquina",
        `${o.solicitud.maquina.nombre}${o.solicitud.maquina.codigo ? ` (${o.solicitud.maquina.codigo})` : ""}`,
      )}
      {fila("Cliente", o.solicitud.cliente?.razon_social ?? "Propia de DyD")}
      {fila("Técnico", `${o.tecnico.nombres} ${o.tecnico.apellidos}`)}
      {fila("Monto", dinero(o.monto))}
      {fila("Problema", <span className="whitespace-pre-wrap">{o.solicitud.descripcion}</span>)}
      {fila(
        "Diagnóstico",
        <span className="whitespace-pre-wrap">
          {ESTADOS_GENERAL[o.diagnostico.estado_general]} · {o.diagnostico.fallas_detectadas}
        </span>,
      )}
      {o.diagnostico.recomendaciones &&
        fila("Recomendaciones", <span className="whitespace-pre-wrap">{o.diagnostico.recomendaciones}</span>)}
      {o.fecha_inicio && fila("Inicio", fechaHora(o.fecha_inicio))}
      {o.fecha_fin && fila("Fin", fechaHora(o.fecha_fin))}
      {o.trabajo_realizado &&
        fila("Trabajo realizado", <span className="whitespace-pre-wrap">{o.trabajo_realizado}</span>)}

      <section className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="mb-2 font-bold text-slate-800">Materiales usados</h3>
        {o.materiales.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no se registró material.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Material</th>
                  <th className="py-1 pr-3">Cantidad</th>
                  <th className="py-1 pr-3">Precio</th>
                  <th className="py-1">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {o.materiales.map((m) => (
                  <tr key={m.id_orden_material} className="border-t border-slate-100">
                    <td className="py-1 pr-3">{m.material.nombre}</td>
                    <td className="py-1 pr-3">
                      {Number(m.cantidad)} {m.material.unidad}
                    </td>
                    <td className="py-1 pr-3">{dinero(m.precio_unitario)}</td>
                    <td className="py-1">{dinero(m.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {o.estado === "EN_PROCESO" && <RegistrarMaterial idOrden={id} alGuardar={refrescar} />}
      </section>

      {errorAccion && <p className="mt-3 text-sm text-red-700">{errorAccion}</p>}

      {finalizando ? (
        <FormularioFinalizar idOrden={id} alGuardar={refrescar} alCancelar={() => setFinalizando(false)} />
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {o.estado === "PENDIENTE" && (
            <button
              onClick={() => accion("iniciar")}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Iniciar trabajo
            </button>
          )}
          {o.estado === "EN_PROCESO" && (
            <button
              onClick={() => setFinalizando(true)}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Finalizar
            </button>
          )}
          {esAdmin && (o.estado === "PENDIENTE" || o.estado === "EN_PROCESO") && (
            <button
              onClick={() => accion("cancelar", "¿Cancelar esta orden? Esta acción no se puede deshacer.")}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Cancelar orden
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Ordenes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [verId, setVerId] = useState<string | null>(null);

  const { datos, error, cargando } = useConsulta<Respuesta>("/ordenes", {
    pagina,
    limite: LIMITE,
    ...(texto && { q: texto.trim() }),
    ...(estado && { estado }),
    ...(fechaDesde && { creado_en_desde: fechaDesde }),
    ...(fechaHasta && { creado_en_hasta: fechaHasta }),
  }, recarga);

  function buscar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPagina(1);
    setRecarga((n) => n + 1);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-1 text-xl font-bold text-slate-800">
        {esAdmin ? "Órdenes de trabajo" : "Mis órdenes de trabajo"}
      </h2>
      {esAdmin && (
        <p className="mb-4 text-sm text-slate-500">
          Para crear una orden, abre la solicitud en Solicitudes y usa «Asignar orden de trabajo».
        </p>
      )}

      <form onSubmit={buscar} className="mb-4 flex flex-wrap gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por código..."
          className={`${estiloInput} flex-1`}
        />
        <select
          value={estado}
          onChange={(e) => {
            setPagina(1);
            setEstado(e.target.value);
          }}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_ORDEN).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Desde</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className={`${estiloInput} w-auto`}
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Hasta</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className={`${estiloInput} w-auto`}
          />
        </label>
        <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Buscar
        </button>
        {(estado || fechaDesde || fechaHasta) && (
          <button
            type="button"
            onClick={() => {
              setEstado("");
              setFechaDesde("");
              setFechaHasta("");
              setPagina(1);
              setRecarga((n) => n + 1);
            }}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </form>

      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}

      {datos && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Orden</th>
                  <th className="py-2 pr-4">Solicitud</th>
                  <th className="py-2 pr-4">Técnico</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Creada</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {datos.ordenes.map((o) => (
                  <tr key={o.id_orden_trabajo} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{o.codigo ?? "—"}</td>
                    <td className="py-2 pr-4">{o.solicitud.codigo ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {o.tecnico.nombres} {o.tecnico.apellidos}
                    </td>
                    <td className="py-2 pr-4">
                      <Etiqueta estado={o.estado} />
                    </td>
                    <td className="py-2 pr-4">{dinero(o.monto)}</td>
                    <td className="py-2 pr-4">{new Date(o.creado_en).toLocaleDateString("es")}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => setVerId(o.id_orden_trabajo)}
                        className="text-sm text-blue-700 hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
                {datos.ordenes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No hay órdenes que mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={datos.pagina} limite={datos.limite} total={datos.total} alCambiar={setPagina} />
        </>
      )}

      {verId && (
        <Modal titulo="Orden de trabajo" alCerrar={() => setVerId(null)}>
          <VistaOrden id={verId} esAdmin={esAdmin} alCambiar={() => setRecarga((n) => n + 1)} />
        </Modal>
      )}
    </div>
  );
}
