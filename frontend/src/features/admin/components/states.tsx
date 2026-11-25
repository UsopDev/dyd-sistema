import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ErrorState({
  mensaje = "No se pudieron cargar los datos.",
  onRetry,
  compacto = false,
}: {
  mensaje?: string;
  onRetry?: () => void;
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compacto ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Algo salió mal
        </p>
        <p className="mt-1 max-w-md text-xs text-slate-500">{mensaje}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  titulo = "Sin resultados",
  descripcion = "Probá ajustar los filtros o crear un registro nuevo.",
}: {
  titulo?: string;
  descripcion?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-700">{titulo}</p>
      <p className="max-w-sm text-xs text-slate-500">{descripcion}</p>
    </div>
  );
}

export function TableSkeleton({
  columnas,
  filas = 6,
}: {
  columnas: number;
  filas?: number;
}) {
  return (
    <>
      {Array.from({ length: filas }).map((_, indiceFila) => (
        <tr key={indiceFila} className="border-t border-slate-100">
          {Array.from({ length: columnas }).map((_, indiceColumna) => (
            <td key={indiceColumna} className="px-4 py-3.5">
              <Skeleton
                className={cn(
                  "h-4",
                  indiceColumna === 0 ? "w-32" : "w-full max-w-[140px]",
                  indiceColumna % 2 === 1 && "max-w-[90px]",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}
