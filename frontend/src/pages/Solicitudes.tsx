import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";
import Campo, { estiloInput } from "../components/Campo";
import DiagnosticoSolicitud from "../components/DiagnosticoSolicitud";
import CotizacionesSolicitud from "../components/CotizacionesSolicitud";
import {
  COLORES_ESTADO,
  COLORES_PRIORIDAD,
  ESTADOS_GENERAL,
  ESTADOS_SOLICITUD,
  PRIORIDADES,
  TIPOS_SERVICIO,
  fechaHora,
  type EstadoSolicitud,
  type Prioridad,
  type TipoServicio,
} from "../lib/etiquetas";

interface Resumen {
  id_solicitud: string;
  codigo: string | null;
  tipo_servicio: TipoServicio;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoSolicitud;
  fecha_recepcion: string;
  maquina: { id_maquina: string; codigo: string | null; nombre: string };
  cliente: { id_cliente: string; razon_social: string } | null;
}

interface Detalle extends Resumen {
  usuario: { nombres: string; apellidos: string };
  diagnostico: { id_diagnostico: string; estado_general: keyof typeof ESTADOS_GENERAL; fecha: string } | null;
  orden_trabajo: { id_orden_trabajo: string; codigo: string | null; estado: string } | null;
  _count: { cotizaciones: number };
}

interface Respuesta {
  solicitudes: Resumen[];
  total: number;
  pagina: number;
  limite: number;
}

interface RespuestaMaquinas {
  maquinas: {
    id_maquina: string;
    codigo: string | null;
    nombre: string;
    es_propia: boolean;
    cliente?: { razon_social: string } | null;
  }[];
}

const LIMITE = 10;
const CANCELABLES: EstadoSolicitud[] = ["RECIBIDA", "EN_DIAGNOSTICO", "COTIZADA", "ASIGNADA"];

