import React from "react";
import { cn, badge } from "@/styles/design-system";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  className?: string;
}

export function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  const variants = {
    blue: badge.blue,
    green: badge.green,
    red: badge.red,
    yellow: badge.yellow,
    purple: badge.purple,
    gray: badge.gray,
  };

  return <span className={cn(badge.base, variants[variant], className)}>{children}</span>;
}
