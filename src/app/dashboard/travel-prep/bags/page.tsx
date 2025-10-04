"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { cookieUtils } from "@/lib/cookies";
import { Bag } from "@/types";

function BagsSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [bags, setBags] = useState<Bag[]>([]);
  const [selectedBags, setSelectedBags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const tripId = searchParams.get("tripId");

  useEffect(() => {
    loadBags();
  }, []);

  const loadBags = async () => {
    try {
      const res = await fetch("/api/travel-prep/bags");
      const data = await res.json();

      if (data.success) {
        setBags(data.data);
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

      // 선택된 가방들을 여행에 추가
      const promises = Array.from(selectedBags).map((bagId) =>
        fetch("/api/travel-prep/trip-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tripListId: tripId,
            itemId: bagId,
            itemType: "bag",
          }),
        })
      );

      await Promise.all(promises);
      router.push("/dashboard/travel-prep");
    } catch (error) {
      console.error("가방 추가 실패:", error);
      alert("가방 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">가방 선택</h1>
            <p className="text-gray-600 mt-2">여행에 사용할 가방을 선택해주세요 (선택: {selectedBags.size}개)</p>
          </div>

          {/* 가방 리스트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {bags.map((bag) => {
              const isSelected = selectedBags.has(bag.id);
              const volume = bag.width * bag.height * bag.depth;

              return (
                <button
                  key={bag.id}
                  onClick={() => toggleBagSelection(bag.id)}
                  className={`
                    p-6 bg-white rounded-lg border-2 transition-all text-left
                    ${isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-blue-300"}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{bag.name}</h3>
                    {isSelected && (
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
                    <div>무게: {bag.weight}kg</div>
                  </div>
                </button>
              );
            })}
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
              onClick={handleAddBags}
              disabled={isSaving || selectedBags.size === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "추가 중..." : `가방 추가 (${selectedBags.size})`}
            </button>
          </div>
        </div>
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
      <BagsSelectionContent />
    </Suspense>
  );
}
