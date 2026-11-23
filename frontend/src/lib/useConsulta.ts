import { useEffect, useState } from "react";
import { api } from "./api";

interface Estado<T> {
  clave: string;
  datos?: T;
  error?: string;
}

/**
 * Hook para consultas GET con soporte de filtros.
 *
 * @param baseRuta - Ruta base del endpoint (ej: "/solicitudes")
 * @param filtros - Objeto con parámetros de query (se omiten undefined/empty)
 * @param recarga - Contador para forzar recarga manual
 */
export function useConsulta<T>(
  baseRuta: string,
  filtros: Record<string, string | number | boolean | undefined> = {},
  recarga = 0,
) {
  const query = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });
  const ruta = query.toString() ? `${baseRuta}?${query.toString()}` : baseRuta;
  const clave = `${ruta}|${recarga}`;

  const [estado, setEstado] = useState<Estado<T> | null>(null);

  useEffect(() => {
    let activo = true;

    api<T>(ruta)
      .then((datos) => {
        if (activo) setEstado({ clave, datos });
      })
      .catch((e: Error) => {
        if (activo) setEstado({ clave, error: e.message });
      });

    return () => {
      activo = false;
    };
  }, [ruta, clave]);

  const actual = estado?.clave === clave ? estado : null;
  return { datos: actual?.datos, error: actual?.error, cargando: actual === null };
}