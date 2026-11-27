import pkg from "exceljs";
const { Workbook } = pkg;
import type { Workbook as WorkbookType } from "exceljs";
import {
  TONOS,
  argb,
  COLORES_REPORTE,
  ESTADO_ORDEN_ETIQUETA_A_TONO,
} from "../../lib/reporte-theme.js";
import { ReporteOrdenesVM } from "./reporte-tipos.js";

const PRIMARY = COLORES_REPORTE.primary;
const PRIMARY_ARG = argb(PRIMARY);
const TEXTO_ARG = argb(COLORES_REPORTE.ink);
const MUTED_ARG = argb(COLORES_REPORTE.muted);
const BORDER_ARG = argb(COLORES_REPORTE.border);
const FONDO_ARG = argb(COLORES_REPORTE.background);

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

function tonoTexto(tono: "primary" | "info" | "success" | "warning" | "danger" | "neutral"): string {
  return TONOS[tono as keyof typeof TONOS].texto;
}

/** Hoja "Resumen": KPIs, distribución por estado, top técnicos y clientes. */
function hojaResumen(wb: WorkbookType, vm: ReporteOrdenesVM): void {
  const ws = wb.addWorksheet("Resumen");
  let fila = cabeceraMarca(
    ws,
    1,
    vm.titulo,
    vm.subtitulo,
    `Generado por: ${vm.generado_por}   |   ${vm.generado_en}   |   Período: ${vm.periodo}`,
  );

  // KPIs en tarjetas
  ws.mergeCells(fila, 1, fila, 8);
  const kTitulo = ws.getRow(fila).getCell(1);
  kTitulo.value = "Indicadores clave";
  kTitulo.font = { bold: true, size: 11, color: { argb: TEXTO_ARG } };
  fila++;

  for (let i = 0; i < vm.kpis.length; i += 4) {
    const grupo = vm.kpis.slice(i, i + 4);
    for (let j = 0; j < grupo.length; j++) {
      const kpi = grupo[j];
      const col = j + 1;
      ws.mergeCells(fila, col, fila + 1, col);
      const c = ws.getRow(fila).getCell(col);
      c.value = kpi.valor;
      const tono = kpi.tono as keyof typeof TONOS;
      c.font = { bold: true, size: 18, color: { argb: argb(TONOS[tono].base) } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(TONOS[tono].fondo) },
      };
      c.alignment = { horizontal: "center", vertical: "middle" };
      c.border = {
        top: { style: "thin", color: { argb: BORDER_ARG } },
        bottom: { style: "thin", color: { argb: BORDER_ARG } },
        left: { style: "thin", color: { argb: BORDER_ARG } },
        right: { style: "thin", color: { argb: BORDER_ARG } },
      };
      ws.getRow(fila).height = 30;
      ws.getRow(fila + 1).height = 18;

      const etiqueta = ws.getRow(fila + 1).getCell(col);
      etiqueta.value = kpi.etiqueta;
      etiqueta.font = { size: 8, bold: true, color: { argb: MUTED_ARG } };
      etiqueta.alignment = { horizontal: "center", vertical: "middle" };
    }
    fila += 2;
    fila++;
  }

  // Distribución por estado
  fila++;
  ws.mergeCells(fila, 1, fila, 8);
  const eTit = ws.getRow(fila).getCell(1);
  eTit.value = "Distribución por estado";
  eTit.font = { bold: true, size: 11, color: { argb: TEXTO_ARG } };
  fila++;

  const headersEstado = ["Estado", "Cantidad", "%"];
  ws.addRow(headersEstado);
  const hEstado = ws.getRow(fila);
  hEstado.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  ws.getRow(fila).height = 18;
  fila++;

  for (const est of vm.estados) {
    const tono = est.tono as keyof typeof TONOS;
    const row = ws.addRow([est.estado, est.cantidad, `${est.porcentaje}%`]);
    row.getCell(1).font = { bold: true, color: { argb: TEXTO_ARG } };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(TONOS[tono].fondo) },
    };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(3).font = { color: { argb: argb(tonoTexto(tono)) }, bold: true };
    row.eachCell((c: any) => {
      c.border = {
        top: { style: "thin", color: { argb: BORDER_ARG } },
        bottom: { style: "thin", color: { argb: BORDER_ARG } },
        left: { style: "thin", color: { argb: BORDER_ARG } },
        right: { style: "thin", color: { argb: BORDER_ARG } },
      };
    });
    fila++;
  }

  // Top técnicos
  fila++;
  ws.mergeCells(fila, 1, fila, 8);
  const tTit = ws.getRow(fila).getCell(1);
  tTit.value = "Cumplimiento por técnico";
  tTit.font = { bold: true, size: 11, color: { argb: TEXTO_ARG } };
  fila++;

  const headersTec = ["Técnico", "Órdenes", "Finalizadas", "Cumplimiento"];
  ws.addRow(headersTec);
  const hTec = ws.getRow(fila);
  hTec.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  ws.getRow(fila).height = 18;
  fila++;

  for (const tec of vm.tecnicos.slice(0, 10)) {
    const cumpl = tec.cumplimiento;
    const tono = cumpl >= 80 ? "success" : cumpl >= 50 ? "warning" : "danger";
    ws.addRow([
      tec.tecnico,
      tec.ordenes,
      tec.finalizadas,
      `${tec.cumplimiento}%`,
    ]);
    const r = ws.getRow(fila);
    r.getCell(1).font = { color: { argb: TEXTO_ARG } };
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(4).font = { color: { argb: argb(tonoTexto(tono)) }, bold: true };
    r.getCell(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(TONOS[tono].fondo) },
    };
    r.eachCell((c: any) => {
      c.border = {
        top: { style: "thin", color: { argb: BORDER_ARG } },
        bottom: { style: "thin", color: { argb: BORDER_ARG } },
        left: { style: "thin", color: { argb: BORDER_ARG } },
        right: { style: "thin", color: { argb: BORDER_ARG } },
      };
    });
    fila++;
  }

  // Pie de página
  fila++;
  ws.mergeCells(fila, 1, fila, 8);
  const pie = ws.getRow(fila).getCell(1);
  pie.value = "Reporte generado por el Sistema de Gestión DYD — Confidencial";
  pie.font = { size: 8, italic: true, color: { argb: MUTED_ARG } };
  pie.alignment = { horizontal: "center", vertical: "middle" };

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, [26, 12, 12, 16, 6, 6, 6, 6]);
}

