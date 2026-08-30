export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`text-left px-4 py-3 rounded-sm border transition-colors ${
              selected
                ? "border-volt bg-volt/10"
                : "border-fog/25 bg-steel hover:border-fog/50"
            }`}
          >
            <span className="block font-sans font-medium text-paper">{opt.label}</span>
            {opt.description && (
              <span className="block text-sm text-fog mt-0.5">{opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
