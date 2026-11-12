import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "volt";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const BUTTON_VARIANT_CLASSES: Record<Variant, string> = {
  // Primario: UNO por vista, pill Ember con texto Asphalt (nunca blanco: no llega a 4.5:1).
  primary: "bg-accent text-on-accent btn-primary-glow hover:brightness-105",
  secondary: "bg-surface-2 text-label hover:brightness-110",
  ghost: "text-label-2 hover:text-label bg-transparent",
  danger: "bg-danger/10 text-danger hover:bg-danger/15",
  // Acción técnica/de dato (ej. forzar una sincronización).
  volt: "bg-surface-2 text-label hover:brightness-110",
};

const BUTTON_BASE_CLASSES =
  "min-h-12 px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer inline-flex items-center justify-center";

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
