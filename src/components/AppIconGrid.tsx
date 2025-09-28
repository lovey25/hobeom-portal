import React from "react";
import Link from "next/link";
import { AppIcon } from "@/types";

interface AppIconGridProps {
  apps: AppIcon[];
  title?: string;
  columns?: number;
}

export function AppIconGrid({ apps, title, columns = 3 }: AppIconGridProps) {
  if (apps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(columns, apps.length)}, 1fr)` }}>
        {apps.map((app) => (
          <Link
            key={app.id}
            href={app.href}
            className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="text-center space-y-3">
              <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{app.icon}</div>
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{app.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{app.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
