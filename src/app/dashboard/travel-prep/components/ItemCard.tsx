import React from "react";
import { TravelItem } from "@/types";
import { text, badge, button, cn } from "@/styles/design-system";

interface ItemCardProps {
  item: TravelItem;
  isPrepared?: boolean;
  bagName?: string;
  quantity?: number;
  onTogglePrepared?: () => void;
  onChangeBag?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onQuantityChange?: (newQuantity: number) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  showWeightInGrams?: boolean; // true면 g 단위로 표시, false면 kg 단위로 표시
}

export function ItemCard({
  item,
  isPrepared,
  bagName,
  quantity = 1,
  onTogglePrepared,
  onChangeBag,
  onRemove,
  onEdit,
  onQuantityChange,
  isSelectable,
  isSelected,
  onSelect,
  showWeightInGrams = false,
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

  // 클릭 핸들러 결정 (onSelect가 있으면 우선, 없으면 onChangeBag)
  const handleClick = onSelect || onChangeBag;

  return (
    <div
      className={`
        relative p-4 bg-white rounded-lg border transition-all duration-200
        ${isPrepared ? "border-green-300 bg-green-50" : "border-gray-200"}
        ${handleClick ? "cursor-pointer hover:border-blue-300 hover:shadow-md" : ""}
        ${isSelected ? "border-blue-500 bg-blue-50 shadow-md" : ""}
      `}
      onClick={
        handleClick
          ? (e) => {
              // 버튼 클릭이 아닌 경우에만 선택 토글
              if (!(e.target as HTMLElement).closest("button")) {
                handleClick();
              }
            }
          : undefined
      }
    >
      {/* 선택 표시 체크박스 */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
        </div>
      )}

      <div className="flex items-stretch justify-between gap-3">
        {/* 아이템 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className={text.cardTitle}>{item.name}</h4>
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getImportanceColor(item.importance))}>
              {getImportanceText(item.importance)}
            </span>
          </div>

          <div className={cn(text.hint, "space-y-1")}>
            <div>
              크기: {item.width}×{item.height}×{item.depth}cm | 무게:{" "}
              {showWeightInGrams ? `${item.weight}g` : `${(item.weight / 1000).toFixed(2)}kg`}
              {quantity > 1 && (
                <span className="ml-2 text-blue-600 font-medium">
                  (총{" "}
                  {showWeightInGrams
                    ? `${item.weight * quantity}g`
                    : `${((item.weight * quantity) / 1000).toFixed(2)}kg`}
                  )
                </span>
              )}
            </div>
            <div>분류: {item.category}</div>
            {bagName && <div className="text-blue-600 font-medium">가방: {bagName}</div>}
          </div>
        </div>

        {/* 액션 버튼 영역 - 세로 배치 */}
        {!isSelectable && (
          <div className="flex items-stretch gap-2 flex-shrink-0">
            {/* 수량 조절 */}
            {onQuantityChange && (
              <div className="flex flex-col gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuantityChange(quantity + 1);
                  }}
                  className="flex-1 w-12 flex items-center justify-center bg-white text-gray-700 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors shadow-sm font-bold text-lg"
                >
                  +
                </button>
                <span className="px-2 text-base font-semibold text-gray-900 text-center min-w-[3rem]">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quantity > 1) onQuantityChange(quantity - 1);
                  }}
                  className="flex-1 w-12 flex items-center justify-center bg-white text-gray-700 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-bold text-lg"
                  disabled={quantity <= 1}
                >
                  -
                </button>
              </div>
            )}

            {/* 상태/액션 버튼 세로 배치 */}
            <div className="flex flex-col gap-1">
              {/* 준비 상태 토글 */}
              {onTogglePrepared && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePrepared();
                  }}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap
                    ${
                      isPrepared
                        ? "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400"
                    }
                  `}
                >
                  {isPrepared ? "✓ 완료" : "준비중"}
                </button>
              )}

              {/* 수정 버튼 */}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 transition-colors shadow-sm whitespace-nowrap"
                >
                  수정
                </button>
              )}

              {/* 삭제 버튼 */}
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 transition-colors shadow-sm whitespace-nowrap"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
