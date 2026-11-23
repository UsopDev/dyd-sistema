import { useState, type SyntheticEvent } from "react";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import { useAuth } from "../auth/useAuth";
import Modal from "../components/Modal";
import Campo, { estiloInput } from "../components/Campo";

type Rol = "ADMINISTRADOR" | "TECNICO";

interface Usuario {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

const ROLES: Record<Rol, string> = { ADMINISTRADOR: "Administrador", TECNICO: "Técnico" };

function Formulario({
  usuario,
  esYo,
  alGuardar,
}: {
  usuario: Usuario | null;
  esYo: boolean;
  alGuardar: () => void;
}) {
  const [v, setV] = useState({
    nombres: usuario?.nombres ?? "",
    apellidos: usuario?.apellidos ?? "",
    email: usuario?.email ?? "",
    password: "",
    rol: (usuario?.rol ?? "TECNICO") as Rol,
    activo: usuario?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      if (usuario) {
        await api(`/usuarios/${usuario.id_usuario}`, {
          method: "PATCH",
          body: JSON.stringify({
            nombres: v.nombres.trim(),
            apellidos: v.apellidos.trim(),
            rol: v.rol,
            activo: v.activo,
            ...(v.password !== "" ? { password: v.password } : {}),
          }),
        });
      } else {
        await api("/usuarios", {
          method: "POST",
          body: JSON.stringify({
            nombres: v.nombres.trim(),
            apellidos: v.apellidos.trim(),
            email: v.email.trim().toLowerCase(),
            password: v.password,
            rol: v.rol,
          }),
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
      <div className="flex gap-3">
        <div className="flex-1">
          <Campo etiqueta="Nombres *">
            <input
              required
              maxLength={80}
              value={v.nombres}
              onChange={(e) => setV({ ...v, nombres: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
        <div className="flex-1">
          <Campo etiqueta="Apellidos *">
            <input
              required
              maxLength={80}
              value={v.apellidos}
              onChange={(e) => setV({ ...v, apellidos: e.target.value })}
              className={estiloInput}
            />
          </Campo>
        </div>
      </div>

      <Campo etiqueta="Correo electrónico *">
        <input
          required
          type="email"
          maxLength={120}
          disabled={usuario !== null}
          value={v.email}
          onChange={(e) => setV({ ...v, email: e.target.value })}
          className={`${estiloInput} disabled:bg-slate-100 disabled:text-slate-500`}
        />
      </Campo>

      <Campo etiqueta="Rol *">
        <select
          value={v.rol}
          disabled={esYo}
          onChange={(e) => setV({ ...v, rol: e.target.value as Rol })}
          className={`${estiloInput} disabled:bg-slate-100 disabled:text-slate-500`}
        >
          {Object.entries(ROLES).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta={usuario ? "Nueva contraseña (déjala vacía para no cambiarla)" : "Contraseña * (mínimo 8)"}>
        <input
          required={usuario === null}
          type="password"
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          value={v.password}
          onChange={(e) => setV({ ...v, password: e.target.value })}
          className={estiloInput}
        />
      </Campo>

      {usuario && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            disabled={esYo}
            checked={v.activo}
            onChange={(e) => setV({ ...v, activo: e.target.checked })}
          />
          Usuario activo
          {esYo && <span className="text-xs text-slate-400">(no puedes desactivar tu propia cuenta)</span>}
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

function ListaUsuarios() {
  const { usuario: yo } = useAuth();
  const [recarga, setRecarga] = useState(0);
  const [verInactivos, setVerInactivos] = useState(false);
  const [rol, setRol] = useState("");
  const [activo, setActivo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [editando, setEditando] = useState<Usuario | "nuevo" | null>(null);

  const { datos, error, cargando } = useConsulta<{ usuarios: Usuario[] }>("/usuarios", {
    ...(rol && { rol }),
    ...(activo && { activo }),
    ...(fechaDesde && { creado_en_desde: fechaDesde }),
    ...(fechaHasta && { creado_en_hasta: fechaHasta }),
  }, recarga);

  const usuarios = (datos?.usuarios ?? []).filter((u) => verInactivos || u.activo);

  function refrescar() {
    setEditando(null);
    setRecarga((n) => n + 1);
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Usuarios del sistema</h2>
        <button
          onClick={() => setEditando("nuevo")}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Nuevo usuario
        </button>
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROLES).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
        <select
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
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
        {(rol || activo || fechaDesde || fechaHasta) && (
          <button
            type="button"
            onClick={() => {
              setRol("");
              setActivo("");
              setFechaDesde("");
              setFechaHasta("");
              setRecarga((n) => n + 1);
            }}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </form>

      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} />
        Mostrar usuarios inactivos
      </label>

      {error && <p className="text-red-700">{error}</p>}
      {cargando && <p className="text-slate-500">Cargando...</p>}

      {datos && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Creado</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id_usuario} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">
                    {u.nombres} {u.apellidos}
                  </td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        u.rol === "ADMINISTRADOR" ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {ROLES[u.rol]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        u.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{new Date(u.creado_en).toLocaleDateString("es")}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => setEditando(u)} className="text-sm text-blue-700 hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No hay usuarios que mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Modal titulo={editando === "nuevo" ? "Nuevo usuario" : "Editar usuario"} alCerrar={() => setEditando(null)}>
          <Formulario
            usuario={editando === "nuevo" ? null : editando}
            esYo={editando !== "nuevo" && editando.email === yo?.email}
            alGuardar={refrescar}
          />
        </Modal>
      )}
    </div>
  );
}

export default function Usuarios() {
  const { usuario } = useAuth();

  if (usuario?.rol !== "ADMINISTRADOR") {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-slate-600">Solo el administrador puede gestionar usuarios.</p>
      </div>
    );
  }

  return <ListaUsuarios />;
}
