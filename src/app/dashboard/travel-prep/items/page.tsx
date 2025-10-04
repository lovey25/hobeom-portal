"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ItemCard } from "../components/ItemCard";
import { cookieUtils } from "@/lib/cookies";
import { TravelItem } from "@/types";

function ItemsSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [items, setItems] = useState<TravelItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<number | "all">("all");

  const tripId = searchParams.get("tripId");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await fetch("/api/travel-prep/items");
      const data = await res.json();

      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("준비물 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleAddItems = async () => {
    if (selectedItems.size === 0) {
      alert("최소 1개 이상의 아이템을 선택해주세요.");
      return;
    }

    if (!tripId) {
      alert("여행 ID가 없습니다.");
      return;
    }

    setIsSaving(true);

    try {
      const token = cookieUtils.getToken();

      // 선택된 아이템들을 여행에 추가
      const promises = Array.from(selectedItems).map((itemId) =>
        fetch("/api/travel-prep/trip-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tripListId: tripId,
            itemId: itemId,
            itemType: "item",
          }),
        })
      );

      await Promise.all(promises);
      router.push("/dashboard/travel-prep");
    } catch (error) {
      console.error("아이템 추가 실패:", error);
      alert("아이템 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 필터링된 아이템
  const filteredItems = items.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterImportance !== "all" && item.importance !== filterImportance) return false;
    return true;
  });

  // 카테고리 목록
  const categories = Array.from(new Set(items.map((item) => item.category)));

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <DashboardHeader />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">준비물 선택</h1>
            <p className="text-gray-600 mt-2">여행에 필요한 준비물을 선택해주세요 (선택: {selectedItems.size}개)</p>
          </div>

          {/* 필터 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 분류 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 중요도 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
                <select
                  value={filterImportance}
                  onChange={(e) => setFilterImportance(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="5">매우중요 (5)</option>
                  <option value="4">중요 (4)</option>
                  <option value="3">보통 (3)</option>
                  <option value="2">낮음 (2)</option>
                  <option value="1">선택 (1)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 아이템 리스트 */}
          <div className="space-y-3 mb-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelectable={true}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => toggleItemSelection(item.id)}
              />
            ))}
          </div>

          {/* 통계 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-800">
              <div className="flex justify-between mb-1">
                <span>선택된 아이템:</span>
                <span className="font-semibold">{selectedItems.size}개</span>
              </div>
              <div className="flex justify-between">
                <span>예상 무게:</span>
                <span className="font-semibold">
                  {items
                    .filter((item) => selectedItems.has(item.id))
                    .reduce((sum, item) => sum + item.weight, 0)
                    .toFixed(1)}
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/travel-prep")}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              onClick={handleAddItems}
              disabled={isSaving || selectedItems.size === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "추가 중..." : `아이템 추가 (${selectedItems.size})`}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ItemsSelectionPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">로딩 중...</p>
                </div>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      }
    >
      <ItemsSelectionContent />
    </Suspense>
  );
}
