import pkg from "exceljs";
const { Workbook } = pkg;

/**
 * Convierte un array de objetos planos a un buffer Excel (.xlsx)
 */
export async function aExcel(data: unknown[]): Promise<Buffer> {
  const wb = new Workbook();
  const ws = wb.addWorksheet("Reporte");

  if (data.length === 0) {
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  // Headers
  const headers = Object.keys(data[0] as object);
  ws.addRow(headers);

  // Estilo header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Filas
  for (const row of data) {
    const values = headers.map((h) => {
      const val = (row as Record<string, unknown>)[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    });
    ws.addRow(values);
  }

  // Auto-ancho
  ws.columns.forEach((col) => {
    let maxLen = 12;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, 50);
  });

  const autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: data.length + 1, column: headers.length },
  };
  ws.autoFilter = autoFilter;

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * Convierte un objeto único (reporte resumen) a Excel con múltiples hojas
 */
export async function aExcelResumen(objeto: Record<string, unknown>): Promise<Buffer> {
  const wb = new Workbook();

  for (const [key, value] of Object.entries(objeto)) {
    const ws = wb.addWorksheet(key.substring(0, 31)); // Excel limita a 31 chars

    if (Array.isArray(value) && value.length > 0) {
      const headers = Object.keys(value[0] as object);
      ws.addRow(headers);
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };

      for (const item of value) {
        ws.addRow(headers.map((h) => {
          const val = (item as Record<string, unknown>)[h];
          if (val === null || val === undefined) return "";
          if (typeof val === "object") return JSON.stringify(val);
          return val;
        }));
      }
      const autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: value.length + 1, column: headers.length },
      };
      ws.autoFilter = autoFilter;
    } else if (typeof value === "object" && value !== null) {
      ws.addRow(["Campo", "Valor"]);
      ws.getRow(1).font = { bold: true };
      for (const [k, v] of Object.entries(value)) {
        ws.addRow([k, v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : v]);
      }
    } else {
      ws.addRow([key, value === null || value === undefined ? "" : value]);
    }

    // Auto-ancho
    ws.columns.forEach((col) => {
      let maxLen = 12;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 50);
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}