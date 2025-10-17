import React from "react";
import { form, text, cn } from "@/styles/design-system";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className={text.label}>{label}</label>}
      <input className={cn(form.input, error && form.inputError, className)} {...props} />
      {error && <p className={form.errorMessage}>{error}</p>}
      {helperText && !error && <p className={text.hint}>{helperText}</p>}
    </div>
  );
}
