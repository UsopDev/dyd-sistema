import pkg from "exceljs";
const { Workbook } = pkg;
import PDFDocument from "pdfkit";
import {
  COLORES_REPORTE,
  argb,
} from "../../lib/reporte-theme.js";

const PRIMARY = COLORES_REPORTE.primary;
const PRIMARY_ARG = argb(PRIMARY);
const TEXTO_ARG = argb(COLORES_REPORTE.ink);
const MUTED_ARG = argb(COLORES_REPORTE.muted);
const BORDER_ARG = argb(COLORES_REPORTE.border);
const FONDO_ARG = argb(COLORES_REPORTE.background);

/**
 * Formatea un valor para mostrarlo en una celda de reporte.
 * Maneja objetos anidados, arrays, números, fechas, booleanos, etc.
 * Evita mostrar "[object Object]" en las celdas.
 */
function formatearValorCelda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number") return Number.isFinite(valor) ? String(valor) : "";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "object") {
    if (Array.isArray(valor)) return valor.map(formatearValorCelda).join(", ");
    const claves = Object.keys(valor);
    if (claves.length === 1) return formatearValorCelda((valor as Record<string, unknown>)[claves[0]]);
    return JSON.stringify(valor);
  }
  return String(valor);
}

function bordeFila(ws: any, fila: number, colInicio: number, colFin: number): void {
  for (let c = colInicio; c <= colFin; c++) {
    const celda = ws.getRow(fila).getCell(c);
    celda.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  }
}

function cabeceraMarca(
  ws: any,
  filaInicial: number,
  titulo: string,
  subtitulo: string,
  lineaExtra?: string,
): number {
  let fila = filaInicial;

  ws.mergeCells(fila, 1, fila, 4);
  const logo = ws.getRow(fila).getCell(1);
  logo.value = "DYD";
  logo.font = { bold: true, size: 16, color: { argb: TEXTO_ARG } };
  logo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
  logo.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(fila).height = 30;
  bordeFila(ws, fila, 1, 4);
  fila++;

  ws.mergeCells(fila, 1, fila, 8);
  const t = ws.getRow(fila).getCell(1);
  t.value = titulo;
  t.font = { bold: true, size: 13, color: { argb: TEXTO_ARG } };
  t.alignment = { horizontal: "left", vertical: "middle" };
  fila++;

  ws.mergeCells(fila, 1, fila, 8);
  const s = ws.getRow(fila).getCell(1);
  s.value = subtitulo;
  s.font = { size: 9, italic: true, color: { argb: MUTED_ARG } };
  s.alignment = { horizontal: "left", vertical: "middle" };
  fila++;

  if (lineaExtra) {
    ws.mergeCells(fila, 1, fila, 8);
    const e = ws.getRow(fila).getCell(1);
    e.value = lineaExtra;
    e.font = { size: 9, italic: true, color: { argb: MUTED_ARG } };
    e.alignment = { horizontal: "left", vertical: "middle" };
    fila++;
  }

  return fila + 1;
}

function anchoColumnas(ws: any, anchos: number[]): void {
  anchos.forEach((ancho, i) => {
    ws.getColumn(i + 1).width = ancho;
  });
}

/**
 * Genera XLSX con tema profesional para cualquier reporte genérico.
 */
export async function generarExcelGenerico({
  titulo,
  subtitulo,
  periodo,
  generadoPor,
  generadoEn,
  filas,
}: {
  titulo: string;
  subtitulo: string;
  periodo: string;
  generadoPor: string;
  generadoEn: string;
  filas: Record<string, unknown>[];
}): Promise<Buffer> {
  const wb = new Workbook();
  wb.creator = "Sistema DYD";
  wb.lastModifiedBy = generadoPor;
  wb.created = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet("Reporte");
  let fila = cabeceraMarca(
    ws,
    1,
    titulo,
    subtitulo,
    `Generado por: ${generadoPor}   |   ${generadoEn}   |   Período: ${periodo}`,
  );

  if (filas.length === 0) {
    ws.mergeCells(fila, 1, fila, 8);
    const vacio = ws.getRow(fila).getCell(1);
    vacio.value = "Sin datos para el período seleccionado.";
    vacio.font = { size: 10, italic: true, color: { argb: MUTED_ARG } };
    vacio.alignment = { horizontal: "center", vertical: "middle" };
  } else {
    const headers = Object.keys(filas[0]);
    ws.addRow(headers);
    const hRow = ws.getRow(fila);
    hRow.eachCell((c: any) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
      c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      c.border = {
        top: { style: "thin", color: { argb: BORDER_ARG } },
        bottom: { style: "thin", color: { argb: BORDER_ARG } },
        left: { style: "thin", color: { argb: BORDER_ARG } },
        right: { style: "thin", color: { argb: BORDER_ARG } },
      };
    });
    ws.getRow(fila).height = 24;
    fila++;

    const primeraFilaDatos = fila;
    for (const row of filas) {
      ws.addRow(Object.keys(row).map((k) => formatearValorCelda(row[k])));
      const r = ws.getRow(fila);
      r.eachCell((c: any) => {
        c.border = {
          top: { style: "thin", color: { argb: BORDER_ARG } },
          bottom: { style: "thin", color: { argb: BORDER_ARG } },
          left: { style: "thin", color: { argb: BORDER_ARG } },
          right: { style: "thin", color: { argb: BORDER_ARG } },
        };
        if (c.row.number % 2 === 0) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FONDO_ARG } };
        }
      });
      fila++;
    }

    const ultima = fila - 1;
    ws.autoFilter = {
      from: { row: primeraFilaDatos - 1, column: 1 },
      to: { row: ultima, column: headers.length },
    };
  }

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, filas.length > 0 ? Object.keys(filas[0]).map(() => 20) : [20, 20, 20]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * Genera PDF con tema profesional para cualquier reporte genérico (usa pdfkit).
 */
