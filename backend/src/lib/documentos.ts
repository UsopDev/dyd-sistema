/**
 * Generador de documentos imprimibles.
 *
 * Produce HTML autocontenido (sin CSS externo ni JavaScript) que el navegador
 * puede imprimir o guardar como PDF con Ctrl+P. Se usa para la cotización
 * entregada al cliente y para el informe de servicio que respalda el trabajo.
 */

function escapar(texto: unknown): string {
  if (texto === null || texto === undefined) return "";

  const ENT_AMP = String.fromCharCode(38);
  const ENT_LT = String.fromCharCode(60);
  const ENT_GT = String.fromCharCode(62);
  const ENT_QUOT = String.fromCharCode(34);
  const ENT_APOS = String.fromCharCode(39);

  return String(texto)
    .replace(/&/g, ENT_AMP + "amp;")
    .replace(/</g, ENT_LT + "lt;")
    .replace(/>/g, ENT_GT + "gt;")
    .replace(/"/g, ENT_QUOT + "quot;")
    .replace(/'/g, ENT_APOS + "#39;");
}

function soles(valor: unknown): string {
  const numero = Number(valor ?? 0);
  return `S/ ${numero.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fecha(valor: unknown): string {
  if (!valor) return "—";

  const fecha = valor instanceof Date ? valor : new Date(String(valor));
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fechaHora(valor: unknown): string {
  if (!valor) return "—";

  const f = valor instanceof Date ? valor : new Date(String(valor));
  if (Number.isNaN(f.getTime())) return "—";

  return `${f.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })} ${f.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
}

interface DocumentoBase {
  titulo: string;
  subtitulo: string;
  referencia: string;
}

const ESTILOS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    font-size: 13px;
    line-height: 1.5;
    background: #ffffff;
  }
  .encabezado {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #1d4ed8;
  }
  .empresa h1 { margin: 0; font-size: 17px; color: #1d4ed8; letter-spacing: -0.2px; }
  .empresa p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
  .doc { text-align: right; }
  .doc h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
  .datos {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 32px;
    margin: 20px 0;
    padding: 14px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  .datos .campo span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
  .datos .campo strong { display: block; margin-top: 2px; font-weight: 600; color: #0f172a; }
  h3 { margin: 22px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #334155; }
  p.bloque { margin: 0; padding: 10px 12px; background: #f8fafc; border-left: 3px solid #cbd5e1; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    padding: 7px 8px;
    border-bottom: 1px solid #cbd5e1;
    background: #f8fafc;
  }
  td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .total { margin-top: 12px; margin-left: auto; width: 260px; }
  .total div { display: flex; justify-content: space-between; padding: 7px 8px; }
  .total .fila-final {
    border-top: 2px solid #0f172a;
    margin-top: 4px;
    padding-top: 9px;
    font-size: 15px;
    font-weight: 700;
  }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; }
  .firma { text-align: center; font-size: 11px; color: #475569; }
  .firma .linea { margin-bottom: 6px; border-top: 1px solid #94a3b8; padding-top: 6px; }
  .pie { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    @page { margin: 14mm; }
  }
`;

/** Botón de impresión que solo aparece en pantalla, no en el papel. */
function barraImprimir(): string {
  return `<div class="no-print" style="margin-bottom:20px;text-align:right">
    <button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer">
      Imprimir / Guardar como PDF
    </button>
  </div>`;
}

function encabezado(base: DocumentoBase): string {
  return `
    <div class="encabezado">
      <div class="empresa">
        <h1>Soldaduras Especiales y Rectificaciones DYD E.I.R.L.</h1>
        <p>Reparación, mantenimiento y rectificación de maquinaria industrial</p>
        <p>Urbanización Faucet, Mz. M, Lote 1A, Callao, Perú</p>
      </div>
      <div class="doc">
        <h2>${escapar(base.titulo)}</h2>
        <p>${escapar(base.subtitulo)}</p>
        <p><strong>${escapar(base.referencia)}</strong></p>
      </div>
    </div>`;
}

function pie(): string {
  return `<div class="pie">
    Documento generado por el Sistema de Gestión para el Diagnóstico y Mantenimiento de Máquinas Industriales.
    Este documento es un comprobante interno de servicio y no sustituye los comprobantes de pago tributarios.
  </div>`;
}

function firmas(izquierda: string, derecha: string): string {
  return `
    <div class="firmas">
      <div class="firma"><div class="linea">${escapar(izquierda)}</div></div>
      <div class="firma"><div class="linea">${escapar(derecha)}</div></div>
    </div>`;
}

function envolver(contenido: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Documento DYD</title>
  <style>${ESTILOS}</style>
</head>
<body>
  ${barraImprimir()}
  ${contenido}
</body>
</html>`;
}

export interface LineaCotizacionDocumento {
  tipo: string;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string | null;
  subtotal?: number | string | null;
}

export interface CotizacionDocumento {
  codigo: string | null;
  fecha: Date | string;
  total: number | string;
  observaciones: string | null;
  solicitud: {
    codigo: string | null;
    tipo_servicio: string;
    descripcion: string;
    maquina: { codigo: string | null; nombre: string; tipo: string | null; marca: string | null; modelo: string | null; nro_serie: string | null };
    cliente: { razon_social: string; ruc_dni: string | null; contacto: string | null; telefono: string | null; direccion: string | null } | null;
  };
  tecnico: { nombres: string; apellidos: string };
  detalles: LineaCotizacionDocumento[];
}

/** Documento imprimible de la cotización (requisito funcional RF7). */
export function documentoCotizacion(cotizacion: CotizacionDocumento): string {
  const filas = cotizacion.detalles
    .map(
      (linea) => `
      <tr>
        <td>${escapar(linea.tipo === "MATERIAL" ? "Material" : "Servicio")}</td>
        <td>${escapar(linea.descripcion)}</td>
        <td class="num">${escapar(linea.cantidad)}</td>
        <td class="num">${soles(linea.precio_unitario)}</td>
        <td class="num">${soles(linea.subtotal ?? Number(linea.cantidad) * Number(linea.precio_unitario ?? 0))}</td>
      </tr>`,
    )
    .join("");

  const contenido = `
    ${encabezado({
      titulo: "Cotización",
      subtitulo: "Presupuesto de servicio",
      referencia: cotizacion.codigo ?? "SIN CÓDIGO",
    })}

    <div class="datos">
      <div class="campo"><span>Cliente</span><strong>${escapar(cotizacion.solicitud.cliente?.razon_social ?? "Cliente propio de DYD")}</strong></div>
      <div class="campo"><span>RUC / DNI</span><strong>${escapar(cotizacion.solicitud.cliente?.ruc_dni ?? "—")}</strong></div>
      <div class="campo"><span>Fecha</span><strong>${fecha(cotizacion.fecha)}</strong></div>
      <div class="campo"><span>Solicitud</span><strong>${escapar(cotizacion.solicitud.codigo ?? "—")}</strong></div>
      <div class="campo"><span>Máquina</span><strong>${escapar(cotizacion.solicitud.maquina.nombre)}</strong></div>
      <div class="campo"><span>Tipo de servicio</span><strong>${escapar(cotizacion.solicitud.tipo_servicio)}</strong></div>
    </div>

    <h3>Detalle de la cotización</h3>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descripción</th>
          <th class="num">Cantidad</th>
          <th class="num">P. unitario</th>
          <th class="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="5">Sin ítems.</td></tr>'}</tbody>
    </table>

    <div class="total">
      <div class="fila-final"><span>Total</span><span>${soles(cotizacion.total)}</span></div>
    </div>

    ${cotizacion.observaciones ? `<h3>Observaciones</h3><p class="bloque">${escapar(cotizacion.observaciones)}</p>` : ""}

    ${firmas(
      `${cotizacion.tecnico.nombres} ${cotizacion.tecnico.apellidos}\nTécnico responsable`,
      "Recepción conforme del cliente",
    )}

    ${pie()}`;

  return envolver(contenido);
}

export interface MaterialOrdenDocumento {
  cantidad: number | string;
  precio_unitario: number | string | null;
  subtotal?: number | string | null;
  material: { codigo: string | null; nombre: string; unidad: string };
}

export interface OrdenDocumento {
  codigo: string | null;
  estado: string;
  trabajo_realizado: string | null;
  monto: number | string | null;
  fecha_inicio: Date | string | null;
  fecha_fin: Date | string | null;
  solicitud: {
    codigo: string | null;
    tipo_servicio: string;
    descripcion: string;
    maquina: { codigo: string | null; nombre: string; tipo: string | null; marca: string | null; modelo: string | null; nro_serie: string | null };
    cliente: { razon_social: string; ruc_dni: string | null } | null;
  };
  diagnostico: {
    estado_general: string;
    fallas_detectadas: string;
    recomendaciones: string | null;
  } | null;
  tecnico: { nombres: string; apellidos: string };
  materiales: MaterialOrdenDocumento[];
}

/** Informe de servicio imprimible (requisito funcional RF12). */
export function documentoInformeServicio(orden: OrdenDocumento): string {
  const filas = orden.materiales
    .map(
      (material) => `
      <tr>
        <td>${escapar(material.material.codigo ?? "—")}</td>
        <td>${escapar(material.material.nombre)}</td>
        <td class="num">${escapar(material.cantidad)}</td>
        <td>${escapar(material.material.unidad)}</td>
        <td class="num">${soles(material.precio_unitario)}</td>
        <td class="num">${soles(material.subtotal ?? Number(material.cantidad) * Number(material.precio_unitario ?? 0))}</td>
      </tr>`,
    )
    .join("");

  const contenido = `
    ${encabezado({
      titulo: "Informe de servicio",
      subtitulo: "Respaldo del mantenimiento realizado",
      referencia: orden.codigo ?? "SIN CÓDIGO",
    })}

    <div class="datos">
      <div class="campo"><span>Cliente</span><strong>${escapar(orden.solicitud.cliente?.razon_social ?? "Cliente propio de DYD")}</strong></div>
      <div class="campo"><span>RUC / DNI</span><strong>${escapar(orden.solicitud.cliente?.ruc_dni ?? "—")}</strong></div>
      <div class="campo"><span>Solicitud</span><strong>${escapar(orden.solicitud.codigo ?? "—")}</strong></div>
      <div class="campo"><span>Tipo de servicio</span><strong>${escapar(orden.solicitud.tipo_servicio)}</strong></div>
      <div class="campo"><span>Máquina</span><strong>${escapar(orden.solicitud.maquina.nombre)}</strong></div>
      <div class="campo"><span>Estado de la orden</span><strong>${escapar(orden.estado)}</strong></div>
      <div class="campo"><span>Inicio</span><strong>${fechaHora(orden.fecha_inicio)}</strong></div>
      <div class="campo"><span>Fin</span><strong>${fechaHora(orden.fecha_fin)}</strong></div>
    </div>

    <h3>Diagnóstico técnico</h3>
    <div class="datos" style="grid-template-columns:1fr">
      <div class="campo"><span>Estado general</span><strong>${escapar(orden.diagnostico?.estado_general ?? "—")}</strong></div>
    </div>
    <p class="bloque">${escapar(orden.diagnostico?.fallas_detectadas ?? "Sin diagnóstico registrado.")}</p>
    ${orden.diagnostico?.recomendaciones ? `<h3>Recomendaciones</h3><p class="bloque">${escapar(orden.diagnostico.recomendaciones)}</p>` : ""}

    <h3>Trabajo realizado</h3>
    <p class="bloque">${escapar(orden.trabajo_realizado ?? "Sin descripción del trabajo.")}</p>

    <h3>Materiales utilizados</h3>
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Material</th>
          <th class="num">Cantidad</th>
          <th>Unidad</th>
          <th class="num">P. unitario</th>
          <th class="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="6">Sin materiales registrados.</td></tr>'}</tbody>
    </table>

    <div class="total">
      <div class="fila-final"><span>Total del servicio</span><span>${soles(orden.monto ?? 0)}</span></div>
    </div>

    ${firmas(
      `${orden.tecnico.nombres} ${orden.tecnico.apellidos}\nTécnico responsable`,
      "Conformidad del cliente",
    )}

    ${pie()}`;

  return envolver(contenido);
}
