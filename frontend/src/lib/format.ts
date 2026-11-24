export function formatSoles(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value);
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
