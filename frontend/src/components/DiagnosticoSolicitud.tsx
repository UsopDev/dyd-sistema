import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Campo, { estiloInput } from "./Campo";
import { ESTADOS_GENERAL, fechaHora, type EstadoSolicitud } from "../lib/etiquetas";

type EstadoGeneral = keyof typeof ESTADOS_GENERAL;

interface Diagnostico {
  id_diagnostico: string;
  estado_general: EstadoGeneral;
  fallas_detectadas: string;
  observaciones: string | null;
  recomendaciones: string | null;
  fecha: string;
  tecnico: { id_usuario: string; nombres: string; apellidos: string };
  adjuntos: { id_adjunto: string; nombre_original: string; tipo_mime: string | null; tamano_bytes: number | null }[];
}

interface Props {
  solicitud: {
    id_solicitud: string;
    estado: EstadoSolicitud;
    diagnostico: { id_diagnostico: string } | null;
  };
  alCambiar: () => void;
}

function Formulario({
  idSolicitud,
  diagnostico,
  alGuardar,
  alCancelar,
}: {
  idSolicitud: string;
  diagnostico: Diagnostico | null;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const [v, setV] = useState({
    estado_general: diagnostico?.estado_general ?? ("REGULAR" as EstadoGeneral),
    fallas_detectadas: diagnostico?.fallas_detectadas ?? "",
    observaciones: diagnostico?.observaciones ?? "",
    recomendaciones: diagnostico?.recomendaciones ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const vacio = (s: string) => (s.trim() === "" ? null : s.trim());
    const cuerpo = {
      estado_general: v.estado_general,
      fallas_detectadas: v.fallas_detectadas.trim(),
      observaciones: vacio(v.observaciones),
      recomendaciones: vacio(v.recomendaciones),
    };

    try {
      if (diagnostico) {
        await api(`/diagnosticos/${diagnostico.id_diagnostico}`, {
          method: "PATCH",
          body: JSON.stringify(cuerpo),
        });
      } else {
        await api("/diagnosticos", {
          method: "POST",
          body: JSON.stringify({ id_solicitud: idSolicitud, ...cuerpo }),
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
      <Campo etiqueta="Estado general de la máquina *">
        <select
          value={v.estado_general}
          onChange={(e) => setV({ ...v, estado_general: e.target.value as EstadoGeneral })}
          className={estiloInput}
        >
          {Object.entries(ESTADOS_GENERAL).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Fallas detectadas *">
        <textarea
          required
          minLength={3}
          maxLength={5000}
          rows={3}
          value={v.fallas_detectadas}
          onChange={(e) => setV({ ...v, fallas_detectadas: e.target.value })}
          className={estiloInput}
        />
      </Campo>
      <Campo etiqueta="Observaciones">
        <textarea
          maxLength={5000}
          rows={2}
          value={v.observaciones}
          onChange={(e) => setV({ ...v, observaciones: e.target.value })}
          className={estiloInput}
        />
      </Campo>
      <Campo etiqueta="Recomendaciones">
        <textarea
          maxLength={5000}
          rows={2}
          value={v.recomendaciones}
          onChange={(e) => setV({ ...v, recomendaciones: e.target.value })}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar diagnóstico"}
        </button>
        <button
          type="button"
          onClick={alCancelar}
          className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function Adjuntos({
  idDiagnostico,
  adjuntos,
  puedeSubir,
  alSubir,
}: {
  idDiagnostico: string;
  adjuntos: Diagnostico["adjuntos"];
  puedeSubir: boolean;
  alSubir: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function subir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setError(null);
    setSubiendo(true);

    try {
      const form = new FormData();
      form.append("archivo", archivo);

      const r = await fetch(`${API_BASE}/diagnosticos/${idDiagnostico}/adjuntos`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? "No se pudo subir el archivo");
      }

      alSubir();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="mt-3 text-sm">
      <p className="mb-1 text-slate-500">Fotografías y documentos de respaldo</p>
      {adjuntos.length === 0 && <p className="text-slate-500">Sin archivos adjuntos.</p>}
      <ul>
        {adjuntos.map((a) => (
          <li key={a.id_adjunto} className="mb-1">
            <a
              href={`${API_BASE}/diagnosticos/${idDiagnostico}/adjuntos/${a.id_adjunto}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:underline"
            >
              {a.nombre_original}
            </a>{" "}
            <span className="text-slate-500">({Math.max(1, Math.round((a.tamano_bytes ?? 0) / 1024))} KB)</span>
          </li>
        ))}
      </ul>
      {puedeSubir && (
        <label className="mt-2 inline-block cursor-pointer rounded border border-slate-300 px-3 py-1 hover:bg-slate-50">
          {subiendo ? "Subiendo..." : "Adjuntar archivo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={subiendo}
            onChange={subir}
            className="hidden"
          />
        </label>
      )}
      <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP o PDF, hasta 5 MB.</p>
      {error && <p className="mt-1 text-red-700">{error}</p>}
    </div>
  );
}

function VerDiagnostico({
  id,
  estadoSolicitud,
  alCambiar,
}: {
  id: string;
  estadoSolicitud: EstadoSolicitud;
  alCambiar: () => void;
}) {
  const { usuario } = useAuth();
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState(false);
  const { datos, error, cargando } = useConsulta<{ diagnostico: Diagnostico }>(
    `/diagnosticos/${id}`,
    {},
    recarga,
  );

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (cargando || !datos) return <p className="text-sm text-slate-500">Cargando...</p>;

  const d = datos.diagnostico;
  const puedeEditar =
    estadoSolicitud === "EN_DIAGNOSTICO" &&
    (usuario?.rol === "ADMINISTRADOR" || usuario?.id_usuario === d.tecnico.id_usuario);

  if (editando) {
    return (
      <Formulario
        idSolicitud=""
        diagnostico={d}
        alCancelar={() => setEditando(false)}
        alGuardar={() => {
          setEditando(false);
          setRecarga((n) => n + 1);
          alCambiar();
        }}
      />
    );
  }

  const fila = (nombre: string, valor: string | null) => (
    <div className="mb-2 flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-slate-500">{nombre}</span>
      <span className="whitespace-pre-wrap text-slate-800">{valor || "—"}</span>
    </div>
  );

  return (
    <div>
      {fila("Estado general", ESTADOS_GENERAL[d.estado_general])}
      {fila("Fallas detectadas", d.fallas_detectadas)}
      {fila("Observaciones", d.observaciones)}
      {fila("Recomendaciones", d.recomendaciones)}
      {fila("Técnico", `${d.tecnico.nombres} ${d.tecnico.apellidos}`)}
      {fila("Fecha", fechaHora(d.fecha))}
      <Adjuntos
        idDiagnostico={d.id_diagnostico}
        adjuntos={d.adjuntos ?? []}
        puedeSubir={puedeEditar}
        alSubir={() => setRecarga((n) => n + 1)}
      />
      {puedeEditar && (
        <button
          onClick={() => setEditando(true)}
          className="mt-2 rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Editar diagnóstico
        </button>
      )}
    </div>
  );
}

export default function DiagnosticoSolicitud({ solicitud, alCambiar }: Props) {
  const [creando, setCreando] = useState(false);

  let contenido;

  if (solicitud.diagnostico) {
    contenido = (
      <VerDiagnostico
        id={solicitud.diagnostico.id_diagnostico}
        estadoSolicitud={solicitud.estado}
        alCambiar={alCambiar}
      />
    );
  } else if (creando) {
    contenido = (
      <Formulario
        idSolicitud={solicitud.id_solicitud}
        diagnostico={null}
        alCancelar={() => setCreando(false)}
        alGuardar={() => {
          setCreando(false);
          alCambiar();
        }}
      />
    );
  } else if (solicitud.estado === "RECIBIDA") {
    contenido = (
      <button
        onClick={() => setCreando(true)}
        className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Registrar diagnóstico
      </button>
    );
  } else {
    contenido = <p className="text-sm text-slate-500">Esta solicitud no tiene diagnóstico.</p>;
  }

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="mb-3 font-bold text-slate-800">Diagnóstico</h3>
      {contenido}
    </section>
  );
}
