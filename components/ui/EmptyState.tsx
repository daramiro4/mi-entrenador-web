import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vacío: mismo cristal, icono de trazo, frase corta y acción opcional. */
export function EmptyState({ icon: Icon, text, children }: { icon: LucideIcon; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center text-label-2">
      <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm">{text}</p>
      {children}
    </div>
  );
}
