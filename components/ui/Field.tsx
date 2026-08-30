import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="block font-display text-xl uppercase tracking-wide text-paper leading-none">
        {label}
      </span>
      {children}
      {hint && <p className="text-sm text-fog">{hint}</p>}
    </div>
  );
}
