import React from "react";
import { button, cn } from "@/styles/design-system";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: button.primary,
    secondary: button.secondary,
    danger: button.danger,
    ghost: button.ghost,
    base: button.base,
  };

  const sizes = {
    sm: button.small,
    md: button.medium,
    lg: button.large,
  };

  return (
    <button
      className={cn(button.base, variants[variant], sizes[size], disabled && button.disabled, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
