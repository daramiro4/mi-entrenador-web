import type { InputHTMLAttributes } from "react";

type BaseProps = InputHTMLAttributes<HTMLInputElement>;

const BASE_CLASSES =
  "w-full bg-steel border border-fog/30 rounded-sm px-4 py-2.5 text-paper placeholder:text-fog/50 focus:outline-none focus:border-volt transition-colors";

export function TextInput(props: BaseProps) {
  return <input {...props} className={`${BASE_CLASSES} font-sans ${props.className ?? ""}`} />;
}

export function NumberInput(props: BaseProps) {
  return (
    <input
      {...props}
      type="number"
      inputMode="decimal"
      className={`${BASE_CLASSES} font-mono ${props.className ?? ""}`}
    />
  );
}

export function DateInput(props: BaseProps) {
  return (
    <input
      {...props}
      type="date"
      className={`${BASE_CLASSES} font-sans ${props.className ?? ""}`}
    />
  );
}
