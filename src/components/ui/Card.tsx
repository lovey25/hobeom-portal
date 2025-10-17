import React from "react";
import { card, cn } from "@/styles/design-system";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
}

export function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  const paddingClasses = {
    sm: card.paddingSmall,
    md: card.padding,
    lg: card.paddingLarge,
    none: "",
  };

  return <div className={cn(card.base, paddingClasses[padding], hover && card.hover, className)}>{children}</div>;
}
