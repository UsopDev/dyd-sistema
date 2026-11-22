interface Props {
  /** Valor actual. */
  valor: number;
  /** Valor máximo de la escala (normalmente 100). */
  maximo?: number;
  /** Color del arco de progreso. */
  color: string;
  /** Texto bajo la cifra, por ejemplo "del total". */
  pie: string;
  /** Texto de la etiqueta superior. */
  titulo?: string;
  /** Texto opcional en una píldora, como "12 días". */
  insignia?: string;
  /** Ancho máximo del gauge en píxeles. */
  ancho?: number;
}

/**
 * Gauge semicircular dibujado con SVG propio.
 *
 * Se evita el Pie de Recharts porque su radio depende del tamaño del contenedor
 * y el centro no queda alineado con el texto: aquí el arco y la cifra comparten
 * exactamente el mismo centro.
 */
export default function MedidorGauge({
  valor,
  maximo = 100,
  color,
  pie,
  titulo,
  insignia,
  ancho = 180,
}: Props) {
  const acotado = Math.max(0, Math.min(valor, maximo));
  const porcentaje = maximo === 0 ? 0 : (acotado / maximo) * 100;

  // Geometría del arco: 180 grados (semicírculo) trazado en un viewBox cuadrado.
  const radio = 80;
  const grosor = 16;
  const centroX = 100;
  const centroY = 90;
  const longitud = Math.PI * radio;
  const avance = (porcentaje / 100) * longitud;

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {titulo && <p className="etiqueta-micro mb-1 w-full truncate text-center">{titulo}</p>}

      <div className="w-full" style={{ maxWidth: `${ancho}px` }}>
        <svg
          viewBox="0 0 200 112"
          className="w-full"
          role="img"
          aria-label={`${porcentaje.toFixed(1)} por ciento`}
        >
          {/* Pista de fondo */}
          <path
            d={`M ${centroX - radio} ${centroY} A ${radio} ${radio} 0 0 1 ${centroX + radio} ${centroY}`}
            fill="none"
            stroke="var(--color-grafico-pista)"
            strokeWidth={grosor}
            strokeLinecap="round"
          />
          {/* Progreso */}
          {acotado > 0 && (
            <path
              d={`M ${centroX - radio} ${centroY} A ${radio} ${radio} 0 0 1 ${centroX + radio} ${centroY}`}
              fill="none"
              stroke={color}
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeDasharray={`${avance} ${longitud}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          )}
          {/* Cifra centrada sobre la base del arco */}
          <text
            x={centroX}
            y={centroY - 12}
            textAnchor="middle"
            className="tabular"
            fontSize="26"
            fontWeight="700"
            fill="#1e293b"
          >
            {porcentaje.toFixed(1)}%
          </text>
          <text x={centroX} y={centroY + 6} textAnchor="middle" fontSize="11" fill="#64748b">
            {pie}
          </text>
        </svg>
      </div>

      {insignia && (
        <div className="mt-1 flex justify-center">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {insignia}
          </span>
        </div>
      )}
    </div>
  );
}
