import type { ReactNode } from "react";

interface Props {
  titulo: string;
  /** Texto o acciones que van a la derecha del encabezado. */
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Quita el padding interno, para tarjetas que usan tablas a sangre. */
  sinPadding?: boolean;
}

/**
 * Chrome de tarjeta del dashboard: borde fino, radio suave y encabezado compacto.
 * El encabezado lleva el título en semibold y deja espacio para enlaces o botones.
 */
export default function Tarjeta({ titulo, acciones, children, className = "", sinPadding }: Props) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-[var(--radius-tarjeta)] border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <header className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <h3 className="truncate text-[13px] font-semibold text-slate-700">{titulo}</h3>
        {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
      </header>
      <div className={`flex flex-1 flex-col ${sinPadding ? "" : "p-4"}`}>{children}</div>
    </section>
  );
}
