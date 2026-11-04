import { useEffect, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { api } from "../lib/api";
import { useConsulta } from "../lib/useConsulta";
import Campo, { estiloInput } from "./Campo";
import { fechaHora, type EstadoSolicitud } from "../lib/etiquetas";

interface Material {
  id_material: string;
  codigo: string | null;
  nombre: string;
  unidad: string;
  stock_actual: string;
  precio_unitario: string | null;
  activo: boolean;
}

interface Resumen {
  id_cotizacion: string;
  codigo: string | null;
  total: string;
  fecha: string;
}

interface Linea {
  tipo: "SERVICIO" | "MATERIAL";
  descripcion: string;
  id_material: string;
  cantidad: string;
  precio: string;
}

interface DetalleCot extends Resumen {
  observaciones: string | null;
  usuario: { nombres: string; apellidos: string };
  detalles: {
    id_detalle: string;
    tipo: "SERVICIO" | "MATERIAL";
    descripcion: string;
    cantidad: string;
    precio_unitario: string;
    subtotal: string;
  }[];
}

const dinero = (n: number | string) => Number(n).toFixed(2);

const EMPRESA = {
  nombre: "Soldaduras Especiales y Rectificaciones DYD E.I.R.L.",
  ruc: "RUC 20505403089",
  direccion: "Urbanización Faucet, Mz. M, Lote 1A",
  telefono: "Tel. +51 978 719 848",
  correo: "Soldadurasespecialesyrectificacioneseirl@hotmail.com",
};

interface Contexto {
  codigoSolicitud?: string | null;
  cliente?: { razon_social: string } | null;
  maquina?: { nombre: string; codigo?: string | null } | null;
}
const lineaVacia = (): Linea => ({
  tipo: "SERVICIO",
  descripcion: "",
  id_material: "",
  cantidad: "1",
  precio: "",
});

function Formulario({
  idSolicitud,
  alGuardar,
  alCancelar,
}: {
  idSolicitud: string;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const { datos: lista } = useConsulta<{ materiales: Material[] }>("/materiales?limite=100");
  const materiales = (lista?.materiales ?? []).filter((m) => m.activo);

  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiar(i: number, cambios: Partial<Linea>) {
    setLineas(lineas.map((l, n) => (n === i ? { ...l, ...cambios } : l)));
  }

  function precioDe(l: Linea): number {
    if (l.precio !== "") return Number(l.precio);
    if (l.tipo === "MATERIAL") {
      const m = materiales.find((x) => x.id_material === l.id_material);
      return m?.precio_unitario != null ? Number(m.precio_unitario) : 0;
    }
    return 0;
  }

  // Solo referencia visual: el total oficial lo calcula el servidor.
  const estimado = lineas.reduce(
    (suma, l) => suma + Math.round(Number(l.cantidad || 0) * precioDe(l) * 100) / 100,
    0,
  );

  async function enviar(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const detalles = lineas.map((l) =>
      l.tipo === "SERVICIO"
        ? {
            tipo: "SERVICIO",
            descripcion: l.descripcion.trim(),
            cantidad: Number(l.cantidad),
            precio_unitario: Number(l.precio),
          }
        : {
            tipo: "MATERIAL",
            id_material: l.id_material,
            cantidad: Number(l.cantidad),
            ...(l.precio !== "" ? { precio_unitario: Number(l.precio) } : {}),
          },
    );

    try {
      await api("/cotizaciones", {
        method: "POST",
        body: JSON.stringify({
          id_solicitud: idSolicitud,
          observaciones: observaciones.trim() === "" ? null : observaciones.trim(),
          detalles,
        }),
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
      {lineas.map((l, i) => (
        <div key={i} className="mb-3 rounded border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <select
              value={l.tipo}
              onChange={(e) =>
                cambiar(i, { tipo: e.target.value as Linea["tipo"], id_material: "", precio: "" })
              }
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="SERVICIO">Servicio</option>
              <option value="MATERIAL">Material</option>
            </select>
            {lineas.length > 1 && (
              <button
                type="button"
                onClick={() => setLineas(lineas.filter((_, n) => n !== i))}
                className="text-sm text-red-700 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>

          {l.tipo === "SERVICIO" ? (
            <Campo etiqueta="Descripción *">
              <input
                required
                maxLength={200}
                value={l.descripcion}
                onChange={(e) => cambiar(i, { descripcion: e.target.value })}
                className={estiloInput}
              />
            </Campo>
          ) : (
            <Campo etiqueta="Material *">
              <select
                required
                value={l.id_material}
                onChange={(e) => cambiar(i, { id_material: e.target.value })}
                className={estiloInput}
              >
                <option value="">Selecciona un material</option>
                {materiales.map((m) => (
                  <option key={m.id_material} value={m.id_material}>
                    {m.nombre} ({m.unidad}) · stock {Number(m.stock_actual)}
                    {m.precio_unitario !== null ? ` · ${dinero(m.precio_unitario)}` : " · sin precio"}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <Campo etiqueta="Cantidad *">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={l.cantidad}
                  onChange={(e) => cambiar(i, { cantidad: e.target.value })}
                  className={estiloInput}
                />
              </Campo>
            </div>
            <div className="flex-1">
              <Campo etiqueta={l.tipo === "SERVICIO" ? "Precio unitario *" : "Precio (opcional)"}>
                <input
                  required={l.tipo === "SERVICIO"}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={l.tipo === "MATERIAL" ? "Del inventario" : ""}
                  value={l.precio}
                  onChange={(e) => cambiar(i, { precio: e.target.value })}
                  className={estiloInput}
                />
              </Campo>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setLineas([...lineas, lineaVacia()])}
        className="mb-3 text-sm text-blue-700 hover:underline"
      >
        + Agregar línea
      </button>

      <Campo etiqueta="Observaciones">
        <textarea
          rows={2}
          maxLength={2000}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className={estiloInput}
        />
      </Campo>

      <p className="mb-3 text-sm text-slate-600">
        Total estimado: <strong>{dinero(estimado)}</strong> (el servidor calcula el total oficial)
      </p>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Registrar cotización"}
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

function VerCotizacion({ id, contexto }: { id: string; contexto: Contexto }) {
  const { datos, error, cargando } = useConsulta<{ cotizacion: DetalleCot }>(`/cotizaciones/${id}`);
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    if (!imprimiendo) return;
    window.print();
    setImprimiendo(false);
  }, [imprimiendo]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (cargando || !datos) return <p className="text-sm text-slate-500">Cargando...</p>;

  const c = datos.cotizacion;

  return (
    <div className="mt-2 rounded bg-slate-50 p-3 text-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 pr-3">Tipo</th>
              <th className="py-1 pr-3">Descripción</th>
              <th className="py-1 pr-3">Cant.</th>
              <th className="py-1 pr-3">Precio</th>
              <th className="py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {c.detalles.map((d) => (
              <tr key={d.id_detalle} className="border-t border-slate-200">
                <td className="py-1 pr-3">{d.tipo === "SERVICIO" ? "Servicio" : "Material"}</td>
                <td className="py-1 pr-3">{d.descripcion}</td>
                <td className="py-1 pr-3">{Number(d.cantidad)}</td>
                <td className="py-1 pr-3">{dinero(d.precio_unitario)}</td>
                <td className="py-1">{dinero(d.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-bold text-slate-800">Total: {dinero(c.total)}</p>
      {c.observaciones && <p className="mt-1 text-slate-600">Observaciones: {c.observaciones}</p>}
      <p className="mt-1 text-slate-500">
        Por {c.usuario.nombres} {c.usuario.apellidos} · {fechaHora(c.fecha)}
      </p>
      <button
        onClick={() => setImprimiendo(true)}
        className="mt-3 rounded bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700"
      >
        Imprimir cotización
      </button>

      {imprimiendo &&
        createPortal(
          <div id="cotizacion-impresion">
            <style>{`
              #cotizacion-impresion { display: none; }
              @media print {
                #root { display: none !important; }
                #cotizacion-impresion { display: block; padding: 24px; color: #000; font-family: sans-serif; }
              }
            `}</style>

            <div style={{ borderBottom: "2px solid #000", paddingBottom: 8, marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{EMPRESA.nombre}</h1>
              <p style={{ fontSize: 12 }}>
                {EMPRESA.ruc} · {EMPRESA.direccion} · {EMPRESA.telefono} · {EMPRESA.correo}
              </p>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700 }}>COTIZACIÓN {c.codigo ?? ""}</h2>
            <p style={{ fontSize: 13, marginTop: 4 }}>Fecha: {fechaHora(c.fecha)}</p>
            {contexto.codigoSolicitud && (
              <p style={{ fontSize: 13 }}>Solicitud: {contexto.codigoSolicitud}</p>
            )}
            {contexto.cliente && <p style={{ fontSize: 13 }}>Cliente: {contexto.cliente.razon_social}</p>}
            {contexto.maquina && (
              <p style={{ fontSize: 13 }}>
                Máquina: {contexto.maquina.codigo ? `${contexto.maquina.codigo} · ` : ""}
                {contexto.maquina.nombre}
              </p>
            )}

            <table style={{ width: "100%", marginTop: 16, fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000", textAlign: "left" }}>
                  <th style={{ padding: "6px 4px" }}>Tipo</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: "right" }}>Cant.</th>
                  <th style={{ textAlign: "right" }}>P. unit.</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {c.detalles.map((d) => (
                  <tr key={d.id_detalle} style={{ borderBottom: "1px solid #ccc" }}>
                    <td style={{ padding: "6px 4px" }}>{d.tipo === "SERVICIO" ? "Servicio" : "Material"}</td>
                    <td>{d.descripcion}</td>
                    <td style={{ textAlign: "right" }}>{Number(d.cantidad)}</td>
                    <td style={{ textAlign: "right" }}>{dinero(d.precio_unitario)}</td>
                    <td style={{ textAlign: "right" }}>{dinero(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 700, paddingTop: 8 }}>
                    TOTAL
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, paddingTop: 8 }}>{dinero(c.total)}</td>
                </tr>
              </tfoot>
            </table>

            {c.observaciones && (
              <p style={{ fontSize: 13, marginTop: 16 }}>Observaciones: {c.observaciones}</p>
            )}
            <p style={{ fontSize: 12, marginTop: 24 }}>
              Elaborada por {c.usuario.nombres} {c.usuario.apellidos}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function CotizacionesSolicitud({
  solicitud,
  alCambiar,
}: {
  solicitud: {
    id_solicitud: string;
    estado: EstadoSolicitud;
    codigo?: string | null;
    cliente?: { razon_social: string } | null;
    maquina?: { nombre: string; codigo?: string | null } | null;
  };
  alCambiar: () => void;
}) {
  const [creando, setCreando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const { datos, error, cargando } = useConsulta<{ cotizaciones: Resumen[] }>(
    `/cotizaciones?id_solicitud=${solicitud.id_solicitud}&limite=50`,
  );

  const puedeCotizar = solicitud.estado === "EN_DIAGNOSTICO" || solicitud.estado === "COTIZADA";

  return (
    <section className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="mb-3 font-bold text-slate-800">Cotizaciones</h3>

      {creando ? (
        <Formulario
          idSolicitud={solicitud.id_solicitud}
          alCancelar={() => setCreando(false)}
          alGuardar={() => {
            setCreando(false);
            alCambiar();
          }}
        />
      ) : (
        <>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {cargando && <p className="text-sm text-slate-500">Cargando...</p>}
          {datos && datos.cotizaciones.length === 0 && (
            <p className="text-sm text-slate-500">Todavía no hay cotizaciones.</p>
          )}
          {datos?.cotizaciones.map((c) => (
            <div key={c.id_cotizacion} className="mb-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  <strong>{c.codigo ?? "Sin código"}</strong> · {fechaHora(c.fecha)} · Total {dinero(c.total)}
                </span>
                <button
                  onClick={() => setAbierta(abierta === c.id_cotizacion ? null : c.id_cotizacion)}
                  className="text-blue-700 hover:underline"
                >
                  {abierta === c.id_cotizacion ? "Ocultar" : "Ver"}
                </button>
              </div>
              {abierta === c.id_cotizacion && (
                <VerCotizacion
                  id={c.id_cotizacion}
                  contexto={{
                    codigoSolicitud: solicitud.codigo,
                    cliente: solicitud.cliente,
                    maquina: solicitud.maquina,
                  }}
                />
              )}
            </div>
          ))}
          {puedeCotizar && (
            <button
              onClick={() => setCreando(true)}
              className="mt-2 rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Nueva cotización
            </button>
          )}
        </>
      )}
    </section>
  );
}
