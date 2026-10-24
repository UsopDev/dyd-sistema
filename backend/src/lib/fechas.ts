// Fechas de calendario (sin hora) como "AAAA-MM-DD", en la zona horaria del servidor.
export function hoyLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

// Convierte "AAAA-MM-DD" en una Date a medianoche UTC, que es como se manejan las columnas DATE.
export function aFecha(texto: string): Date {
  return new Date(`${texto}T00:00:00.000Z`);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha.getTime());
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}
