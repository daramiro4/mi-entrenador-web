import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const BUTTON_VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ember text-paper hover:bg-ember/90",
  secondary: "border border-fog/30 text-paper hover:border-fog/60 bg-transparent",
  ghost: "text-fog hover:text-paper bg-transparent",
  danger: "border border-fatiga/50 text-fatiga hover:bg-fatiga/10 bg-transparent",
};

const BUTTON_BASE_CLASSES =
  "px-5 py-2.5 rounded-sm font-sans font-semibold text-sm tracking-wide transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer inline-block";

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