export async function generarPdfGenerico({
  titulo,
  subtitulo,
  periodo,
  generadoPor,
  generadoEn,
  filas,
  columnas,
  filtrosTexto,
}: {
  titulo: string;
  subtitulo: string;
  periodo: string;
  generadoPor: string;
  generadoEn: string;
  filas: Record<string, unknown>[];
  columnas: Array<{ key: string; label: string; align?: "left" | "center" | "right" }>;
  filtrosTexto?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const paginaAncho = doc.page.width;
    const margenIzq = 40;
    const margenDer = 40;
    const anchoDisponible = paginaAncho - margenIzq - margenDer;

    // ===== ENCABEZADO DE MARCA (primera página y cada nueva página) =====
    function dibujarCabecera() {
      // Logo DYD
      doc.rect(margenIzq, doc.y, 45, 18).fill(PRIMARY);
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#FFFFFF").text("DYD", margenIzq, doc.y + 2, { width: 45, align: "center" });

      // Título a la derecha del logo
      doc.fontSize(13).font("Helvetica-Bold").fillColor(COLORES_REPORTE.ink).text(titulo, margenIzq + 55, doc.y + 1, { width: anchoDisponible - 55, align: "left" });
      doc.fontSize(8).font("Helvetica").fillColor(COLORES_REPORTE.muted).text(subtitulo, margenIzq + 55, doc.y + 13, { width: anchoDisponible - 55, align: "left" });

      // Línea bajo título
      doc.moveTo(margenIzq, doc.y + 6).lineTo(paginaAncho - margenDer, doc.y + 6).strokeColor(PRIMARY).lineWidth(1.2).stroke();
      doc.moveDown(1.2);

      // Período y generado por
      doc.fontSize(7.5).font("Helvetica").fillColor(COLORES_REPORTE.muted);
      doc.text(`Período: ${periodo}`, margenIzq, doc.y, { width: anchoDisponible / 2, align: "left" });
      doc.text(`Generado por ${generadoPor} — ${generadoEn}`, margenIzq + anchoDisponible / 2, doc.y - 10, { width: anchoDisponible / 2, align: "right" });
      if (filtrosTexto) {
        doc.fontSize(7).font("Helvetica-Oblique").fillColor(COLORES_REPORTE.muted).text(filtrosTexto, margenIzq, doc.y + 5, { width: anchoDisponible, align: "left" });
      }

      doc.moveDown(0.8);
      doc.moveTo(margenIzq, doc.y).lineTo(paginaAncho - margenDer, doc.y).strokeColor(COLORES_REPORTE.border).lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    }

    // Primera página
    dibujarCabecera();

    if (filas.length === 0) {
      doc.fontSize(11).font("Helvetica-Oblique").fillColor(COLORES_REPORTE.muted).text("Sin datos para el período seleccionado.", { align: "center" });
      doc.end();
      return;
    }

    // Calcular anchos de columna
    const numCols = columnas.length;
    const anchoCol = anchoDisponible / numCols;

    // Encabezado de tabla
    const yHeader = doc.y;
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#FFFFFF");
    columnas.forEach((col, i) => {
      const x = margenIzq + i * anchoCol;
      doc.rect(x, yHeader, anchoCol, 16).fill(PRIMARY);
      doc.text(col.label, x + 4, yHeader + 3, { width: anchoCol - 8, align: col.align ?? "center" });
    });

    // Filas de datos con zebra
    doc.fontSize(7).font("Helvetica").fillColor(COLORES_REPORTE.ink);
    let yFila = doc.y + 16;
    const altoFila = 14;

    filas.forEach((row, idx) => {
      // Nueva página si no hay espacio
      if (yFila > doc.page.height - 70) {
        doc.addPage();
        dibujarCabecera();
        // Redibujar header de tabla
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#FFFFFF");
        columnas.forEach((col, i) => {
          const x = margenIzq + i * anchoCol;
          doc.rect(x, doc.y, anchoCol, 16).fill(PRIMARY);
          doc.text(col.label, x + 4, doc.y + 3, { width: anchoCol - 8, align: col.align ?? "center" });
        });
        yFila = doc.y + 16;
        doc.fontSize(7).font("Helvetica").fillColor(COLORES_REPORTE.ink);
      }

      // Fondo zebra en filas pares
      if (idx % 2 === 1) {
        doc.rect(margenIzq, yFila - 1, anchoDisponible, altoFila).fill(FONDO_ARG);
      }

      // Dibujar celdas con bordes finos
      columnas.forEach((col, i) => {
        const x = margenIzq + i * anchoCol;
        const val = row[col.key];
        const str = formatearValorCelda(val);
        // Borde derecho de celda (excepto última)
        if (i < numCols - 1) {
          doc.moveTo(x + anchoCol, yFila - 1).lineTo(x + anchoCol, yFila + altoFila - 1).strokeColor(COLORES_REPORTE.border).lineWidth(0.3).stroke();
        }
        doc.text(str, x + 4, yFila + 1, { width: anchoCol - 8, align: col.align ?? "left" });
      });

      // Línea horizontal bajo fila
      doc.moveTo(margenIzq, yFila + altoFila - 1).lineTo(paginaAncho - margenDer, yFila + altoFila - 1).strokeColor(COLORES_REPORTE.border).lineWidth(0.3).stroke();
      yFila += altoFila;
    });

    // Línea bajo tabla
    doc.moveTo(margenIzq, yFila - 1).lineTo(paginaAncho - margenDer, yFila - 1).strokeColor(PRIMARY).lineWidth(0.8).stroke();

    doc.end();
  });
}
