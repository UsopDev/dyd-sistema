export function formatSoles(value: number | string): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PE").format(value);
}

export function formatCompactSoles(value: number): string {
  if (value >= 1000) {
    const miles = value / 1000;
    return `S/ ${miles >= 10 ? Math.round(miles) : miles.toFixed(1)}k`;
  }
  return `S/ ${value}`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatSolesDecimal(value: number | string): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatCantidad(value: number | string): string {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Fechas sin hora (`@db.Date`): la API las envía como medianoche UTC.
 * Se formatean en UTC para no mostrar el día anterior en zonas como Lima.
 */
export function formatFechaCalendario(iso: string | null | undefined): string {
  if (!iso) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

/** Convierte "2026-06" o un ISO a "Junio 2026". */
export function formatMesClave(clave: string | null | undefined): string {
  if (!clave) return "—";

  const [anio, mes] = clave.split("-");
  const indice = Number(mes) - 1;

  if (!anio || !MESES[indice]) return clave;

  return `${MESES[indice]} ${anio}`;
}

/** Convierte "2026-06" o un ISO a "Jun". */
export function formatMesCorto(clave: string | null | undefined): string {
  if (!clave) return "—";

  const [anio, mes] = clave.split("-");
  const indice = Number(mes) - 1;

  if (!anio || !MESES[indice]) return clave;

  return MESES[indice].slice(0, 3);
}

export function fechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function hoyISO(): string {
  return fechaISO(new Date());
}

/** Primer día del mes, `mesesAtras` meses atrás. */
export function inicioMesAtras(mesesAtras: number): string {
  const hoy = new Date();
  return fechaISO(new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1));
}
