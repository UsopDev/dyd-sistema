export default function Paginacion({
  pagina,
  limite,
  total,
  alCambiar,
}: {
  pagina: number;
  limite: number;
  total: number;
  alCambiar: (pagina: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / limite));

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        {total} registro(s) · Página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        <button
          disabled={pagina <= 1}
          onClick={() => alCambiar(pagina - 1)}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          disabled={pagina >= paginas}
          onClick={() => alCambiar(pagina + 1)}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
