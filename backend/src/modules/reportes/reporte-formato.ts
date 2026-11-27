/**
 * Formato de fechas, números y moneda para los reportes.
 *
 * La zona se fija explícitamente para que el resultado no dependa de la
 * configuración del servidor. Bolivia no aplica horario de verano: UTC-4 fijo.
 */
export const ZONA_HORARIA_REPORTE = "America/La_Paz";
export const MONEDA_REPORTE = "Bs";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const FMT_ENTERO = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 0,
});

const FMT_DECIMAL = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const FMT_MONEDA = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FMT_DIA = new Intl.DateTimeFormat("es-BO", {
  timeZone: ZONA_HORARIA_REPORTE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FMT_DIA_HORA = new Intl.DateTimeFormat("es-BO", {
  timeZone: ZONA_HORARIA_REPORTE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const FMT_PARTES = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA_REPORTE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function aFecha(valor: Date | string): Date | null {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esDiaISO(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

interface PartesDia {
  anio: number;
  mes: number;
  dia: number;
}

function partesEnZona(fecha: Date): PartesDia {
  const [anio, mes, dia] = FMT_PARTES.format(fecha).split("-").map(Number);
  return { anio, mes, dia };
}

function partesDeISO(iso: string): PartesDia {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return { anio, mes, dia };
}

/** Día actual en La Paz como `AAAA-MM-DD`. */
export function fechaISOEnZona(fecha = new Date()): string {
  return FMT_PARTES.format(fecha);
}

/** Primer y último día del mes actual en La Paz. */
export function rangoMesActual(): { desde: string; hasta: string } {
  const hoy = fechaISOEnZona();
  const [anio, mes] = hoy.split("-").map(Number);
  const mesTexto = String(mes).padStart(2, "0");
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return {
    desde: `${anio}-${mesTexto}-01`,
    hasta: `${anio}-${mesTexto}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

/** `27/11/2026`. Acepta un `Date` (se convierte a La Paz) o un `AAAA-MM-DD`. */
export function fechaCorta(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  if (typeof valor === "string" && esDiaISO(valor)) {
    const { anio, mes, dia } = partesDeISO(valor);
    return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
  }
  const fecha = aFecha(valor);
  if (!fecha) return "—";
  return FMT_DIA.format(fecha);
}

/** `27/11/2026 14:35`. */
export function fechaHoraCorta(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  const fecha = aFecha(valor);
  if (!fecha) return "—";
  return FMT_DIA_HORA.format(fecha);
}

/** `27 de noviembre de 2026`. */
export function fechaLarga(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  let partes: PartesDia | null = null;
  if (typeof valor === "string" && esDiaISO(valor)) {
    partes = partesDeISO(valor);
  } else {
    const fecha = aFecha(valor);
    partes = fecha ? partesEnZona(fecha) : null;
  }
  if (!partes) return "—";
  return `${partes.dia} de ${MESES[partes.mes - 1]} de ${partes.anio}`;
}

/** `01/11/2026 — 30/11/2026`, o un solo día si el rango es de un día. */
export function periodoEtiqueta(desde: string, hasta: string): string {
  if (desde === hasta) return fechaLarga(desde);
  return `${fechaCorta(desde)} — ${fechaCorta(hasta)}`;
}

export function numero(valor: number, decimales = 0): string {
  return decimales > 0 ? FMT_DECIMAL.format(valor) : FMT_ENTERO.format(valor);
}

export function porcentaje(valor: number): string {
  return `${FMT_DECIMAL.format(valor)}%`;
}

export function moneda(valor: number): string {
  return `${MONEDA_REPORTE} ${FMT_MONEDA.format(valor)}`;
}

export function dias(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${FMT_DECIMAL.format(valor)} d`;
}

/** Redondeo a la cantidad de decimales indicada, sin notación científica. */
export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

/** Convierte `AAAA-MM-DD` en el inicio del día en La Paz (UTC-4). */
export function inicioDiaLaPaz(iso: string): Date {
  return new Date(`${iso}T04:00:00.000Z`);
}

/** Convierte `AAAA-MM-DD` en el último milisegundo del día en La Paz. */
export function finDiaLaPaz(iso: string): Date {
  return new Date(new Date(`${iso}T04:00:00.000Z`).getTime() + 86_400_000 - 1);
}

/** Texto seguro para nombres de archivo. */
export function slugArchivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
}
