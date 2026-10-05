import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50";

export function Input({
  label,
  error,
  hint,
  className = "",
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={Boolean(error)}
        className={`${fieldClass} ${error ? "border-rose-400" : ""} ${className}`}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, hint, className = "", id, ...rest }, ref) {
    const fieldId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <textarea
          {...rest}
          ref={ref}
          id={fieldId}
          rows={rest.rows ?? 3}
          aria-invalid={Boolean(error)}
          className={`${fieldClass} resize-y ${error ? "border-rose-400" : ""} ${className}`}
        />
        {error ? <p className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
    );
  },
);
