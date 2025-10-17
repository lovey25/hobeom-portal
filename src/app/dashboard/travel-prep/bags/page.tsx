"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { BagFormModal } from "../components/BagFormModal";
import { cookieUtils } from "@/lib/cookies";
import { Bag } from "@/types";

function BagsSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle } = usePageTitle();

  const [bags, setBags] = useState<Bag[]>([]);
  const [existingBagIds, setExistingBagIds] = useState<Set<string>>(new Set());
  const [selectedBags, setSelectedBags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBag, setEditingBag] = useState<Bag | null>(null);

  const tripId = searchParams.get("tripId");

  useEffect(() => {
    setPageTitle("가방 선택", "여행에 사용할 가방을 선택하세요");
  }, [setPageTitle]);

  useEffect(() => {
    loadBags();
  }, []);

  const loadBags = async () => {
    try {
      const token = cookieUtils.getToken();

      // 전체 가방 목록 가져오기
      const bagsRes = await fetch("/api/travel-prep/bags");
      const bagsData = await bagsRes.json();

      // 현재 여행의 가방 목록 가져오기
      if (tripId) {
        const tripItemsRes = await fetch(`/api/travel-prep/trip-items?tripId=${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tripItemsData = await tripItemsRes.json();

        if (tripItemsData.success) {
          const existingIds = new Set<string>(
            tripItemsData.data.filter((ti: any) => ti.itemType === "bag").map((ti: any) => ti.itemId)
          );
          setExistingBagIds(existingIds);
        }
      }

      if (bagsData.success) {
        setBags(bagsData.data);
      }
    } catch (error) {
      console.error("가방 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBagSelection = (bagId: string) => {
    const newSelection = new Set(selectedBags);
    if (newSelection.has(bagId)) {
      newSelection.delete(bagId);
    } else {
      newSelection.add(bagId);
    }
    setSelectedBags(newSelection);
  };

  const handleAddBags = async () => {
    if (selectedBags.size === 0) {
      alert("최소 1개 이상의 가방을 선택해주세요.");
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
      const bagsToAdd = Array.from(selectedBags).map((bagId) => ({
        itemId: bagId,
        itemType: "bag" as const,
      }));

      const response = await fetch("/api/travel-prep/trip-items/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tripListId: tripId,
          items: bagsToAdd,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`${result.data.length}개의 가방이 추가되었습니다.`);
        router.push("/dashboard/travel-prep");
      } else {
        alert(`가방 추가 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("가방 추가 실패:", error);
      alert("가방 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const selectableBags = bags.filter((bag) => !existingBagIds.has(bag.id));
    const newSelection = new Set(selectableBags.map((bag) => bag.id));
    setSelectedBags(newSelection);
  };

  const handleDeselectAll = () => {
    setSelectedBags(new Set());
  };

  const handleSaveBag = async (data: any) => {
    const token = cookieUtils.getToken();

    if (data.id) {
      // 수정
      const res = await fetch("/api/travel-prep/bags", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await loadBags();
        setEditingBag(null);
      }
    } else {
      // 추가
      const res = await fetch("/api/travel-prep/bags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await loadBags();
      }
    }
  };

  const handleDeleteBag = async (bagId: string) => {
    if (!confirm("이 가방을 삭제하시겠습니까?")) return;

    const token = cookieUtils.getToken();
    const res = await fetch(`/api/travel-prep/bags?id=${bagId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await loadBags();
    }
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 가방 선택 상태 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mt-2">여행에 사용할 가방을 선택해주세요 (선택: {selectedBags.size}개)</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                >
                  모두 선택
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  선택 해제
                </button>
                <button
                  onClick={() => {
                    setEditingBag(null);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <span className="text-xl">+</span>새 가방 추가
                </button>
              </div>
            </div>
          </div>

          {/* 가방 리스트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-32">
            {bags.map((bag) => {
              const isSelected = selectedBags.has(bag.id);
              const isAlreadyAdded = existingBagIds.has(bag.id);
              const volume = bag.width * bag.height * bag.depth;

              return (
                <div key={bag.id} className="relative group">
                  {isAlreadyAdded && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                      이미 추가됨
                    </div>
                  )}

                  {/* 편집/삭제 버튼 */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBag(bag);
                        setIsModalOpen(true);
                      }}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      편집
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBag(bag.id);
                      }}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>

                  <button
                    onClick={() => !isAlreadyAdded && toggleBagSelection(bag.id)}
                    disabled={isAlreadyAdded}
                    className={`
                      w-full p-6 bg-white rounded-lg border-2 transition-all text-left
                      ${isAlreadyAdded ? "opacity-50 cursor-not-allowed border-gray-200" : ""}
                      ${isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-blue-300"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">{bag.name}</h3>
                      {isSelected && !isAlreadyAdded && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        크기: {bag.width}×{bag.height}×{bag.depth}cm
                      </div>
                      <div>용량: {(volume / 1000).toFixed(1)}L</div>
                      <div>무게: {(bag.weight / 1000).toFixed(2)}kg</div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 플로팅 하단 UI */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard/travel-prep")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleAddBags}
                disabled={isSaving || selectedBags.size === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "추가 중..." : `가방 추가 (${selectedBags.size})`}
              </button>
            </div>
          </div>
        </div>

        {/* 가방 추가/편집 모달 */}
        <BagFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBag(null);
          }}
          onSave={handleSaveBag}
          bag={editingBag}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function BagsSelectionPage() {
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
      <BagsSelectionContent />
    </Suspense>
  );
}
