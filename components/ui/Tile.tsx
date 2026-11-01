import type { HTMLAttributes, ReactNode } from "react";

interface TileProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  /** Color (token CSS) del punto de la métrica. */
  dotColor?: string;
  children?: ReactNode;
}

/** Baldosa interna (surface-2, radio 18). Nunca anidar otra tarjeta dentro. */
export function Tile({ label, dotColor, className = "", children, ...props }: TileProps) {
  return (
    <div className={`tile ${className}`} {...props}>
      {label && (
        <p className="flex items-center gap-2 text-xs text-label-2">
          {dotColor && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: dotColor }}
            />
          )}
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
