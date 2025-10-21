import React from "react";
import { cn, form, text } from "@/styles/design-system";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Select({ label, error, helperText, className = "", children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className={text.label}>{label}</label>}
      <select className={cn(form.select, error && form.inputError, className)} {...props}>
        {children}
      </select>
      {error && <p className={form.errorMessage}>{error}</p>}
      {helperText && !error && <p className={text.hint}>{helperText}</p>}
    </div>
  );
}