/** Hoja "Detalle": una fila por orden con todos los campos y totales con fórmulas. */
function hojaDetalle(wb: WorkbookType, vm: ReporteOrdenesVM): void {
  const ws = wb.addWorksheet("Detalle");
  let fila = cabeceraMarca(
    ws,
    1,
    "Detalle de órdenes de trabajo",
    vm.subtitulo,
    `Generado por: ${vm.generado_por}   |   ${vm.generado_en}   |   Período: ${vm.periodo}`,
  );

  const headers = [
    "OT",
    "Fecha",
    "Cliente",
    "Máquina",
    "Técnico",
    "Tipo",
    "Prioridad",
    "Estado",
    "Diagnóstico",
    "Inicio",
    "Fin",
    "Días",
    "Materiales",
    "Monto",
    "Trabajo realizado",
  ];

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
  ws.getRow(fila).height = 30;
  fila++;

  const primeraFilaDatos = fila;
  for (const ord of vm.filas) {
    const estadoTono = ESTADO_ORDEN_ETIQUETA_A_TONO[ord.estado] ?? "neutral";

    ws.addRow([
      ord.codigo ?? "—",
      ord.fecha,
      ord.cliente,
      ord.maquina,
      ord.tecnico,
      ord.tipo,
      ord.prioridad,
      ord.estado,
      ord.diagnostico,
      ord.fecha_inicio ?? "—",
      ord.fecha_fin ?? "—",
      ord.dias ?? "—",
      ord.materiales,
      ord.monto ?? 0,
      ord.trabajo_realizado ?? "",
    ]);
    const r = ws.getRow(fila);
    r.getCell(1).font = { bold: true, size: 9, color: { argb: TEXTO_ARG } };
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(8).font = { bold: true, size: 9, color: { argb: argb(tonoTexto(estadoTono)) } };
    r.getCell(8).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(TONOS[estadoTono].fondo) },
    };
    r.getCell(8).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(10).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(11).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(12).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(13).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(14).numFmt = '#,##0.00';
    r.getCell(14).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(15).alignment = { horizontal: "left", vertical: "middle" };
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

  // Fila de totales con fórmulas reales
  const ultima = fila - 1;
  ws.addRow([
    "TOTALES",
    "",
    "",
    "",
    "",
    "",
    "",
    `Órdenes: ${vm.filas.length}`,
    "",
    "",
    "",
    `Promedio: ${vm.totales.horas_promedio ?? 0} d`,
    "",
    `=SUM(N${primeraFilaDatos}:N${ultima})`,
    "",
  ]);
  const tRow = ws.getRow(fila);
  tRow.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: TEXTO_ARG }, size: 9 };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES_REPORTE.primarySuave.replace("#", "") },
    };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  tRow.getCell(14).numFmt = '#,##0.00';
  tRow.getCell(14).alignment = { horizontal: "right", vertical: "middle" };

  fila++;

  // Data bars en Monto y Días; icon set en Prioridad
  try {
    ws.addConditionalFormatting({
      ref: `N${primeraFilaDatos}:N${ultima}`,
      rules: [
        {
          type: "dataBar",
          priority: 1,

          showValue: false,
          minLength: 0,
          maxLength: 100,
        },
      ],
    });
    ws.addConditionalFormatting({
      ref: `L${primeraFilaDatos}:L${ultima}`,
      rules: [
        {
          type: "dataBar",
          priority: 2,

          showValue: false,
          minLength: 0,
          maxLength: 100,
        },
      ],
    });
    ws.addConditionalFormatting({
      ref: `G${primeraFilaDatos}:G${ultima}`,
      rules: [
        {
          type: "iconSet",
          priority: 3,
          iconSet: "3TrafficLights1",
          showValue: false,
          cfvo: [
            { type: "num", value: 0 },
            { type: "num", value: 1 },
            { type: "num", value: 2 },
          ],
          reverse: false,
        },
      ],
    });
  } catch {
    // Conditional formatting puede no estar disponible en versiones antiguas; no bloquea el reporte
  }

  (ws as any).freezePanes = `A${primeraFilaDatos}`;
  ws.autoFilter = {
    from: { row: primeraFilaDatos - 1, column: 1 },
    to: { row: ultima, column: headers.length },
  };

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, [10, 12, 22, 22, 18, 12, 10, 12, 12, 14, 14, 8, 30, 12, 40]);
}

