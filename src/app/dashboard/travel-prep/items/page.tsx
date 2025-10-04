"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ItemCard } from "../components/ItemCard";
import { ItemFormModal, ItemFormData } from "../components/ItemFormModal";
import { cookieUtils } from "@/lib/cookies";
import { TravelItem } from "@/types";

function ItemsSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [items, setItems] = useState<TravelItem[]>([]);
  const [existingItemIds, setExistingItemIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<number | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);

  const tripId = searchParams.get("tripId");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = cookieUtils.getToken();

      // 전체 아이템 목록 가져오기
      const itemsRes = await fetch("/api/travel-prep/items");
      const itemsData = await itemsRes.json();

      // 현재 여행의 아이템 목록 가져오기
      if (tripId) {
        const tripItemsRes = await fetch(`/api/travel-prep/trip-items?tripId=${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tripItemsData = await tripItemsRes.json();

        if (tripItemsData.success) {
          const existingIds = new Set<string>(
            tripItemsData.data.filter((ti: any) => ti.itemType === "item").map((ti: any) => ti.itemId as string)
          );
          setExistingItemIds(existingIds);
        }
      }

      if (itemsData.success) {
        setItems(itemsData.data);
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

      // 배치 API로 한 번에 추가 (CSV 파일 한 번만 쓰기)
      const itemsToAdd = Array.from(selectedItems).map((itemId) => ({
        itemId,
        itemType: "item" as const,
      }));

      const response = await fetch("/api/travel-prep/trip-items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tripListId: tripId,
          items: itemsToAdd,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`${result.data.length}개의 아이템이 추가되었습니다.`);
        router.push("/dashboard/travel-prep");
      } else {
        alert(`아이템 추가 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("아이템 추가 실패:", error);
      alert("아이템 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const selectableItems = filteredItems.filter((item) => !existingItemIds.has(item.id));
    const newSelection = new Set(selectableItems.map((item) => item.id));
    setSelectedItems(newSelection);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  // 아이템 저장 (추가/수정)
  const handleSaveItem = async (data: ItemFormData) => {
    const token = cookieUtils.getToken();

    if (data.id) {
      // 수정
      const res = await fetch("/api/travel-prep/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await loadItems();
      }
    } else {
      // 추가
      const res = await fetch("/api/travel-prep/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await loadItems();
      }
    }
  };

  // 아이템 삭제
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("정말 이 준비물을 삭제하시겠습니까?")) return;

    const token = cookieUtils.getToken();
    const res = await fetch(`/api/travel-prep/items?itemId=${itemId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      await loadItems();
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

        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">준비물 선택</h1>
              <p className="text-gray-600 mt-2">여행에 필요한 준비물을 선택해주세요 (선택: {selectedItems.size}개)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                + 준비물 추가
              </button>
            </div>
          </div>

          {/* 필터 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">필터 및 선택</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  모두 선택
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  선택 해제
                </button>
              </div>
            </div>
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
          <div className="space-y-3 mb-40">
            {filteredItems.map((item) => {
              const isAlreadyAdded = existingItemIds.has(item.id);
              return (
                <div key={item.id} className="relative group">
                  {isAlreadyAdded && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                      이미 추가됨
                    </div>
                  )}
                  <div className={isAlreadyAdded ? "opacity-50" : ""}>
                    <ItemCard
                      item={item}
                      isSelectable={!isAlreadyAdded}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={() => !isAlreadyAdded && toggleItemSelection(item.id)}
                      showWeightInGrams={true}
                    />
                  </div>
                  {!isAlreadyAdded && (
                    <div className="absolute bottom-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      >
                        편집
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 플로팅 하단 UI */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* 통계 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
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
                      .toFixed(0)}
                    g
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

        {/* 아이템 폼 모달 */}
        <ItemFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          item={editingItem}
          categories={categories}
        />
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
