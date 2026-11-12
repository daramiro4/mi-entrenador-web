"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const subscribeNoop = () => () => {};

/**
 * Hoja de detalle: panel lateral en pantallas anchas y hoja inferior en móvil, en un portal a <body> (no la tapa nada).
 * Cierra con Escape o tocando fuera; devuelve el foco al elemento que la abrió.
 */
export function ExerciseSheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const panel = useRef<HTMLDivElement | null>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-stretch sm:justify-end" onClick={onClose} role="presentation">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-[18px] border border-separator bg-bg p-4 outline-none sm:max-h-none sm:w-[min(640px,100%)] sm:rounded-none sm:rounded-l-[18px] sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="sticky top-0 z-10 -mb-2 ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-label hover:brightness-110"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
