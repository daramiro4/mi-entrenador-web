"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeWindow, scrollIntoView } from "@/lib/exercises/virtual-window";

/**
 * Lista virtualizada de filas de altura fija (sin librerías): solo se pintan las filas visibles más un margen.
 * Accesible como listbox: flechas, Inicio/Fin y Intro; `aria-setsize`/`aria-posinset` informan del total real.
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  label,
  getKey,
  renderRow,
  onSelect,
  activeKey,
  empty,
}: {
  items: T[];
  itemHeight: number;
  height: number;
  label: string;
  getKey: (item: T) => string;
  renderRow: (item: T, state: { active: boolean }) => React.ReactNode;
  onSelect: (item: T) => void;
  activeKey: string | null;
  empty: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const raf = useRef(0);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setScrollTop(box.current?.scrollTop ?? 0));
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // Al cambiar los resultados (nueva búsqueda), vuelve arriba.
  const firstKey = items.length > 0 ? getKey(items[0]) : "";
  const lastReset = useRef("");
  useEffect(() => {
    if (lastReset.current === firstKey) return;
    lastReset.current = firstKey;
    if (box.current) box.current.scrollTop = 0;
  }, [firstKey]);

  const win = computeWindow({ count: items.length, itemHeight, scrollTop, viewportHeight: height });
  const safeCursor = Math.min(cursor, Math.max(0, items.length - 1));

  const move = (next: number) => {
    const i = Math.min(items.length - 1, Math.max(0, next));
    setCursor(i);
    const el = box.current;
    if (el) {
      const target = scrollIntoView(i, itemHeight, el.scrollTop, height);
      if (target !== el.scrollTop) el.scrollTop = target;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); move(safeCursor + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(safeCursor - 1); }
    else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(items.length - 1); }
    else if (e.key === "PageDown") { e.preventDefault(); move(safeCursor + Math.floor(height / itemHeight)); }
    else if (e.key === "PageUp") { e.preventDefault(); move(safeCursor - Math.floor(height / itemHeight)); }
    else if (e.key === "Enter") { e.preventDefault(); onSelect(items[safeCursor]); }
  };

  if (items.length === 0) return <div style={{ minHeight: itemHeight * 2 }}>{empty}</div>;

  return (
    <div
      ref={box}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`opt-${getKey(items[safeCursor])}`}
      tabIndex={0}
      className="relative overflow-y-auto rounded-[18px] border border-separator bg-surface"
      style={{ height }}
    >
      <div style={{ height: win.totalHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: win.offsetTop, left: 0, right: 0 }}>
          {items.slice(win.start, win.end).map((item, i) => {
            const index = win.start + i;
            const key = getKey(item);
            return (
              <div
                key={key}
                id={`opt-${key}`}
                role="option"
                aria-selected={key === activeKey}
                aria-setsize={items.length}
                aria-posinset={index + 1}
                onClick={() => { setCursor(index); onSelect(item); }}
                style={{ height: itemHeight }}
                className={`cursor-pointer border-b border-separator hover:bg-surface-2 ${focused && index === safeCursor ? "bg-surface-2 outline outline-2 -outline-offset-2 outline-label" : ""}`}
              >
                {renderRow(item, { active: key === activeKey })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
