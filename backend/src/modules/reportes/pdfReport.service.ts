import pkg from "pdfmake";
const { createPdf } = pkg;
import {
  TONOS,
  COLORES_REPORTE,
  ESTADO_ORDEN_ETIQUETA_A_TONO,
  PRIORIDAD_ETIQUETA_A_TONO,
  DIAGNOSTICO_ETIQUETA_A_TONO,
} from "../../lib/reporte-theme.js";
import {
  moneda,
  redondear,
} from "./reporte-formato.js";
import { ReporteOrdenesVM } from "./reporte-tipos.js";

const PRIMARY = COLORES_REPORTE.primary;
const MUTED = COLORES_REPORTE.muted;
const INK = COLORES_REPORTE.ink;
const BORDER = COLORES_REPORTE.border;
const FONDO = COLORES_REPORTE.background;

/** Barra de progreso dibujada (canvas simple). */
function barraProgreso(valor: number, tono: keyof typeof TONOS): any {
  const paleta = TONOS[tono];
  const anchoTotal = 160;
  const anchoRelleno = Math.round((anchoTotal * Math.min(100, valor)) / 100);
  return {
    columns: [
      {
        canvas: [
          { type: "rect", x: 0, y: 4, w: anchoTotal, h: 8, r: 4, color: "#E2E8F0" },
          { type: "rect", x: 0, y: 4, w: anchoRelleno, h: 8, r: 4, color: paleta.base },
        ],
        width: anchoTotal,
        height: 16,
      },
      { text: `${valor}%`, font: "Helvetica", fontSize: 7, color: paleta.texto, margin: [6, 0, 0, 0], bold: true, alignment: "right" },
    ],
    margin: [0, 2, 0, 8],
  };
}

function chipEstado(valor: string, tono: keyof typeof TONOS): any {
  const paleta = TONOS[tono];
  return {
    text: valor,
    font: "Helvetica-Bold",
    fontSize: 7,
    color: paleta.texto,
    bold: true,
    fillColor: paleta.fondo,
    margin: [4, 1, 4, 1],
    alignment: "center",
  };
}

/** Pie de página con "Página X de Y". */
function piePDF(): any {
  return {
    columns: [
      { text: "Reporte confidencial — Sistema de Gestión DYD", font: "Helvetica", fontSize: 7, color: MUTED, margin: [40, 0, 0, 0] },
      { text: "Página {{page}} de {{pages}}", font: "Helvetica", fontSize: 7, color: MUTED, alignment: "right", margin: [0, 0, 40, 0] },
    ],
    margin: [0, 10, 0, 0],
  };
}

/** Encabezado simple repetido en cada página. */
function encabezadoPDF(titulo: string, subtitulo: string, periodo: string, generadoPor: string, generadoEn: string, filtrosTexto?: string): any[] {
  const lineaFiltros = filtrosTexto ? `   •   ${filtrosTexto}` : "";
  return [
    {
      columns: [
        {
          text: "DYD",
          font: "Helvetica-Bold",
          fontSize: 14,
          color: PRIMARY,
          bold: true,
          fillColor: "#EFF6FF",
          alignment: "center",
          margin: [0, 4, 0, 4],
          width: 60,
        },
        {
          stack: [
            { text: titulo, font: "Helvetica-Bold", fontSize: 12, color: INK, bold: true, margin: [0, 2, 0, 2] },
            { text: subtitulo, font: "Helvetica", fontSize: 8, color: MUTED, margin: [0, 0, 0, 4] },
            { text: `Período: ${periodo}${lineaFiltros}`, font: "Helvetica", fontSize: 7.5, color: MUTED, margin: [0, 0, 0, 4] },
            { text: `Generado por ${generadoPor} el ${generadoEn}`, font: "Helvetica", fontSize: 7.5, color: MUTED, margin: [0, 0, 0, 0] },
          ],
          width: "*",
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1.2, color: PRIMARY },
      ],
      margin: [0, 0, 0, 12],
    },
  ];
}

