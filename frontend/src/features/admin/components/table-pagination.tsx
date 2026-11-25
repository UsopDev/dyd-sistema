import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

interface TablePaginationProps {
  pagina: number;
  limite: number;
  total: number;
  onPageChange: (pagina: number) => void;
  cargando?: boolean;
}

export function TablePagination({
  pagina,
  limite,
  total,
  onPageChange,
  cargando = false,
}: TablePaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        {total === 0
          ? "Sin registros"
          : `Mostrando ${formatNumber(desde)}–${formatNumber(hasta)} de ${formatNumber(total)}`}
      </p>

      <div className="flex items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500">
          Página {pagina} de {totalPaginas}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagina - 1)}
          disabled={pagina <= 1 || cargando}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pagina + 1)}
          disabled={pagina >= totalPaginas || cargando}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
