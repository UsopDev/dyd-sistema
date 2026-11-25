import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ErrorState, TableSkeleton } from "./states";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  footer?: ReactNode;
  minWidth?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  error,
  onRetry,
  onRowClick,
  emptyTitle,
  emptyDescription,
  skeletonRows = 6,
  footer,
  minWidth = "860px",
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState mensaje={error} onRetry={onRetry} />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth }}
        >
          <thead>
            <tr className="bg-white/60">
              {columns.map((columna) => (
                <th
                  key={columna.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400",
                    columna.headerClassName,
                  )}
                >
                  {columna.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columnas={columns.length} filas={skeletonRows} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      {emptyTitle ?? "Sin resultados"}
                    </p>
                    <p className="max-w-sm text-xs text-slate-500">
                      {emptyDescription ??
                        "Probá ajustar los filtros o crear un registro nuevo."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((fila, indice) => (
                <tr
                  key={getRowKey(fila, indice)}
                  onClick={onRowClick ? () => onRowClick(fila) : undefined}
                  className={cn(
                    "border-t border-slate-100 align-middle transition-colors",
                    onRowClick && "cursor-pointer hover:bg-blue-50/40",
                  )}
                >
                  {columns.map((columna) => (
                    <td
                      key={columna.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3.5 text-slate-700",
                        columna.className,
                      )}
                    >
                      {columna.cell(fila)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  );
}
