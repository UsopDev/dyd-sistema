import { prisma } from "../../lib/prisma.js";
import { nombreUsuario } from "./reporteOrdenes.controller.js";
import { construirReporteOrdenes } from "./reportData.service.js";
import { generarExcelOrdenes } from "./excelReport.service.js";
import { generarPdfOrdenes } from "./pdfReport.service.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "reportes-ejemplo");
mkdirSync(OUT, { recursive: true });

const desde = "2026-01-01";
const hasta = "2026-11-30";

const filtros = {
  fecha_desde: desde,
  fecha_hasta: hasta,
};

const generadoPor = await nombreUsuario(
  "00000000-0000-0000-0000-000000000001",
);

const { vm } = await construirReporteOrdenes(generadoPor, filtros);

const { buffer: xlsx, nombreArchivo: nombreXlsx } = await generarExcelOrdenes(vm);
writeFileSync(join(OUT, nombreXlsx), xlsx);

const { buffer: pdf, nombreArchivo: nombrePdf } = await generarPdfOrdenes(vm);
writeFileSync(join(OUT, nombrePdf), pdf);

console.log("✅ Reporte generado:");
console.log(`  Excel: ${join(OUT, nombreXlsx)}`);
console.log(`  PDF:   ${join(OUT, nombrePdf)}`);
console.log(`  Órdenes: ${vm.filas.length}`);
console.log(`  Monto total: ${vm.totales.monto_total}`);
console.log(
  `  Cumplimiento: ${vm.kpis.find((k: { etiqueta: string; valor: string }) => k.etiqueta === "% Cumplimiento")?.valor}`,
);

await prisma.$disconnect();
