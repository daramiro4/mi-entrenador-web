/**
 * Ventana de una lista virtualizada de filas de altura fija (sin librerías): dado el scroll, calcula qué filas pintar.
 * Para 1.553 filas se pintan ~15-25 a la vez.
 */
export interface WindowInput {
  count: number;
  itemHeight: number;
  scrollTop: number;
  viewportHeight: number;
  /** Filas extra por encima y por debajo para que el scroll rápido no enseñe huecos. */
  overscan?: number;
}

export interface WindowResult {
  /** Primer índice a pintar (incluido). */
  start: number;
  /** Último índice a pintar (excluido). */
  end: number;
  /** Alto total del contenido (para el espaciador). */
  totalHeight: number;
  /** Desplazamiento vertical de la primera fila pintada. */
  offsetTop: number;
}

export function computeWindow({ count, itemHeight, scrollTop, viewportHeight, overscan = 6 }: WindowInput): WindowResult {
  const totalHeight = count * itemHeight;
  if (count === 0 || itemHeight <= 0) return { start: 0, end: 0, totalHeight, offsetTop: 0 };
  const maxScroll = Math.max(0, totalHeight - viewportHeight);
  const top = Math.min(Math.max(0, scrollTop), maxScroll);
  const first = Math.floor(top / itemHeight);
  const visible = Math.ceil(viewportHeight / itemHeight) + 1;
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, first + visible + overscan);
  return { start, end, totalHeight, offsetTop: start * itemHeight };
}

/** Scroll necesario para que la fila `index` quede visible (para mantener la selección con el teclado). */
export function scrollIntoView(index: number, itemHeight: number, scrollTop: number, viewportHeight: number): number {
  const top = index * itemHeight;
  const bottom = top + itemHeight;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight;
  return scrollTop;
}
