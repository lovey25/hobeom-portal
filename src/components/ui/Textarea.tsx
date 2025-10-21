import React from "react";
import { cn, form, text } from "@/styles/design-system";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ label, error, helperText, className = "", ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && <label className={text.label}>{label}</label>}
      <textarea className={cn(form.textarea, error && form.inputError, className)} {...props} />
      {error && <p className={form.errorMessage}>{error}</p>}
      {helperText && !error && <p className={text.hint}>{helperText}</p>}
    </div>
  );
}
