import React from "react";
import { TripItemFilter } from "@/types";

interface FilterBarProps {
  filter: TripItemFilter;
  onFilterChange: (newFilter: TripItemFilter) => void;
  bags: Array<{ id: string; name: string }>;
  categories: string[];
}

export function FilterBar({ filter, onFilterChange, bags, categories }: FilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">필터</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 가방 필터 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">가방</label>
          <select
            value={filter.bagId || "all"}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                bagId: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="unassigned">미할당</option>
            {bags.map((bag) => (
              <option key={bag.id} value={bag.id}>
                {bag.name}
              </option>
            ))}
          </select>
        </div>

        {/* 중요도 필터 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">중요도</label>
          <select
            value={filter.importance || "all"}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                importance: e.target.value === "all" ? undefined : parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="5">매우중요 (5)</option>
            <option value="4">중요 (4)</option>
            <option value="3">보통 (3)</option>
            <option value="2">낮음 (2)</option>
            <option value="1">선택 (1)</option>
          </select>
        </div>

        {/* 분류 필터 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">분류</label>
          <select
            value={filter.category || "all"}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                category: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 준비 상태 필터 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">준비상태</label>
          <select
            value={filter.isPrepared === undefined ? "all" : filter.isPrepared ? "true" : "false"}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                isPrepared: e.target.value === "all" ? undefined : e.target.value === "true",
              })
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="true">준비완료</option>
            <option value="false">준비중</option>
          </select>
        </div>
      </div>

      {/* 필터 초기화 버튼 */}
      <button
        onClick={() =>
          onFilterChange({
            bagId: undefined,
            importance: undefined,
            category: undefined,
            isPrepared: undefined,
          })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        필터 초기화
      </button>
    </div>
  );
}
