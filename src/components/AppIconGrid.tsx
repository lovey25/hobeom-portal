import Link from "next/link";
import { AppIcon } from "@/types";

interface AppIconGridProps {
  apps: AppIcon[];
  title?: string;
  columns?: number;
  cardSize?: "small" | "medium" | "large";
}

export function AppIconGrid({ apps, title, columns = 3, cardSize = "medium" }: AppIconGridProps) {
  if (apps.length === 0) {
    return null;
  }

  // 반응형 그리드 클래스 결정
  const getGridClass = () => {
    // 모바일: 3열, 태블릿: 4열, 데스크톱: columns 파라미터 사용
    if (columns <= 3) {
      return "grid-cols-3 md:grid-cols-3";
    } else if (columns === 4) {
      return "grid-cols-3 md:grid-cols-4";
    } else if (columns === 5) {
      return "grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    } else {
      return "grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    }
  };

  // 카드 크기별 패딩 및 아이콘 크기 결정
  const getSizeClasses = () => {
    switch (cardSize) {
      case "small":
        return {
          padding: "p-3 sm:p-4",
          iconSize: "text-2xl sm:text-3xl",
          titleSize: "text-xs sm:text-sm",
          descSize: "text-xs",
        };
      case "large":
        return {
          padding: "p-5 sm:p-8",
          iconSize: "text-4xl sm:text-5xl",
          titleSize: "text-base sm:text-lg",
          descSize: "text-sm sm:text-base",
        };
      default: // medium
        return {
          padding: "p-4 sm:p-6",
          iconSize: "text-3xl sm:text-4xl",
          titleSize: "text-sm sm:text-base",
          descSize: "text-xs sm:text-sm",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="space-y-4">
      {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
      <div className={`grid gap-4 ${getGridClass()}`}>
        {apps.map((app) => (
          <Link
            key={app.id}
            href={app.href}
            className={`group block ${sizeClasses.padding} bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200`}
          >
            <div className="text-center space-y-2 sm:space-y-3">
              <div className={`${sizeClasses.iconSize} group-hover:scale-110 transition-transform duration-200`}>
                {app.icon}
              </div>
              <div>
                <h3 className={`font-medium text-gray-900 group-hover:text-blue-600 ${sizeClasses.titleSize}`}>
                  {app.name}
                </h3>
                <p className={`${sizeClasses.descSize} text-gray-500 mt-1`}>{app.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
