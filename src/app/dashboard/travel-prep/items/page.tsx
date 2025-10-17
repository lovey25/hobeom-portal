"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ItemCard } from "../components/ItemCard";
import { ItemFormModal, ItemFormData } from "../components/ItemFormModal";
import { cookieUtils } from "@/lib/cookies";
import { TravelItem } from "@/types";

function ItemsSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();

  const [items, setItems] = useState<TravelItem[]>([]);
  const [existingItemIds, setExistingItemIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hideExistingItems, setHideExistingItems] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "category" | "importance">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);

  const tripId = searchParams.get("tripId");

  useEffect(() => {
    setPageTitle("물품 선택", "여행에 필요한 물품을 선택하세요");
  }, [setPageTitle]);

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
  // 필터링된 아이템 (이미 추가됨 숨김만 적용)
  const filteredItems = items.filter((item) => {
    if (hideExistingItems && existingItemIds.has(item.id)) return false;
    return true;
  });

  // 그룹별로 아이템 정리
  const groupedItems: { [key: string]: TravelItem[] } = {};

  if (groupBy === "category") {
    filteredItems.forEach((item) => {
      const key = item.category || "기타";
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(item);
    });
  } else if (groupBy === "importance") {
    filteredItems.forEach((item) => {
      const importanceLabels: { [key: number]: string } = {
        5: "매우중요",
        4: "중요",
        3: "보통",
        2: "낮음",
        1: "선택",
      };
      const key = importanceLabels[item.importance] || "기타";
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(item);
    });
  }

  // groupBy 변경 시 모든 그룹을 접힌 상태로 초기화
  useEffect(() => {
    if (groupBy !== "none") {
      // 다음 렌더링에서 groupedItems가 계산된 후 실행
      const timer = setTimeout(() => {
        const allGroupKeys = Object.keys(groupedItems);
        if (allGroupKeys.length > 0) {
          setCollapsedGroups(new Set(allGroupKeys));
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [groupBy]);

  // 그룹 토글
  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  // 그룹 전체 선택/해제
  const toggleGroupSelection = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 그룹 접기/펴기 방지
    const groupItems = groupedItems[groupName] || [];
    const selectableItems = groupItems.filter((item) => !existingItemIds.has(item.id));
    const allSelected = selectableItems.every((item) => selectedItems.has(item.id));

    const newSelection = new Set(selectedItems);
    if (allSelected) {
      // 모두 선택되어 있으면 해제
      selectableItems.forEach((item) => newSelection.delete(item.id));
    } else {
      // 하나라도 선택 안되어 있으면 모두 선택
      selectableItems.forEach((item) => newSelection.add(item.id));
    }
    setSelectedItems(newSelection);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
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
        <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
          {/* 준비물 선택 상태 */}
          <div className="flex items-center justify-between mb-6">
            <div>
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

          {/* 정렬 및 선택 컨트롤 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">정렬 및 선택</h2>
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
                {/* 이미 추가된 아이템 숨기기 버튼 */}
                {existingItemIds.size > 0 && (
                  <button
                    onClick={() => setHideExistingItems(!hideExistingItems)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                      hideExistingItems
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {hideExistingItems ? "✓ 추가됨 숨김" : "추가됨 숨기기"}
                  </button>
                )}
              </div>
            </div>

            {/* 그룹화 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setGroupBy("none")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                    groupBy === "none" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  기본 정렬
                </button>
                <button
                  onClick={() => setGroupBy("category")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                    groupBy === "category" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  분류별 그룹
                </button>
                <button
                  onClick={() => setGroupBy("importance")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                    groupBy === "importance" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  중요도별 그룹
                </button>
              </div>

              {/* 전체 접기/펴기 버튼 */}
              {groupBy !== "none" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCollapsedGroups(new Set())}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    전체 펴기
                  </button>
                  <button
                    onClick={() => setCollapsedGroups(new Set(Object.keys(groupedItems)))}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    전체 접기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 아이템 리스트 */}
          <div className="space-y-3 mb-40">
            {groupBy === "none"
              ? // 기본 정렬 - 리스트 형태
                filteredItems.map((item) => {
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
                      {/* 편집/삭제 버튼 */}
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
                    </div>
                  );
                })
              : // 그룹별 정렬 - 아코디언 형태
                Object.keys(groupedItems)
                  .sort((a, b) => {
                    // 중요도별 그룹일 경우 중요도 순서대로 정렬
                    if (groupBy === "importance") {
                      const importanceOrder: { [key: string]: number } = {
                        매우중요: 1,
                        중요: 2,
                        보통: 3,
                        낮음: 4,
                        선택: 5,
                        기타: 6,
                      };
                      return (importanceOrder[a] || 999) - (importanceOrder[b] || 999);
                    }
                    // 그 외에는 알파벳순
                    return a.localeCompare(b);
                  })
                  .map((groupName) => {
                    const groupItems = groupedItems[groupName];
                    const isCollapsed = collapsedGroups.has(groupName);
                    const groupSelectedCount = groupItems.filter((item) => selectedItems.has(item.id)).length;

                    return (
                      <div key={groupName} className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                        {/* 그룹 헤더 */}
                        <div className="bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="w-full px-4 py-3 flex items-center justify-between">
                            <button onClick={() => toggleGroup(groupName)} className="flex items-center gap-3 flex-1">
                              <span className={`transform transition-transform ${isCollapsed ? "" : "rotate-90"}`}>
                                ▶
                              </span>
                              <h3 className="font-semibold text-gray-900">{groupName}</h3>
                              <span className="text-sm text-gray-500">
                                ({groupItems.length}개)
                                {groupSelectedCount > 0 && (
                                  <span className="ml-2 text-blue-600 font-medium">{groupSelectedCount}개 선택</span>
                                )}
                              </span>
                            </button>

                            {/* 그룹 전체 선택 버튼 */}
                            <button
                              onClick={(e) => toggleGroupSelection(groupName, e)}
                              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium ml-2"
                            >
                              {groupItems
                                .filter((item) => !existingItemIds.has(item.id))
                                .every((item) => selectedItems.has(item.id))
                                ? "선택 해제"
                                : "전체 선택"}
                            </button>
                          </div>
                        </div>

                        {/* 그룹 아이템들 */}
                        {!isCollapsed && (
                          <div className="p-3 space-y-2">
                            {groupItems.map((item) => {
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
                                  {/* 편집/삭제 버튼 */}
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
                                </div>
                              );
                            })}
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
          categories={Array.from(new Set(items.map((item) => item.category)))}
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
