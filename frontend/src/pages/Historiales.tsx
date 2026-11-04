import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { useConsulta } from "../lib/useConsulta";
import { ESTADOS_GENERAL, ESTADOS_ORDEN, type EstadoOrden } from "../lib/etiquetas";

type Tipo = "maquinas" | "clientes";

interface Orden {
  id_orden_trabajo: string;
  codigo: string | null;
  estado: EstadoOrden;
  trabajo_realizado: string | null;
  monto: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  solicitud: {
    codigo: string | null;
    tipo_servicio: "PREVENTIVO" | "CORRECTIVO";
    descripcion: string;
    maquina: { codigo: string | null; nombre: string };
  };
  tecnico: { nombres: string; apellidos: string };
  materiales: { cantidad: string; material: { nombre: string; unidad: string } }[];
}

interface DiagnosticoHist {
  id_diagnostico: string;
  fecha: string;
  estado_general: string;
  fallas_detectadas: string;
  solicitud: { codigo: string | null };
  tecnico: { nombres: string; apellidos: string };
}

interface Informe {
  maquina?: { nombre: string; codigo: string | null; marca: string | null; modelo: string | null; horas_uso: string };
  cliente?: { razon_social: string; ruc_dni: string | null; contacto: string | null };
  ordenes: Orden[];
  diagnosticos?: DiagnosticoHist[];
}

const fecha = (s: string | null) => (s ? new Date(s).toLocaleDateString("es-PE") : "—");
const generales = ESTADOS_GENERAL as Record<string, string>;

function InformeServicio({ tipo, id }: { tipo: Tipo; id: string }) {
  const { datos, error, cargando } = useConsulta<Informe>(`/reportes/${tipo}/${id}/historial`);

  if (cargando) return <p className="text-slate-500">Cargando...</p>;
  if (error || !datos) return <p className="text-red-600">No se pudo cargar el historial.</p>;

  const total = datos.ordenes.reduce((suma, o) => suma + Number(o.monto ?? 0), 0);

  return (
    <div id="informe" className="rounded-xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-slate-800">Informe de servicio · Historial de mantenimientos</h2>
      <p className="mt-1 text-sm text-slate-600">Emitido el {new Date().toLocaleDateString("es-PE")}</p>

      {datos.maquina && (
        <p className="mt-3 text-slate-800">
          <strong>Máquina:</strong> {datos.maquina.codigo ? `${datos.maquina.codigo} · ` : ""}
          {datos.maquina.nombre} {datos.maquina.marca ?? ""} {datos.maquina.modelo ?? ""} · Horas de uso:{" "}
          {Number(datos.maquina.horas_uso)}
        </p>
      )}
      {datos.cliente && (
        <p className="mt-3 text-slate-800">
          <strong>Cliente:</strong> {datos.cliente.razon_social}
          {datos.cliente.ruc_dni ? ` · ${datos.cliente.ruc_dni}` : ""}
        </p>
      )}

      <h3 className="mt-5 font-bold text-slate-800">Mantenimientos realizados</h3>
      {datos.ordenes.length === 0 ? (
        <p className="text-sm text-slate-500">No hay mantenimientos finalizados.</p>
      ) : (
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600">
              <th className="py-2 pr-2">Orden</th>
              <th className="pr-2">Tipo</th>
              {datos.cliente && <th className="pr-2">Máquina</th>}
              <th className="pr-2">Fecha fin</th>
              <th className="pr-2">Técnico</th>
              <th className="pr-2">Materiales usados</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {datos.ordenes.map((o) => (
              <tr key={o.id_orden_trabajo} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2">
                  {o.codigo ?? "—"}
                  <div className="text-xs text-slate-500">{ESTADOS_ORDEN[o.estado]}</div>
                </td>
                <td className="pr-2">{o.solicitud.tipo_servicio === "PREVENTIVO" ? "Preventivo" : "Correctivo"}</td>
                {datos.cliente && <td className="pr-2">{o.solicitud.maquina.nombre}</td>}
                <td className="pr-2">{fecha(o.fecha_fin)}</td>
                <td className="pr-2">
                  {o.tecnico.nombres} {o.tecnico.apellidos}
                </td>
                <td className="pr-2">
                  {o.materiales.length === 0
                    ? "—"
                    : o.materiales
                        .map((m) => `${m.material.nombre} (${Number(m.cantidad)} ${m.material.unidad})`)
                        .join(", ")}
                </td>
                <td className="text-right">{o.monto === null ? "—" : Number(o.monto).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={datos.cliente ? 6 : 5} className="pt-2 text-right font-bold">
                Total
              </td>
              <td className="pt-2 text-right font-bold">{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {datos.diagnosticos && (
        <>
          <h3 className="mt-5 font-bold text-slate-800">Historial de diagnósticos</h3>
          {datos.diagnosticos.length === 0 ? (
            <p className="text-sm text-slate-500">Esta máquina no tiene diagnósticos.</p>
          ) : (
            <ul className="mt-2 text-sm">
              {datos.diagnosticos.map((d) => (
                <li key={d.id_diagnostico} className="border-b border-slate-100 py-2">
                  <strong>{fecha(d.fecha)}</strong> · {d.solicitud.codigo ?? "—"} ·{" "}
                  {generales[d.estado_general] ?? d.estado_general} · {d.tecnico.nombres} {d.tecnico.apellidos}
                  <div className="text-slate-600">{d.fallas_detectadas}</div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function Historiales() {
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState<Tipo>("maquinas");
  const [id, setId] = useState("");

  const maquinas = useConsulta<{ maquinas: { id_maquina: string; codigo: string | null; nombre: string }[] }>(
    "/maquinas?limite=100",
  );
  const clientes = useConsulta<{ clientes: { id_cliente: string; razon_social: string }[] }>(
    "/clientes?limite=100",
  );

  const opciones =
    tipo === "maquinas"
      ? (maquinas.datos?.maquinas ?? []).map((m) => ({
          id: m.id_maquina,
          texto: `${m.codigo ? m.codigo + " · " : ""}${m.nombre}`,
        }))
      : (clientes.datos?.clientes ?? []).map((c) => ({ id: c.id_cliente, texto: c.razon_social }));

  if (usuario?.rol !== "ADMINISTRADOR") return <Navigate to="/" replace />;

  return (
    <div>
      <style>{`@media print {
        body * { visibility: hidden; }
        #informe, #informe * { visibility: visible; }
        #informe { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
      }`}</style>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-slate-800">Historiales e informes de servicio</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {(["maquinas", "clientes"] as Tipo[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipo(t);
                setId("");
              }}
              className={`rounded px-3 py-1 text-sm ${
                tipo === t ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700"
              }`}
            >
              {t === "maquinas" ? "Por máquina" : "Por cliente"}
            </button>
          ))}
          <select
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">Selecciona...</option>
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.texto}
              </option>
            ))}
          </select>
          {id && (
            <button onClick={() => window.print()} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">
              Imprimir informe de servicio
            </button>
          )}
        </div>
      </div>

      {id && (
        <div className="mt-4">
          <InformeServicio key={`${tipo}-${id}`} tipo={tipo} id={id} />
        </div>
      )}
    </div>
  );
}
