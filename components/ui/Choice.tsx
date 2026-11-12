"use client";

import { Check } from "lucide-react";

/** Selección única (role=radio) y múltiple (role=checkbox) en forma de píldoras ≥ 44 px. */
export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
}

const base =
  "min-h-11 rounded-full px-4 text-sm font-medium transition cursor-pointer inline-flex items-center justify-center";

export function SingleChoice<T extends string | number>({
  name, options, value, onChange,
}: { name: string; options: ChoiceOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`${base} ${on ? "bg-accent text-on-accent" : "bg-fill text-label"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoice<T extends string>({
  name, options, values, onChange,
}: { name: string; options: ChoiceOption<T>[]; values: T[]; onChange: (v: T[]) => void }) {
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onChange(on ? values.filter((v) => v !== o.value) : [...values, o.value])}
            className={`${base} ${on ? "bg-accent text-on-accent" : "bg-fill text-label"}`}
          >
            {on && <Check size={16} strokeWidth={2.5} aria-hidden="true" className="mr-1.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
