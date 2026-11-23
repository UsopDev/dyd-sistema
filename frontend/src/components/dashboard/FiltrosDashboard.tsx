import { useState, useEffect, type ChangeEvent } from "react";

interface FiltrosDashboard {
  fecha_recepcion_desde?: string;
  fecha_recepcion_hasta?: string;
  creado_en_desde?: string;
  creado_en_hasta?: string;
}

interface Props {
  /** Filtros actuales (controlados desde el padre). */
  valores: FiltrosDashboard;
  /** Callback cuando cambian los filtros. */
  onChange: (v: FiltrosDashboard) => void;
  /** Si se muestra el filtro de fechas de solicitudes. */
  mostrarSolicitudes?: boolean;
  /** Si se muestra el filtro de fechas de órdenes. */
  mostrarOrdenes?: boolean;
  /** Texto del botón de limpiar. */
  limpiarTexto?: string;
}

/**
 * Barra de filtros de fechas para el dashboard.
 * Se adapta a móvil (acordeón) y desktop (inline).
 */
export default function FiltrosDashboard({
  valores,
  onChange,
  mostrarSolicitudes = true,
  mostrarOrdenes = true,
  limpiarTexto = "Limpiar",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [locales, setLocales] = useState<FiltrosDashboard>(valores);

  // Sincroniza con props externas (ej. al limpiar desde fuera)
  useEffect(() => {
    setLocales(valores);
  }, [valores]);

  function handleChange(campo: keyof FiltrosDashboard, e: ChangeEvent<HTMLInputElement>) {
    const nuevo = { ...locales, [campo]: e.target.value || undefined };
    setLocales(nuevo);
    onChange(nuevo);
  }

  function limpiar() {
    const vacio: FiltrosDashboard = {};
    setLocales(vacio);
    onChange(vacio);
  }

  const hayFiltros = Object.values(locales).some((v) => v !== undefined && v !== "");

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-3">
      {/* Encabezado en móvil */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <h4 className="text-sm font-semibold text-slate-700">Filtros</h4>
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="text-xs text-marca-600 hover:underline"
        >
          {abierto ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      <div className={`${abierto || !abierto ? "" : "hidden"} md:block`} style={{ display: abierto || !abierto ? undefined : "none" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mostrarSolicitudes && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-500">Solicitudes desde</span>
                <input
                  type="date"
                  value={locales.fecha_recepcion_desde ?? ""}
                  onChange={(e) => handleChange("fecha_recepcion_desde", e)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-marca-500"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-500">Solicitudes hasta</span>
                <input
                  type="date"
                  value={locales.fecha_recepcion_hasta ?? ""}
                  onChange={(e) => handleChange("fecha_recepcion_hasta", e)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-marca-500"
                />
              </label>
            </>
          )}

          {mostrarOrdenes && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-500">Órdenes desde</span>
                <input
                  type="date"
                  value={locales.creado_en_desde ?? ""}
                  onChange={(e) => handleChange("creado_en_desde", e)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-marca-500"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-500">Órdenes hasta</span>
                <input
                  type="date"
                  value={locales.creado_en_hasta ?? ""}
                  onChange={(e) => handleChange("creado_en_hasta", e)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-marca-500"
                />
              </label>
            </>
          )}
        </div>

        {hayFiltros && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={limpiar}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              {limpiarTexto}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}