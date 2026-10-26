import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Campo, { estiloInput } from "../components/Campo";
import Paginacion from "../components/Paginacion";
import {
  COLORES_MANT,
  ESTADOS_MANT,
  fechaHora,
  restante,
  type Programacion,
} from "../lib/etiquetas";

interface MaquinaOpcion {
  id_maquina: string;
  codigo: string | null;
  nombre: string;
  horas_uso: string;
}

interface Registro {
  id_registro_uso: string;
  horas: string;
  fecha: string;
  creado_en: string;
  maquina: { nombre: string };
  usuario: { nombres: string; apellidos: string };
}

const hoy = () => new Date().toLocaleDateString("en-CA");

function FormularioProgramacion({
  programacion,
  alGuardar,
}: {
  programacion: Programacion | null;
  alGuardar: () => void;
}) {
  const { datos: lista } = useConsulta<{ maquinas: MaquinaOpcion[] }>("/maquinas?limite=100");
  const [v, setV] = useState({
    id_maquina: programacion?.id_maquina ?? "",
    descripcion: programacion?.descripcion ?? "",
    frecuencia_horas: programacion?.frecuencia_horas?.toString() ?? "",
    frecuencia_dias: programacion?.frecuencia_dias?.toString() ?? "",
    dias_aviso: programacion?.dias_aviso.toString() ?? "7",
    horas_aviso: programacion ? String(Number(programacion.horas_aviso)) : "10",
    activo: programacion?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (v.frecuencia_horas === "" && v.frecuencia_dias === "") {
      setError("Indica la frecuencia en horas, en días o en ambas");
      return;
    }

    setEnviando(true);
    const cuerpo = {
      descripcion: v.descripcion.trim(),
      frecuencia_horas: v.frecuencia_horas === "" ? null : Number(v.frecuencia_horas),
      frecuencia_dias: v.frecuencia_dias === "" ? null : Number(v.frecuencia_dias),
      dias_aviso: Number(v.dias_aviso),
      horas_aviso: Number(v.horas_aviso),
    };

    try {
      if (programacion) {
        await api(`/preventivos/${programacion.id_programacion}`, {
          method: "PATCH",
          body: JSON.stringify({ ...cuerpo, activo: v.activo }),
        });
      } else {
        await api("/preventivos", {
          method: "POST",
          body: JSON.stringify({ ...cuerpo, id_maquina: v.id_maquina }),
        });
      }
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      {!programacion && (
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
                {m.codigo ? ` (${m.codigo})` : ""} · {Number(m.horas_uso)} h
              </option>
            ))}
          </select>
        </Campo>
      )}
      <Campo etiqueta="Descripción *">
        <input
          required
          minLength={3}
          maxLength={200}
          placeholder="Ej.: Cambio de aceite"
          value={v.descripcion}
          onChange={(e) => setV({ ...v, descripcion: e.target.value })}
          className={estiloInput}
        />
      </Campo>
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Cada (horas)">
            <input
              type="number"
              min="1"
              step="1"
              value={v.frecuencia_horas}
              onChange={(e) => setV({ ...v, frecuencia_horas: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Cada (días)">
            <input
              type="number"
              min="1"
              step="1"
              value={v.frecuencia_dias}
              onChange={(e) => setV({ ...v, frecuencia_dias: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Avisar con (horas)">
            <input
              type="number"
              min="0"
              step="0.1"
              value={v.horas_aviso}
              onChange={(e) => setV({ ...v, horas_aviso: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Avisar con (días)">
            <input
              type="number"
              min="0"
              step="1"
              value={v.dias_aviso}
              onChange={(e) => setV({ ...v, dias_aviso: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>

      {programacion && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={v.activo}
            onChange={(e) => setV({ ...v, activo: e.target.checked })}
          />
          Programación activa
        </label>
      )}

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}

function FormularioUso({ alGuardar }: { alGuardar: () => void }) {
  const { datos: lista } = useConsulta<{ maquinas: MaquinaOpcion[] }>("/maquinas?limite=100");
  const [idMaquina, setIdMaquina] = useState("");
  const [horas, setHoras] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api("/uso", {
        method: "POST",
        body: JSON.stringify({ id_maquina: idMaquina, horas: Number(horas), fecha }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <Campo etiqueta="Máquina *">
        <select
          required
          value={idMaquina}
          onChange={(e) => setIdMaquina(e.target.value)}
          className={estiloInput}
        >
          <option value="">Selecciona una máquina</option>
          {lista?.maquinas.map((m) => (
            <option key={m.id_maquina} value={m.id_maquina}>
              {m.nombre}
              {m.codigo ? ` (${m.codigo})` : ""} · {Number(m.horas_uso)} h acumuladas
            </option>
          ))}
        </select>
      </Campo>
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Horas trabajadas * (máx. 24, un decimal)">
            <input
              required
              type="number"
              min="0.1"
              max="24"
              step="0.1"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Fecha *">
            <input
              required
              type="date"
              max={hoy()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Registrando..." : "Registrar uso"}
      </button>
    </form>
  );
}

function HistorialUso({ recarga }: { recarga: number }) {
  const [pagina, setPagina] = useState(1);
  const { datos, error, cargando } = useConsulta<{
    registros: Registro[];
    total: number;
    pagina: number;
    limite: number;
  }>(`/uso?pagina=${pagina}&limite=5`, recarga);

  return (
    <div>
      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}
      {datos && (
        <>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Máquina</th>
                <th className="py-2 pr-4">Horas</th>
                <th className="py-2">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {datos.registros.map((r) => (
                <tr key={r.id_registro_uso} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{new Date(r.fecha).toLocaleDateString("es", { timeZone: "UTC" })}</td>
                  <td className="py-2 pr-4">{r.maquina.nombre}</td>
                  <td className="py-2 pr-4">{Number(r.horas)}</td>
                  <td className="py-2" title={fechaHora(r.creado_en)}>
                    {r.usuario.nombres} {r.usuario.apellidos}
                  </td>
                </tr>
              ))}
              {datos.registros.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    Todavía no hay registros de uso
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Paginacion pagina={datos.pagina} limite={datos.limite} total={datos.total} alCambiar={setPagina} />
        </>
      )}
    </div>
  );
}

export default function Preventivo() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [estado, setEstado] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState<Programacion | "nueva" | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const ruta = estado ? `/preventivos?estado=${estado}` : "/preventivos";
  const { datos, error, cargando } = useConsulta<{ preventivos: Programacion[]; total: number }>(ruta, recarga);

  function refrescar() {
    setEditando(null);
    setRegistrando(false);
    setRecarga((n) => n + 1);
  }

  async function generarSolicitud(p: Programacion) {
    if (!window.confirm(`¿Generar una solicitud preventiva para "${p.maquina.nombre}"?`)) return;
    setMensaje(null);
    setErrorAccion(null);

    try {
      const r = await api<{ solicitud: { codigo: string | null } }>("/solicitudes", {
        method: "POST",
        body: JSON.stringify({
          id_maquina: p.id_maquina,
          tipo_servicio: "PREVENTIVO",
          descripcion: `Mantenimiento preventivo: ${p.descripcion}`,
          id_programacion: p.id_programacion,
        }),
      });
      setMensaje(`Solicitud ${r.solicitud.codigo ?? ""} creada. Continúa su flujo en Solicitudes.`);
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo generar la solicitud");
    }
  }

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-800">Mantenimiento preventivo</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setRegistrando(true)}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Registrar uso
            </button>
            {esAdmin && (
              <button
                onClick={() => setEditando("nueva")}
                className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Nueva programación
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_MANT).map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        {mensaje && <p className="mb-3 text-sm text-green-700">{mensaje}</p>}
        {errorAccion && <p className="mb-3 text-sm text-red-700">{errorAccion}</p>}
        {error && <p className="text-red-700">{error}</p>}
        {cargando && <p className="text-slate-500">Cargando...</p>}

        {datos && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Máquina</th>
                  <th className="py-2 pr-4">Mantenimiento</th>
                  <th className="py-2 pr-4">Frecuencia</th>
                  <th className="py-2 pr-4">Restante</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {datos.preventivos.map((p) => (
                  <tr key={p.id_programacion} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{p.maquina.nombre}</td>
                    <td className="py-2 pr-4">
                      {p.descripcion}
                      {!p.activo && <span className="ml-2 text-xs text-slate-400">(inactiva)</span>}
                    </td>
                    <td className="py-2 pr-4">
                      {[
                        p.frecuencia_horas ? `${p.frecuencia_horas} h` : null,
                        p.frecuencia_dias ? `${p.frecuencia_dias} días` : null,
                      ]
                        .filter(Boolean)
                        .join(" o ")}
                    </td>
                    <td className="py-2 pr-4">{restante(p)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${COLORES_MANT[p.estado_mantenimiento.estado]}`}
                      >
                        {ESTADOS_MANT[p.estado_mantenimiento.estado]}
                      </span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {p.activo && (
                        <button
                          onClick={() => generarSolicitud(p)}
                          className="mr-3 text-sm text-blue-700 hover:underline"
                        >
                          Generar solicitud
                        </button>
                      )}
                      {esAdmin && (
                        <button
                          onClick={() => setEditando(p)}
                          className="text-sm text-blue-700 hover:underline"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {datos.preventivos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No hay programaciones que mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-white p-6 shadow">
        <h2 className="mb-3 text-xl font-bold text-slate-800">Historial de uso</h2>
        <HistorialUso recarga={recarga} />
      </div>

      {editando && (
        <Modal
          titulo={editando === "nueva" ? "Nueva programación" : "Editar programación"}
          alCerrar={() => setEditando(null)}
        >
          <FormularioProgramacion
            programacion={editando === "nueva" ? null : editando}
            alGuardar={refrescar}
          />
        </Modal>
      )}

      {registrando && (
        <Modal titulo="Registrar horas de uso" alCerrar={() => setRegistrando(false)}>
          <FormularioUso alGuardar={refrescar} />
        </Modal>
      )}
    </div>
  );
}
