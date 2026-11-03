import { Sparkline } from "@/components/ui/Sparkline";

const WIDTH = 56;
const HEIGHT = 28;
/** Con menos puntos la línea es un trazo corto que no dice nada. */
export const MIN_POINTS = 4;

/**
 * Mini-tendencia (SVG propio, sin recharts) junto a un número. El contenedor mide
 * lo mismo que el viewBox para que el punto final no se deforme. Necesita ≥4 puntos.
 */
export function MetricSparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < MIN_POINTS) return null;
  return (
    <div className="shrink-0" style={{ width: WIDTH, height: HEIGHT }}>
      <Sparkline values={values} width={WIDTH} height={HEIGHT} label={label} />
    </div>
  );
}