function Etiqueta({ clase, texto }: { clase: string; texto: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs ${clase}`}>{texto}</span>;
}

function FormularioNueva({ alGuardar }: { alGuardar: () => void }) {
  const { datos: lista } = useConsulta<RespuestaMaquinas>("/maquinas?limite=100");
  const [v, setV] = useState({
    id_maquina: "",
    tipo_servicio: "CORRECTIVO" as TipoServicio,
    prioridad: "MEDIA" as Prioridad,
    descripcion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api("/solicitudes", {
        method: "POST",
        body: JSON.stringify({ ...v, descripcion: v.descripcion.trim() }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <Campo etiqueta="Máquina *">
        <select
          required
          value={v.id_maquina}
          onChange={(e) => setV({ ...v, id_maquina: e.target.value })}
          className={estiloInput}
        >
          <option value="">Selecciona una máquina</option>
          {lista?.maquinas.map((m) => (
            <option key={m.id_maquina} value={m.id_maquina}>
              {m.nombre}
              {m.codigo ? ` (${m.codigo})` : ""} — {m.es_propia ? "Propia de DyD" : (m.cliente?.razon_social ?? "")}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Tipo de servicio *">
        <select
          value={v.tipo_servicio}
          onChange={(e) => setV({ ...v, tipo_servicio: e.target.value as TipoServicio })}
          className={estiloInput}
        >
          {Object.entries(TIPOS_SERVICIO).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Prioridad">
        <select
          value={v.prioridad}
          onChange={(e) => setV({ ...v, prioridad: e.target.value as Prioridad })}
          className={estiloInput}
        >
          {Object.entries(PRIORIDADES).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Descripción del problema o servicio *">
        <textarea
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          value={v.descripcion}
          onChange={(e) => setV({ ...v, descripcion: e.target.value })}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Registrar solicitud"}
      </button>
    </form>
  );
}

function FormularioEditar({
  solicitud,
  alGuardar,
}: {
  solicitud: Detalle;
  alGuardar: () => void;
}) {
  const [descripcion, setDescripcion] = useState(solicitud.descripcion);
  const [prioridad, setPrioridad] = useState<Prioridad>(solicitud.prioridad);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api(`/solicitudes/${solicitud.id_solicitud}`, {
        method: "PATCH",
        body: JSON.stringify({ descripcion: descripcion.trim(), prioridad }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <Campo etiqueta="Prioridad">
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as Prioridad)}
          className={estiloInput}
        >
          {Object.entries(PRIORIDADES).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Descripción *">
        <textarea
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function VistaDetalle({
  id,
  esAdmin,
  alCambiar,
}: {
  id: string;
  esAdmin: boolean;
  alCambiar: () => void;
}) {
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const { datos, error, cargando } = useConsulta<{ solicitud: Detalle }>(`/solicitudes/${id}`, recarga);

  if (error) return <p className="text-red-700">{error}</p>;
  if (cargando || !datos) return <p className="text-slate-500">Cargando...</p>;

  const s = datos.solicitud;

  function refrescar() {
    setEditando(false);
    setRecarga((n) => n + 1);
    alCambiar();
  }

  async function cancelar() {
    if (!window.confirm("¿Cancelar esta solicitud? Esta acción no se puede deshacer.")) return;
    setErrorAccion(null);

    try {
      await api(`/solicitudes/${id}/cancelar`, { method: "POST" });
      refrescar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo cancelar");
    }
  }

  if (editando) return <FormularioEditar solicitud={s} alGuardar={refrescar} />;

  const fila = (nombre: string, valor: React.ReactNode) => (
    <div className="mb-2 flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-slate-500">{nombre}</span>
      <span className="text-slate-800">{valor}</span>
    </div>
  );

  return (
    <div>
      <p className="mb-3 text-xl font-bold text-slate-800">{s.codigo ?? "Sin código"}</p>
      {fila("Estado", <Etiqueta clase={COLORES_ESTADO[s.estado]} texto={ESTADOS_SOLICITUD[s.estado]} />)}
      {fila("Prioridad", <Etiqueta clase={COLORES_PRIORIDAD[s.prioridad]} texto={PRIORIDADES[s.prioridad]} />)}
      {fila("Tipo de servicio", TIPOS_SERVICIO[s.tipo_servicio])}
      {fila("Máquina", `${s.maquina.nombre}${s.maquina.codigo ? ` (${s.maquina.codigo})` : ""}`)}
      {fila("Cliente", s.cliente?.razon_social ?? "Propia de DyD")}
      {fila("Registrada por", `${s.usuario.nombres} ${s.usuario.apellidos}`)}
      {fila("Recibida", fechaHora(s.fecha_recepcion))}
      {fila("Descripción", <span className="whitespace-pre-wrap">{s.descripcion}</span>)}
      {fila(
        "Diagnóstico",
        s.diagnostico ? `Registrado · estado ${ESTADOS_GENERAL[s.diagnostico.estado_general]}` : "Pendiente",
      )}
      {fila("Cotizaciones", String(s._count.cotizaciones))}
      {fila("Orden de trabajo", s.orden_trabajo ? `${s.orden_trabajo.codigo ?? ""} · ${s.orden_trabajo.estado}` : "Sin orden")}

      <DiagnosticoSolicitud solicitud={s} alCambiar={refrescar} />
      {esAdmin && <CotizacionesSolicitud solicitud={s} alCambiar={refrescar} />}

      {errorAccion && <p className="mt-3 text-sm text-red-700">{errorAccion}</p>}

      {esAdmin && (
        <div className="mt-5 flex gap-2">
          {s.estado === "RECIBIDA" && (
            <button
              onClick={() => setEditando(true)}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Editar
            </button>
          )}
          {CANCELABLES.includes(s.estado) && (
            <button
              onClick={cancelar}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Cancelar solicitud
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Solicitudes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [nueva, setNueva] = useState(false);
  const [verId, setVerId] = useState<string | null>(null);

  const params = new URLSearchParams({ pagina: String(pagina), limite: String(LIMITE) });
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);
  if (prioridad) params.set("prioridad", prioridad);
  if (tipo) params.set("tipo_servicio", tipo);

  const { datos, error, cargando } = useConsulta<Respuesta>(`/solicitudes?${params}`, recarga);

  function buscar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPagina(1);
    setQ(texto.trim());
  }

  const filtro = (valor: string, cambiar: (v: string) => void, todos: string, opciones: Record<string, string>) => (
    <select
      value={valor}
      onChange={(e) => {
        setPagina(1);
        cambiar(e.target.value);
      }}
      className="rounded border border-slate-300 px-3 py-2"
    >
      <option value="">{todos}</option>
      {Object.entries(opciones).map(([v, nombre]) => (
        <option key={v} value={v}>
          {nombre}
        </option>
      ))}
    </select>
  );

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Solicitudes de servicio</h2>
        <button
          onClick={() => setNueva(true)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nueva solicitud
        </button>
      </div>

      <form onSubmit={buscar} className="mb-4 flex flex-wrap gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por código o descripción..."
          className={`${estiloInput} flex-1`}
        />
        {filtro(estado, setEstado, "Todos los estados", ESTADOS_SOLICITUD)}
        {filtro(prioridad, setPrioridad, "Toda prioridad", PRIORIDADES)}
        {filtro(tipo, setTipo, "Todo tipo", TIPOS_SERVICIO)}
        <button className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Buscar
        </button>
      </form>

      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}

      {datos && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Máquina</th>
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Prioridad</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Recibida</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {datos.solicitudes.map((s) => (
                  <tr key={s.id_solicitud} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{s.codigo ?? "—"}</td>
                    <td className="py-2 pr-4">{s.maquina.nombre}</td>
                    <td className="py-2 pr-4">{s.cliente?.razon_social ?? "Propia de DyD"}</td>
                    <td className="py-2 pr-4">{TIPOS_SERVICIO[s.tipo_servicio]}</td>
                    <td className="py-2 pr-4">
                      <Etiqueta clase={COLORES_PRIORIDAD[s.prioridad]} texto={PRIORIDADES[s.prioridad]} />
                    </td>
                    <td className="py-2 pr-4">
                      <Etiqueta clase={COLORES_ESTADO[s.estado]} texto={ESTADOS_SOLICITUD[s.estado]} />
                    </td>
                    <td className="py-2 pr-4">{new Date(s.fecha_recepcion).toLocaleDateString("es")}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => setVerId(s.id_solicitud)}
                        className="text-sm text-blue-700 hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
                {datos.solicitudes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No hay solicitudes que mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={datos.pagina} limite={datos.limite} total={datos.total} alCambiar={setPagina} />
        </>
      )}

      {nueva && (
        <Modal titulo="Nueva solicitud" alCerrar={() => setNueva(false)}>
          <FormularioNueva
            alGuardar={() => {
              setNueva(false);
              setPagina(1);
              setRecarga((n) => n + 1);
            }}
          />
        </Modal>
      )}

      {verId && (
        <Modal titulo="Detalle de la solicitud" alCerrar={() => setVerId(null)}>
          <VistaDetalle id={verId} esAdmin={esAdmin} alCambiar={() => setRecarga((n) => n + 1)} />
        </Modal>
      )}
    </div>
  );
}