/** Tabla de detalle con encabezado repetido y filas que no se cortan. */
function tablaDetalle(vm: ReporteOrdenesVM): any {
  const filas: any[] = [];
  for (const ord of vm.filas) {
    const estadoTono = ESTADO_ORDEN_ETIQUETA_A_TONO[ord.estado] ?? "neutral";
    const prioridadTono = PRIORIDAD_ETIQUETA_A_TONO[ord.prioridad] ?? "neutral";
    const diagTono = DIAGNOSTICO_ETIQUETA_A_TONO[ord.diagnostico] ?? "neutral";
    filas.push([
      ord.codigo ?? "—",
      ord.fecha,
      ord.cliente,
      ord.maquina,
      ord.tecnico,
      ord.tipo,
      chipEstado(ord.prioridad, prioridadTono),
      chipEstado(ord.estado, estadoTono),
      chipEstado(ord.diagnostico, diagTono),
      ord.fecha_inicio ?? "—",
      ord.fecha_fin ?? "—",
      ord.dias ?? "—",
      ord.monto !== null ? moneda(redondear(ord.monto, 2)) : "—",
      ord.trabajo_realizado ?? "",
    ]);
  }

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: [14, 14, 26, 22, 20, 12, 14, 14, 12, 14, 14, 8, 16, 30],
      body: [
        [
          { text: "OT", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Fecha", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Cliente", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Máquina", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Técnico", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Tipo", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Prioridad", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Estado", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Diagnóstico", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Inicio", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Fin", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Días", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Monto", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
          { text: "Trabajo realizado", font: "Helvetica-Bold", fontSize: 7.5, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
        ],
        ...filas.map((f: any[]) => f.map((celda: any, i: number) => {
          const alineacion = i === 12 ? "right" : i >= 9 && i <= 11 ? "center" : "left";
          return {
            ...celda,
            alignment: alineacion,
            font: celda.font || { font: "Helvetica", fontSize: 7, color: INK },
            margin: [3, 2, 3, 2],
          };
        })),
        [
          { text: `TOTALES (${vm.filas.length})`, colSpan: 13, font: "Helvetica-Bold", fontSize: 7.5, color: INK, bold: true, fillColor: COLORES_REPORTE.primarySuave, margin: [3, 2, 3, 2] },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          {},
          { text: moneda(redondear(vm.totales.monto_total, 2)), font: "Helvetica-Bold", fontSize: 7.5, color: INK, bold: true, alignment: "right", margin: [3, 2, 3, 2] },
          { text: `Promedio ${vm.totales.horas_promedio ?? 0} d`, font: "Helvetica-Bold", fontSize: 7.5, color: INK, bold: true, alignment: "center", margin: [3, 2, 3, 2] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => BORDER,
      vLineColor: () => BORDER,
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 2,
      paddingBottom: () => 2,
      fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? FONDO : undefined),
    },
    margin: [0, 0, 0, 12],
  };
}

/** Genera el buffer PDF del reporte de órdenes. */
export async function generarPdfOrdenes(
  vm: ReporteOrdenesVM,
  filtros?: { id_cliente?: string; id_tecnico?: string; cliente?: string; tecnico?: string },
): Promise<{ buffer: Buffer; nombreArchivo: string }> {
  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [40, 40, 40, 36],
    info: {
      title: vm.titulo,
      author: vm.generado_por,
      subject: "Reporte operativo de órdenes de trabajo — DYD",
      creator: "Sistema DYD",
    },
    footer: piePDF(),
    header: encabezadoPDF(
      vm.titulo,
      vm.subtitulo,
      vm.periodo,
      vm.generado_por,
      vm.generado_en,
      `${filtros?.cliente ?? ""}${filtros?.tecnico ? ` | Técnico: ${filtros.tecnico}` : ""}`,
    ),
    content: [
      {
        text: vm.titulo,
        font: "Helvetica-Bold",
        fontSize: 15,
        color: INK,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      { text: vm.subtitulo, font: "Helvetica", fontSize: 9, color: MUTED, margin: [0, 0, 0, 10] },
      {
        text: `Período: ${vm.periodo}   |   Generado por: ${vm.generado_por}   |   ${vm.generado_en}`,
        font: "Helvetica",
        fontSize: 8,
        color: MUTED,
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [120, 30, 30, 340],
          body: [
            [
              { text: "Estado", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Cantidad", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "%", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Progreso", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
            ],
            ...vm.estados.map((est) => {
              const tono = est.tono as keyof typeof TONOS;
              return [
                chipEstado(est.estado, tono),
                est.cantidad,
                `${est.porcentaje}%`,
                barraProgreso(est.porcentaje, tono),
              ];
            }),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => BORDER,
          vLineColor: () => BORDER,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 0, 0, 14],
      },
      {
        text: "Cumplimiento por técnico",
        font: "Helvetica-Bold",
        fontSize: 9.5,
        color: INK,
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [34, 16, 18, 14, 14, 16, 40, 30, 22],
          body: [
            [
              { text: "Técnico", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Órdenes", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Finalizadas", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "En proceso", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Pendientes", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Canceladas", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Cumplimiento", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Monto total", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Días promedio", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
            ],
            ...vm.tecnicos.map((tec) => {
              const cumpl = tec.cumplimiento;
              const tono = cumpl >= 80 ? "success" : cumpl >= 50 ? "warning" : "danger";
              return [
                tec.tecnico,
                tec.ordenes,
                tec.finalizadas,
                tec.en_proceso,
                tec.pendientes,
                tec.canceladas,
                barraProgreso(cumpl, tono),
                moneda(redondear(tec.monto_total, 2)),
                tec.dias_promedio ?? "—",
              ];
            }),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => BORDER,
          vLineColor: () => BORDER,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
          fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? FONDO : undefined),
        },
        margin: [0, 0, 0, 12],
      },
      {
        text: "Detalle de órdenes",
        font: "Helvetica-Bold",
        fontSize: 9.5,
        color: INK,
        margin: [0, 0, 0, 6],
      },
      tablaDetalle(vm),
      {
        text: "Materiales más utilizados",
        font: "Helvetica-Bold",
        fontSize: 9.5,
        color: INK,
        margin: [0, 12, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [20, 120, 60, 320],
          body: [
            [
              { text: "Código", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Material", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "Cantidad", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
              { text: "", font: "Helvetica-Bold", fontSize: 8, color: "#FFFFFF", bold: true, fillColor: PRIMARY, alignment: "center" },
            ],
            ...vm.materiales.map((m: any) => [
              m.codigo ?? "—",
              m.nombre,
              m.cantidad,
              "",
            ]),
            [
              { text: "TOTAL", colSpan: 3, font: "Helvetica-Bold", fontSize: 8, color: INK, bold: true, fillColor: COLORES_REPORTE.primarySuave, margin: [3, 2, 3, 2] },
              {},
              {},
              { text: vm.materiales.reduce((a: number, b: any) => a + b.cantidad, 0).toString(), font: "Helvetica-Bold", fontSize: 8, color: INK, bold: true, alignment: "center", margin: [3, 2, 3, 2] },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => BORDER,
          vLineColor: () => BORDER,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 0, 0, 0],
      },
    ],
  };

  const pdf = createPdf(docDefinition);
  const buffer = await pdf.getBuffer();

  const clienteSlug = (filtros?.cliente ?? "todos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
  const [desde, hasta] = vm.periodo.split(" — ");
  const nombreArchivo = `ordenes_${clienteSlug}_${desde.replace(/\//g, "-")}_${hasta.replace(/\//g, "-")}.pdf`;

  return { buffer: Buffer.from(buffer), nombreArchivo };
}
