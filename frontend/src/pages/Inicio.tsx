import { useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { useConsulta } from "../lib/useConsulta";
import AlertasPreventivo from "../components/AlertasPreventivo";
import {
  COLORES_ESTADO,
  COLORES_ORDEN,
  ESTADOS_ORDEN,
  ESTADOS_SOLICITUD,
  type EstadoOrden,
  type EstadoSolicitud,
} from "../lib/etiquetas";

const SOLICITUDES: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_DIAGNOSTICO",
  "COTIZADA",
  "ASIGNADA",
  "EN_PROCESO",
  "FINALIZADA",
];

const ORDENES: EstadoOrden[] = ["PENDIENTE", "EN_PROCESO", "FINALIZADA"];

interface MaterialBajo {
  id_material: string;
  nombre: string;
  unidad: string;
  stock_actual: unknown;
  stock_minimo: unknown;
}

function Contador({
  ruta,
  etiqueta,
  clase,
  destino,
}: {
  ruta: string;
  etiqueta: string;
  clase: string;
  destino: string;
}) {
  const { datos, error } = useConsulta<{ total: number }>(ruta);

  return (
    <Link to={destino} className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
      <span className={`rounded px-2 py-0.5 text-xs ${clase}`}>{etiqueta}</span>
      <p className="mt-2 text-3xl font-bold text-slate-800">{error ? "—" : datos ? datos.total : "…"}</p>
    </Link>
  );
}

function StockBajo() {
  const { datos, error } = useConsulta<{ materiales: MaterialBajo[]; total: number }>("/materiales/stock-bajo");

  if (error) return null;

  return (
    <div className="mt-4 rounded-xl bg-white p-6 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Materiales con stock bajo</h2>
        <Link to="/materiales" className="text-sm text-blue-700 hover:underline">
          Ver inventario
        </Link>
      </div>

      {!datos && <p className="text-slate-500">Cargando...</p>}

      {datos && datos.total === 0 && (
        <p className="text-sm text-green-700">Todos los materiales están por encima de su stock mínimo.</p>
      )}

      {datos && datos.total > 0 && (
        <ul className="text-sm">
          {datos.materiales.map((m) => (
            <li key={m.id_material} className="flex justify-between border-b border-slate-100 py-2">
              <span className="font-medium text-slate-800">{m.nombre}</span>
              <span className="text-slate-600">
                Stock {Number(m.stock_actual)} {m.unidad} · mínimo {Number(m.stock_minimo)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EnviarAlertas() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    setMensaje(null);
    try {
      const r = (await api("/alertas-correo/enviar?forzar=true", { method: "POST" })) as {
        enviadas: number;
        fallidas: number;
        revisadas: number;
      };
      setMensaje(`Revisadas: ${r.revisadas} · Enviadas: ${r.enviadas} · Fallidas: ${r.fallidas}`);
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl bg-white p-6 shadow">
      <button
        onClick={enviar}
        disabled={enviando}
        className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar alertas por correo ahora"}
      </button>
      {mensaje && <p className="mt-2 text-sm text-slate-700">{mensaje}</p>}
    </div>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-slate-800">Panel principal</h2>
        <p className="mt-2 text-slate-600">
          Bienvenido, <strong>{usuario?.nombres ?? usuario?.email}</strong>.{" "}
          {esAdmin ? "Resumen general del taller." : "Resumen de tu trabajo y del taller."}
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-white p-6 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Solicitudes por estado</h2>
          <Link to="/solicitudes" className="text-sm text-blue-700 hover:underline">
            Ver solicitudes
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {SOLICITUDES.map((estado) => (
            <Contador
              key={estado}
              ruta={`/solicitudes?estado=${estado}&limite=1`}
              etiqueta={ESTADOS_SOLICITUD[estado]}
              clase={COLORES_ESTADO[estado]}
              destino="/solicitudes"
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white p-6 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {esAdmin ? "Órdenes de trabajo" : "Mis órdenes de trabajo"}
          </h2>
          <Link to="/ordenes" className="text-sm text-blue-700 hover:underline">
            Ver órdenes
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ORDENES.map((estado) => (
            <Contador
              key={estado}
              ruta={`/ordenes?estado=${estado}&limite=1`}
              etiqueta={ESTADOS_ORDEN[estado]}
              clase={COLORES_ORDEN[estado]}
              destino="/ordenes"
            />
          ))}
        </div>
      </div>

      <StockBajo />
      {esAdmin && <EnviarAlertas />}
      <AlertasPreventivo />
    </div>
  );
}
