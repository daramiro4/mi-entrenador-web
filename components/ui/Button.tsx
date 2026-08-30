import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ember text-paper hover:bg-ember/90",
  secondary: "border border-fog/30 text-paper hover:border-fog/60 bg-transparent",
  ghost: "text-fog hover:text-paper bg-transparent",
  danger: "border border-fatiga/50 text-fatiga hover:bg-fatiga/10 bg-transparent",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-5 py-2.5 rounded-sm font-sans font-semibold text-sm tracking-wide transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
