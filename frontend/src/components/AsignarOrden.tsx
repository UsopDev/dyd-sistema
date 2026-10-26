import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import Campo, { estiloInput } from "./Campo";
import type { EstadoSolicitud } from "../lib/etiquetas";

interface Usuario {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  rol: "ADMINISTRADOR" | "TECNICO";
  activo: boolean;
}

function Formulario({
  idSolicitud,
  alGuardar,
  alCancelar,
}: {
  idSolicitud: string;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const { datos } = useConsulta<{ usuarios: Usuario[] }>("/usuarios");
  const tecnicos = (datos?.usuarios ?? []).filter((u) => u.activo && u.rol === "TECNICO");
  const [idTecnico, setIdTecnico] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api("/ordenes", {
        method: "POST",
        body: JSON.stringify({
          id_solicitud: idSolicitud,
          id_tecnico: idTecnico,
          ...(monto !== "" ? { monto: Number(monto) } : {}),
        }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la orden");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <Campo etiqueta="Técnico *">
        <select
          required
          value={idTecnico}
          onChange={(e) => setIdTecnico(e.target.value)}
          className={estiloInput}
        >
          <option value="">Selecciona un técnico</option>
          {tecnicos.map((t) => (
            <option key={t.id_usuario} value={t.id_usuario}>
              {t.nombres} {t.apellidos}
            </option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Monto (opcional)">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Por defecto, el de la última cotización"
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
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Creando..." : "Crear orden"}
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

export default function AsignarOrden({
  solicitud,
  alCambiar,
}: {
  solicitud: {
    id_solicitud: string;
    estado: EstadoSolicitud;
    diagnostico: unknown;
    orden_trabajo: unknown;
  };
  alCambiar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  const puede =
    !solicitud.orden_trabajo &&
    solicitud.diagnostico &&
    (solicitud.estado === "EN_DIAGNOSTICO" || solicitud.estado === "COTIZADA");

  if (!puede) return null;

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="mb-3 font-bold text-slate-800">Orden de trabajo</h3>
      {abierto ? (
        <Formulario
          idSolicitud={solicitud.id_solicitud}
          alCancelar={() => setAbierto(false)}
          alGuardar={() => {
            setAbierto(false);
            alCambiar();
          }}
        />
      ) : (
        <button
          onClick={() => setAbierto(true)}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Asignar orden de trabajo
        </button>
      )}
    </section>
  );
}
