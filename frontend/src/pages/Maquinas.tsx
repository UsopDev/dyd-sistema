import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";
import Campo, { estiloInput } from "../components/Campo";

type EstadoMaquina = "OPERATIVA" | "EN_MANTENIMIENTO" | "FUERA_DE_SERVICIO";

const ESTADOS: Record<EstadoMaquina, string> = {
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de servicio",
};

const COLORES: Record<EstadoMaquina, string> = {
  OPERATIVA: "bg-green-100 text-green-800",
  EN_MANTENIMIENTO: "bg-amber-100 text-amber-800",
  FUERA_DE_SERVICIO: "bg-red-100 text-red-800",
};

interface Maquina {
  id_maquina: string;
  id_cliente: string | null;
  codigo: string | null;
  nombre: string;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  nro_serie: string | null;
  es_propia: boolean;
  horas_uso: string;
  estado: EstadoMaquina;
  cliente?: { id_cliente: string; razon_social: string } | null;
}

interface Respuesta {
  maquinas: Maquina[];
  total: number;
  pagina: number;
  limite: number;
}

interface RespuestaClientes {
  clientes: { id_cliente: string; razon_social: string }[];
}

const LIMITE = 10;

function Formulario({
  maquina,
  alGuardar,
}: {
  maquina: Maquina | null;
  alGuardar: () => void;
}) {
  const { datos: lista } = useConsulta<RespuestaClientes>("/clientes?activo=true&limite=100");
  const [v, setV] = useState({
    nombre: maquina?.nombre ?? "",
    codigo: maquina?.codigo ?? "",
    tipo: maquina?.tipo ?? "",
    marca: maquina?.marca ?? "",
    modelo: maquina?.modelo ?? "",
    nro_serie: maquina?.nro_serie ?? "",
    es_propia: maquina?.es_propia ?? false,
    id_cliente: maquina?.id_cliente ?? "",
    horas_uso: "0",
    estado: maquina?.estado ?? ("OPERATIVA" as EstadoMaquina),
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const texto = (k: "nombre" | "codigo" | "tipo" | "marca" | "modelo" | "nro_serie") => ({
    value: v[k],
    onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }),
    className: estiloInput,
  });

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!v.es_propia && !v.id_cliente) {
      setError("Elige el cliente dueño o marca la máquina como propia de DyD");
      return;
    }

    setEnviando(true);
    const vacio = (s: string) => (s.trim() === "" ? null : s.trim());
    const cuerpo = {
      nombre: v.nombre.trim(),
      codigo: vacio(v.codigo),
      tipo: vacio(v.tipo),
      marca: vacio(v.marca),
      modelo: vacio(v.modelo),
      nro_serie: vacio(v.nro_serie),
      es_propia: v.es_propia,
      id_cliente: v.es_propia ? null : v.id_cliente,
      estado: v.estado,
    };

    try {
      if (maquina) {
        await api(`/maquinas/${maquina.id_maquina}`, { method: "PATCH", body: JSON.stringify(cuerpo) });
      } else {
        await api("/maquinas", {
          method: "POST",
          body: JSON.stringify({ ...cuerpo, horas_uso: Number(v.horas_uso) || 0 }),
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
      <Campo etiqueta="Nombre *">
        <input required maxLength={100} {...texto("nombre")} />
      </Campo>
      <Campo etiqueta="Código">
        <input maxLength={30} {...texto("codigo")} />
      </Campo>

      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={v.es_propia}
          onChange={(e) => setV({ ...v, es_propia: e.target.checked })}
        />
        Máquina propia de DyD
      </label>

      {!v.es_propia && (
        <Campo etiqueta="Cliente *">
          <select
            value={v.id_cliente}
            onChange={(e) => setV({ ...v, id_cliente: e.target.value })}
            className={estiloInput}
          >
            <option value="">Selecciona un cliente</option>
            {lista?.clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.razon_social}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo etiqueta="Tipo">
        <input maxLength={50} {...texto("tipo")} />
      </Campo>
      <Campo etiqueta="Marca">
        <input maxLength={50} {...texto("marca")} />
      </Campo>
      <Campo etiqueta="Modelo">
        <input maxLength={50} {...texto("modelo")} />
      </Campo>
      <Campo etiqueta="Número de serie">
        <input maxLength={50} {...texto("nro_serie")} />
      </Campo>

      {!maquina && (
        <Campo etiqueta="Horas de uso iniciales">
          <input
            type="number"
            min={0}
            step="0.1"
            value={v.horas_uso}
            onChange={(e) => setV({ ...v, horas_uso: e.target.value })}
            className={estiloInput}
          />
        </Campo>
      )}

      <Campo etiqueta="Estado">
        <select
          value={v.estado}
          onChange={(e) => setV({ ...v, estado: e.target.value as EstadoMaquina })}
          className={estiloInput}
        >
          {Object.entries(ESTADOS).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>

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

export default function Maquinas() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState<Maquina | "nueva" | null>(null);

  const params = new URLSearchParams({ pagina: String(pagina), limite: String(LIMITE) });
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);

  const { datos, error, cargando } = useConsulta<Respuesta>(`/maquinas?${params}`, recarga);

  function buscar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPagina(1);
    setQ(texto.trim());
  }

  function guardado() {
    setEditando(null);
    setRecarga((n) => n + 1);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Maquinaria</h2>
        {esAdmin && (
          <button
            onClick={() => setEditando("nueva")}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nueva máquina
          </button>
        )}
      </div>

      <form onSubmit={buscar} className="mb-4 flex flex-wrap gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre, código, marca..."
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
          {Object.entries(ESTADOS).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
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
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Dueño</th>
                  <th className="py-2 pr-4">Marca / Modelo</th>
                  <th className="py-2 pr-4">Horas</th>
                  <th className="py-2 pr-4">Estado</th>
                  {esAdmin && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {datos.maquinas.map((m) => (
                  <tr key={m.id_maquina} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{m.codigo ?? "—"}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800">{m.nombre}</td>
                    <td className="py-2 pr-4">
                      {m.es_propia ? "Propia de DyD" : (m.cliente?.razon_social ?? "—")}
                    </td>
                    <td className="py-2 pr-4">
                      {[m.marca, m.modelo].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="py-2 pr-4">{m.horas_uso}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded px-2 py-0.5 text-xs ${COLORES[m.estado]}`}>
                        {ESTADOS[m.estado]}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setEditando(m)}
                          className="text-sm text-blue-700 hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {datos.maquinas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No hay máquinas que mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={datos.pagina} limite={datos.limite} total={datos.total} alCambiar={setPagina} />
        </>
      )}

      {editando && (
        <Modal
          titulo={editando === "nueva" ? "Nueva máquina" : "Editar máquina"}
          alCerrar={() => setEditando(null)}
        >
          <Formulario maquina={editando === "nueva" ? null : editando} alGuardar={guardado} />
        </Modal>
      )}
    </div>
  );
}