/** Hoja "Materiales": detalle de consumibles por orden. */
function hojaMateriales(wb: WorkbookType, vm: ReporteOrdenesVM): void {
  const ws = wb.addWorksheet("Materiales");
  let fila = cabeceraMarca(
    ws,
    1,
    "Materiales utilizados en órdenes",
    vm.subtitulo,
    `Generado por: ${vm.generado_por}   |   ${vm.generado_en}   |   Período: ${vm.periodo}`,
  );

  const headers = ["Código", "Material", "Cantidad"];
  ws.addRow(headers);
  const hRow = ws.getRow(fila);
  hRow.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  ws.getRow(fila).height = 18;
  fila++;

  const primeraFilaDatos = fila;
  for (const mat of vm.materiales) {
    ws.addRow([mat.codigo ?? "—", mat.nombre, mat.cantidad]);
    const r = ws.getRow(fila);
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
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
  ws.addRow(["TOTAL", "", `=SUM(C${primeraFilaDatos}:C${ultima})`]);
  const tRow = ws.getRow(fila);
  tRow.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: TEXTO_ARG } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES_REPORTE.primarySuave.replace("#", "") },
    };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  tRow.getCell(3).numFmt = '#,##0.00';
  tRow.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, [20, 40, 12]);
}

/** Hoja "Técnicos": resumen por técnico con barras de cumplimiento. */
function hojaTecnicos(wb: WorkbookType, vm: ReporteOrdenesVM): void {
  const ws = wb.addWorksheet("Técnicos");
  let fila = cabeceraMarca(
    ws,
    1,
    "Cumplimiento por técnico",
    vm.subtitulo,
    `Generado por: ${vm.generado_por}   |   ${vm.generado_en}   |   Período: ${vm.periodo}`,
  );

  const headers = [
    "Técnico",
    "Órdenes",
    "Finalizadas",
    "En proceso",
    "Pendientes",
    "Canceladas",
    "Cumplimiento",
    "Monto total",
    "Días promedio",
  ];

  ws.addRow(headers);
  const hRow = ws.getRow(fila);
  hRow.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  ws.getRow(fila).height = 18;
  fila++;

  const primeraFilaDatos = fila;
  for (const tec of vm.tecnicos) {
    const cumpl = tec.cumplimiento;
    const tono = cumpl >= 80 ? "success" : cumpl >= 50 ? "warning" : "danger";
    ws.addRow([
      tec.tecnico,
      tec.ordenes,
      tec.finalizadas,
      tec.en_proceso,
      tec.pendientes,
      tec.canceladas,
      `${tec.cumplimiento}%`,
      tec.monto_total,
      tec.dias_promedio ?? 0,
    ]);
    const r = ws.getRow(fila);
    r.getCell(1).font = { bold: true, color: { argb: TEXTO_ARG } };
    r.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(7).font = { bold: true, color: { argb: argb(tonoTexto(tono)) } };
    r.getCell(7).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(TONOS[tono].fondo) },
    };
    r.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(8).numFmt = '#,##0.00';
    r.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(9).numFmt = '0.0';
    r.getCell(9).alignment = { horizontal: "center", vertical: "middle" };
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
  try {
    ws.addConditionalFormatting({
      ref: `G${primeraFilaDatos}:G${ultima}`,
      rules: [
        {
          type: "dataBar",
          priority: 1,

          showValue: true,
          minLength: 0,
          maxLength: 100,
        },
      ],
    });
  } catch {
    // Conditional formatting opcional
  }

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, [26, 10, 12, 11, 11, 11, 13, 14, 12]);
}

