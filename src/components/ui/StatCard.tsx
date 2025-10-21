import React from "react";
import { cn, card, colors, text } from "@/styles/design-system";

interface StatCardProps {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "purple" | "pink" | "yellow";
  icon?: string;
  className?: string;
}

export function StatCard({ label, value, color = "blue", icon, className = "" }: StatCardProps) {
  const colorClasses = colors.stat[color];

  return (
    <div className={cn(card.base, card.padding, colorClasses.bg, colorClasses.border, "text-center", className)}>
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <div className={cn(card.statValue, colorClasses.text)}>{value}</div>
      <div className={cn(card.statLabel, text.tertiary)}>{label}</div>
    </div>
  );
}
