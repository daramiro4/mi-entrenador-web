import type { TextareaHTMLAttributes } from "react";

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-steel border border-fog/30 rounded-sm px-4 py-2.5 text-paper font-sans placeholder:text-fog/50 focus:outline-none focus:border-volt transition-colors min-h-28 resize-y ${props.className ?? ""}`}
    />
  );
}