/** Hoja "Clientes": resumen por cliente. */
function hojaClientes(wb: WorkbookType, vm: ReporteOrdenesVM): void {
  const ws = wb.addWorksheet("Clientes");
  let fila = cabeceraMarca(
    ws,
    1,
    "Órdenes por cliente",
    vm.subtitulo,
    `Generado por: ${vm.generado_por}   |   ${vm.generado_en}   |   Período: ${vm.periodo}`,
  );

  const headers = ["Cliente", "Órdenes", "Finalizadas", "Cumplimiento", "Monto total", "Ticket promedio"];

  ws.addRow(headers);
  const hRow = ws.getRow(fila);
  hRow.eachCell((c: any) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_ARG } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = {
      top: { style: "thin", color: { argb: BORDER_ARG } },
      bottom: { style: "thin", color: { argb: BORDER_ARG } },
      left: { style: "thin", color: { argb: BORDER_ARG } },
      right: { style: "thin", color: { argb: BORDER_ARG } },
    };
  });
  ws.getRow(fila).height = 18;
  fila++;

  const primeraFilaDatos = fila;
  for (const cli of vm.clientes) {
    const cumpl = cli.cumplimiento;
    const tono = cumpl >= 80 ? "success" : cumpl >= 50 ? "warning" : "danger";
    ws.addRow([
      cli.cliente,
      cli.ordenes,
      cli.finalizadas,
      `${cli.cumplimiento}%`,
      cli.monto_total,
      cli.ticket_promedio,
    ]);
    const r = ws.getRow(fila);
    r.getCell(1).font = { bold: true, color: { argb: TEXTO_ARG } };
    r.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(4).font = { bold: true, color: { argb: argb(tonoTexto(tono)) } };
    r.getCell(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(TONOS[tono].fondo) },
    };
    r.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(5).numFmt = '#,##0.00';
    r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(6).numFmt = '#,##0.00';
    r.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
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
  try {
    ws.addConditionalFormatting({
      ref: `D${primeraFilaDatos}:D${ultima}`,
      rules: [
        {
          type: "dataBar",
          priority: 1,

          showValue: true,
          minLength: 0,
          maxLength: 100,
        },
      ],
    });
  } catch {
    // Conditional formatting opcional
  }

  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws.headerFooter.oddFooter = "&CPágina &P de &N";

  anchoColumnas(ws, [34, 10, 12, 13, 14, 14]);
}

/**
 * Genera el buffer XLSX del reporte de órdenes con 5 hojas.
 */
export async function generarExcelOrdenes(vm: ReporteOrdenesVM): Promise<{
  buffer: Buffer;
  nombreArchivo: string;
}> {
  const wb = new Workbook();
  wb.creator = "Sistema DYD";
  wb.lastModifiedBy = vm.generado_por;
  wb.created = new Date();
  wb.modified = new Date();

  hojaResumen(wb, vm);
  hojaDetalle(wb, vm);
  hojaMateriales(wb, vm);
  hojaTecnicos(wb, vm);
  hojaClientes(wb, vm);

  const buffer = await wb.xlsx.writeBuffer();
  const desde = vm.periodo.split(" — ")[0].replace(/\//g, "-");
  const hasta = vm.periodo.split(" — ")[1].replace(/\//g, "-");
  const nombreArchivo = `ordenes_todos_${desde}_${hasta}.xlsx`;

  return { buffer: Buffer.from(buffer), nombreArchivo };
}
