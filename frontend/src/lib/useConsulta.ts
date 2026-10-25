import { useEffect, useState } from "react";
import { api } from "./api";

interface Estado<T> {
  clave: string;
  datos?: T;
  error?: string;
}

// Consulta GET que se repite cuando cambia la ruta o el contador de recarga.
// "cargando" se deduce de la clave: así no se llama a setState de forma síncrona en el efecto.
export function useConsulta<T>(ruta: string, recarga = 0) {
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
