import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Campo, { estiloInput } from "../components/Campo";
import Paginacion from "../components/Paginacion";
import { fechaHora } from "../lib/etiquetas";

interface Material {
  id_material: string;
  codigo: string | null;
  nombre: string;
  unidad: string;
  stock_actual: string;
  stock_minimo: string;
  precio_unitario: string | null;
  activo: boolean;
}

interface Movimiento {
  id_movimiento: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: string;
  motivo: string | null;
  fecha: string;
  usuario: { nombres: string; apellidos: string };
}

interface Respuesta {
  materiales: Material[];
  total: number;
  pagina: number;
  limite: number;
}

const LIMITE = 10;

const dinero = (n: number | string) => Number(n).toFixed(2);

// Misma regla que usa el servidor para la alerta de stock bajo.
const esBajo = (m: Material) =>
  m.activo && Number(m.stock_minimo) > 0 && Number(m.stock_actual) <= Number(m.stock_minimo);

function FormularioMaterial({
  material,
  alGuardar,
}: {
  material: Material | null;
  alGuardar: () => void;
}) {
  const [v, setV] = useState({
    codigo: material?.codigo ?? "",
    nombre: material?.nombre ?? "",
    unidad: material?.unidad ?? "",
    stock_minimo: material ? String(Number(material.stock_minimo)) : "0",
    precio_unitario: material?.precio_unitario != null ? String(Number(material.precio_unitario)) : "",
    activo: material?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const cuerpo = {
      codigo: v.codigo.trim() === "" ? null : v.codigo.trim(),
      nombre: v.nombre.trim(),
      unidad: v.unidad.trim(),
      stock_minimo: Number(v.stock_minimo),
      precio_unitario: v.precio_unitario === "" ? null : Number(v.precio_unitario),
    };

    try {
      if (material) {
        await api(`/materiales/${material.id_material}`, {
          method: "PATCH",
          body: JSON.stringify({ ...cuerpo, activo: v.activo }),
        });
      } else {
        await api("/materiales", { method: "POST", body: JSON.stringify(cuerpo) });
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
        <input
          required
          maxLength={100}
          value={v.nombre}
          onChange={(e) => setV({ ...v, nombre: e.target.value })}
          className={estiloInput}
        />
      </Campo>
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Código">
            <input
              maxLength={30}
              placeholder="Ej.: MAT-011"
              value={v.codigo}
              onChange={(e) => setV({ ...v, codigo: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Unidad *">
            <input
              required
              maxLength={20}
              placeholder="kg, unid, gal..."
              value={v.unidad}
              onChange={(e) => setV({ ...v, unidad: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Stock mínimo">
            <input
              type="number"
              min="0"
              step="0.01"
              value={v.stock_minimo}
              onChange={(e) => setV({ ...v, stock_minimo: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Precio unitario (opcional)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={v.precio_unitario}
              onChange={(e) => setV({ ...v, precio_unitario: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>

      {!material && (
        <p className="mb-3 text-sm text-slate-500">
          El stock inicial se registra después con un movimiento de entrada.
        </p>
      )}

      {material && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={v.activo}
            onChange={(e) => setV({ ...v, activo: e.target.checked })}
          />
          Material activo
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

function FormularioMovimiento({
  material,
  alGuardar,
}: {
  material: Material;
  alGuardar: () => void;
}) {
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await api(`/materiales/${material.id_material}/movimientos`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          cantidad: Number(cantidad),
          ...(motivo.trim() !== "" ? { motivo: motivo.trim() } : {}),
        }),
      });
      alGuardar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar}>
      <p className="mb-3 text-sm text-slate-600">
        <strong>{material.nombre}</strong> · stock actual: {Number(material.stock_actual)} {material.unidad}
      </p>
      <Campo etiqueta="Tipo de movimiento *">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "ENTRADA" | "SALIDA")}
          className={estiloInput}
        >
          <option value="ENTRADA">Entrada (compra o reposición)</option>
          <option value="SALIDA">Salida (consumo o ajuste)</option>
        </select>
      </Campo>
      <Campo etiqueta={`Cantidad * (${material.unidad})`}>
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
      <Campo etiqueta="Motivo">
        <input
          maxLength={150}
          placeholder="Ej.: Compra a proveedor"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Registrando..." : "Registrar movimiento"}
      </button>
    </form>
  );
}

function HistorialMovimientos({ material }: { material: Material }) {
  const [pagina, setPagina] = useState(1);
  const { datos, error, cargando } = useConsulta<{
    movimientos: Movimiento[];
    total: number;
    pagina: number;
    limite: number;
  }>(`/materiales/${material.id_material}/movimientos?pagina=${pagina}&limite=8`);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        <strong>{material.nombre}</strong> · stock actual: {Number(material.stock_actual)} {material.unidad}
      </p>
      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}
      {datos && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Cantidad</th>
                  <th className="py-2 pr-3">Motivo</th>
                  <th className="py-2">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {datos.movimientos.map((m) => (
                  <tr key={m.id_movimiento} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{fechaHora(m.fecha)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          m.tipo === "ENTRADA" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {m.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{Number(m.cantidad)}</td>
                    <td className="py-2 pr-3">{m.motivo ?? "—"}</td>
                    <td className="py-2">
                      {m.usuario.nombres} {m.usuario.apellidos}
                    </td>
                  </tr>
                ))}
                {datos.movimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      Todavía no hay movimientos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={datos.pagina} limite={datos.limite} total={datos.total} alCambiar={setPagina} />
        </>
      )}
    </div>
  );
}

export default function Materiales() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState<Material | "nuevo" | null>(null);
  const [moviendo, setMoviendo] = useState<Material | null>(null);
  const [viendo, setViendo] = useState<Material | null>(null);

  const params = new URLSearchParams({ pagina: String(pagina), limite: String(LIMITE) });
  if (q) params.set("q", q);
  if (activo) params.set("activo", activo);

  const { datos, error, cargando } = useConsulta<Respuesta>(`/materiales?${params}`, recarga);
  const { datos: bajos } = useConsulta<{ materiales: { id_material: string; nombre: string }[]; total: number }>(
    "/materiales/stock-bajo",
    recarga,
  );

  function buscar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPagina(1);
    setQ(texto.trim());
  }

  function refrescar() {
    setEditando(null);
    setMoviendo(null);
    setRecarga((n) => n + 1);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Inventario de materiales</h2>
        {esAdmin && (
          <button
            onClick={() => setEditando("nuevo")}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nuevo material
          </button>
        )}
      </div>

      {bajos && bajos.total > 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Stock bajo ({bajos.total}):</strong> {bajos.materiales.map((m) => m.nombre).join(", ")}
        </div>
      )}

      <form onSubmit={buscar} className="mb-4 flex flex-wrap gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className={`${estiloInput} flex-1`}
        />
        <select
          value={activo}
          onChange={(e) => {
            setPagina(1);
            setActivo(e.target.value);
          }}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Buscar</button>
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
                  <th className="py-2 pr-4">Material</th>
                  <th className="py-2 pr-4">Unidad</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4">Mínimo</th>
                  <th className="py-2 pr-4">Precio</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {datos.materiales.map((m) => (
                  <tr key={m.id_material} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{m.codigo ?? "—"}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800">{m.nombre}</td>
                    <td className="py-2 pr-4">{m.unidad}</td>
                    <td className="py-2 pr-4">{Number(m.stock_actual)}</td>
                    <td className="py-2 pr-4">{Number(m.stock_minimo)}</td>
                    <td className="py-2 pr-4">{m.precio_unitario !== null ? dinero(m.precio_unitario) : "—"}</td>
                    <td className="py-2 pr-4">
                      {!m.activo ? (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">Inactivo</span>
                      ) : esBajo(m) ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">Stock bajo</span>
                      ) : (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Normal</span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {esAdmin && m.activo && (
                        <button
                          onClick={() => setMoviendo(m)}
                          className="mr-3 text-sm text-blue-700 hover:underline"
                        >
                          Movimiento
                        </button>
                      )}
                      <button onClick={() => setViendo(m)} className="mr-3 text-sm text-blue-700 hover:underline">
                        Historial
                      </button>
                      {esAdmin && (
                        <button onClick={() => setEditando(m)} className="text-sm text-blue-700 hover:underline">
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {datos.materiales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No hay materiales que mostrar
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
        <Modal titulo={editando === "nuevo" ? "Nuevo material" : "Editar material"} alCerrar={() => setEditando(null)}>
          <FormularioMaterial material={editando === "nuevo" ? null : editando} alGuardar={refrescar} />
        </Modal>
      )}

      {moviendo && (
        <Modal titulo="Registrar movimiento" alCerrar={() => setMoviendo(null)}>
          <FormularioMovimiento material={moviendo} alGuardar={refrescar} />
        </Modal>
      )}

      {viendo && (
        <Modal titulo="Historial de movimientos" alCerrar={() => setViendo(null)}>
          <HistorialMovimientos material={viendo} />
        </Modal>
      )}
    </div>
  );
}