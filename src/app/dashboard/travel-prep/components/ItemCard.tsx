import React from "react";
import { TravelItem, Bag } from "@/types";

interface ItemCardProps {
  item: TravelItem;
  isPrepared?: boolean;
  bagName?: string;
  onTogglePrepared?: () => void;
  onChangeBag?: () => void;
  onRemove?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ItemCard({
  item,
  isPrepared,
  bagName,
  onTogglePrepared,
  onChangeBag,
  onRemove,
  isSelectable,
  isSelected,
  onSelect,
}: ItemCardProps) {
  const getImportanceColor = (importance: number) => {
    if (importance >= 5) return "text-red-600 bg-red-50";
    if (importance >= 4) return "text-orange-600 bg-orange-50";
    if (importance >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getImportanceText = (importance: number) => {
    if (importance >= 5) return "매우중요";
    if (importance >= 4) return "중요";
    if (importance >= 3) return "보통";
    if (importance >= 2) return "낮음";
    return "선택";
  };

  return (
    <div
      className={`
        relative p-4 bg-white rounded-lg border transition-all duration-200
        ${isPrepared ? "border-green-300 bg-green-50" : "border-gray-200"}
        ${isSelectable ? "cursor-pointer hover:border-blue-300" : ""}
        ${isSelected ? "border-blue-500 shadow-md" : ""}
      `}
      onClick={isSelectable ? onSelect : undefined}
    >
      <div className="flex items-start justify-between">
        {/* 아이템 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getImportanceColor(item.importance)}`}>
              {getImportanceText(item.importance)}
            </span>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>
              크기: {item.width}×{item.height}×{item.depth}cm | 무게: {item.weight}kg
            </div>
            <div>분류: {item.category}</div>
            {bagName && <div className="text-blue-600 font-medium">가방: {bagName}</div>}
          </div>
        </div>

        {/* 액션 버튼 */}
        {!isSelectable && (
          <div className="flex flex-col gap-1 ml-2">
            {onTogglePrepared && (
              <button
                onClick={onTogglePrepared}
                className={`
                  px-3 py-1 rounded text-xs font-medium transition-colors
                  ${
                    isPrepared
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }
                `}
              >
                {isPrepared ? "✓ 완료" : "준비중"}
              </button>
            )}
            {onChangeBag && (
              <button
                onClick={onChangeBag}
                className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                가방변경
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        )}

        {/* 선택 표시 */}
        {isSelectable && isSelected && (
          <div className="ml-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
