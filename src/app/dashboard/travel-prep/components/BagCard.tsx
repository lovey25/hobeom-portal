import React from "react";
import { BagStats } from "@/types";
import { text, badge, cn } from "@/styles/design-system";

interface BagCardProps {
  stats: BagStats;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

export function BagCard({ stats, isSelected, onClick, showDetails = false }: BagCardProps) {
  const { bag, totalWeight, saturation } = stats;
  const safeTotalWeight = totalWeight ?? 0;
  const safeSaturation = saturation ?? 0;
  const isOverloaded = safeSaturation >= 100;

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-blue-300"}
        ${isOverloaded ? "bg-red-50" : ""}
      `}
    >
      {/* 가방 이름 및 무게 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={text.cardTitle}>{bag.name}</h3>
        <span className={cn("text-sm font-medium", isOverloaded ? "text-red-600" : "text-gray-600")}>
          {(safeTotalWeight / 1000).toFixed(2)}kg
        </span>
      </div>

      {/* 포화도 바 */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverloaded ? "bg-red-500" : safeSaturation > 80 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(safeSaturation, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={text.hint}>포화도</span>
          <span className={cn(isOverloaded ? "text-red-600 font-semibold" : "text-gray-600")}>
            {safeSaturation.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 상세 정보 (선택적) */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className={cn("flex items-center justify-between", text.hint)}>
            <div>
              크기: {bag.width}×{bag.height}×{bag.depth}cm
            </div>
            <div>
              준비 완료: {stats.items.filter((item) => item.isPrepared).length}/{stats.items.length}
            </div>
          </div>
        </div>
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      )}
    </div>
  );
}
