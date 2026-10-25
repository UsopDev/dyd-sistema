import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";
import Campo, { estiloInput } from "../components/Campo";

interface Cliente {
  id_cliente: string;
  razon_social: string;
  ruc_dni: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
}

interface Respuesta {
  clientes: Cliente[];
  total: number;
  pagina: number;
  limite: number;
}

const LIMITE = 10;

function Formulario({
  cliente,
  alGuardar,
}: {
  cliente: Cliente | null;
  alGuardar: () => void;
}) {
  const [v, setV] = useState({
    razon_social: cliente?.razon_social ?? "",
    ruc_dni: cliente?.ruc_dni ?? "",
    contacto: cliente?.contacto ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    direccion: cliente?.direccion ?? "",
    activo: cliente?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo = (k: "razon_social" | "ruc_dni" | "contacto" | "telefono" | "email" | "direccion") => ({
    value: v[k],
    onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }),
    className: estiloInput,
  });

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const vacio = (s: string) => (s.trim() === "" ? null : s.trim());
    const cuerpo = {
      razon_social: v.razon_social.trim(),
      ruc_dni: vacio(v.ruc_dni),
      contacto: vacio(v.contacto),
      telefono: vacio(v.telefono),
      email: vacio(v.email),
      direccion: vacio(v.direccion),
    };

    try {
      if (cliente) {
        await api(`/clientes/${cliente.id_cliente}`, {
          method: "PATCH",
          body: JSON.stringify({ ...cuerpo, activo: v.activo }),
        });
      } else {
        await api("/clientes", { method: "POST", body: JSON.stringify(cuerpo) });
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
      <Campo etiqueta="Razón social *">
        <input required maxLength={150} {...campo("razon_social")} />
      </Campo>
      <Campo etiqueta="RUC / DNI">
        <input maxLength={15} {...campo("ruc_dni")} />
      </Campo>
      <Campo etiqueta="Contacto">
        <input maxLength={100} {...campo("contacto")} />
      </Campo>
      <Campo etiqueta="Teléfono">
        <input maxLength={20} {...campo("telefono")} />
      </Campo>
      <Campo etiqueta="Correo electrónico">
        <input type="email" maxLength={120} {...campo("email")} />
      </Campo>
      <Campo etiqueta="Dirección">
        <input maxLength={200} {...campo("direccion")} />
      </Campo>

      {cliente && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={v.activo}
            onChange={(e) => setV({ ...v, activo: e.target.checked })}
          />
          Cliente activo
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

export default function Clientes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [editando, setEditando] = useState<Cliente | "nuevo" | null>(null);

  const params = new URLSearchParams({ pagina: String(pagina), limite: String(LIMITE) });
  if (q) params.set("q", q);

  const { datos, error, cargando } = useConsulta<Respuesta>(`/clientes?${params}`, recarga);

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
        <h2 className="text-xl font-bold text-slate-800">Clientes</h2>
        {esAdmin && (
          <button
            onClick={() => setEditando("nuevo")}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nuevo cliente
          </button>
        )}
      </div>

      <form onSubmit={buscar} className="mb-4 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por razón social, RUC/DNI..."
          className={estiloInput}
        />
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
                  <th className="py-2 pr-4">Razón social</th>
                  <th className="py-2 pr-4">RUC / DNI</th>
                  <th className="py-2 pr-4">Contacto</th>
                  <th className="py-2 pr-4">Teléfono</th>
                  <th className="py-2 pr-4">Estado</th>
                  {esAdmin && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {datos.clientes.map((c) => (
                  <tr key={c.id_cliente} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{c.razon_social}</td>
                    <td className="py-2 pr-4">{c.ruc_dni ?? "—"}</td>
                    <td className="py-2 pr-4">{c.contacto ?? "—"}</td>
                    <td className="py-2 pr-4">{c.telefono ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          c.activo ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {c.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setEditando(c)}
                          className="text-sm text-blue-700 hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {datos.clientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No hay clientes que mostrar
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
          titulo={editando === "nuevo" ? "Nuevo cliente" : "Editar cliente"}
          alCerrar={() => setEditando(null)}
        >
          <Formulario cliente={editando === "nuevo" ? null : editando} alGuardar={guardado} />
        </Modal>
      )}
    </div>
  );
}
