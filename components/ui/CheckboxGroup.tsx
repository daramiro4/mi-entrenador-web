import type { SelectOption } from "./RadioGroup";

export function CheckboxGroup<T extends string>({
  options,
  values,
  onChange,
  name,
}: {
  options: SelectOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  name: string;
}) {
  function toggle(value: T) {
    onChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
    );
  }

  return (
    <div className="grid gap-2" role="group" aria-label={name}>
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(opt.value)}
            className={`flex items-start gap-3 text-left px-4 py-3 rounded-sm border transition-colors ${
              selected
                ? "border-volt bg-volt/10"
                : "border-fog/25 bg-steel hover:border-fog/50"
            }`}
          >
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border ${
                selected ? "border-volt bg-volt" : "border-fog/40"
              }`}
            />
            <span>
              <span className="block font-sans font-medium text-paper">{opt.label}</span>
              {opt.description && (
                <span className="block text-sm text-fog mt-0.5">{opt.description}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
