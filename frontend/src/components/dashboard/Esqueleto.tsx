interface Props {
  /** Alto del bloque en píxeles. */
  alto?: number;
  className?: string;
}

/** Bloque gris pulsante que ocupa el lugar del contenido mientras carga. */
export default function Esqueleto({ alto = 16, className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200/70 ${className}`}
      style={{ height: `${alto}px` }}
    />
  );
}
