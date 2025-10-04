"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BagCard } from "./components/BagCard";
import { ItemCard } from "./components/ItemCard";
import { FilterBar } from "./components/FilterBar";
import { cookieUtils } from "@/lib/cookies";
import { TripList, TripItem, TravelItem, Bag, BagStats, TripItemFilter } from "@/types";

export default function TravelPrepPage() {
  const router = useRouter();
  const { user } = useAuth();

  // 상태 관리
  const [currentTrip, setCurrentTrip] = useState<TripList | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allTravelItems, setAllTravelItems] = useState<TravelItem[]>([]);
  const [allBags, setAllBags] = useState<Bag[]>([]);
  const [bagStats, setBagStats] = useState<BagStats[]>([]);
  const [filter, setFilter] = useState<TripItemFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, [user]);

  // 여행이 변경될 때마다 데이터 갱신
  useEffect(() => {
    if (currentTrip) {
      loadTripData();
    }
  }, [currentTrip?.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const token = cookieUtils.getToken();

      // 마스터 데이터 로드
      const [itemsRes, bagsRes, tripsRes] = await Promise.all([
        fetch("/api/travel-prep/items", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/travel-prep/bags", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/travel-prep/trips", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const itemsData = await itemsRes.json();
      const bagsData = await bagsRes.json();
      const tripsData = await tripsRes.json();

      if (itemsData.success) setAllTravelItems(itemsData.data);
      if (bagsData.success) setAllBags(bagsData.data);

      // 마지막 사용 여행이 있으면 로드
      if (tripsData.success && tripsData.data.length > 0) {
        setCurrentTrip(tripsData.data[0]); // 첫 번째가 최근 사용
      } else {
        // 여행이 없으면 선택 화면으로 이동
        router.push("/dashboard/travel-prep/select-trip");
      }
    } catch (error) {
      console.error("초기 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTripData = async () => {
    if (!currentTrip) return;

    try {
      const token = cookieUtils.getToken();

      // 여행 아이템 및 통계 로드
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`/api/travel-prep/trip-items?tripId=${currentTrip.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/travel-prep/bag-stats?tripId=${currentTrip.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const itemsData = await itemsRes.json();
      const statsData = await statsRes.json();

      if (itemsData.success) setTripItems(itemsData.data);
      if (statsData.success) setBagStats(statsData.data);

      // 마지막 사용 시간 업데이트
      await fetch(`/api/travel-prep/trips?id=${currentTrip.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("여행 데이터 로드 실패:", error);
    }
  };

  // 필터링된 아이템 계산
  const getFilteredItems = () => {
    return tripItems.filter((tripItem) => {
      if (tripItem.itemType !== "item") return false;

      const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
      if (!travelItem) return false;

      // 가방 필터
      if (filter.bagId !== undefined) {
        if (filter.bagId === "unassigned" && tripItem.bagId) return false;
        if (filter.bagId !== "unassigned" && tripItem.bagId !== filter.bagId) return false;
      }

      // 중요도 필터
      if (filter.importance !== undefined && travelItem.importance !== filter.importance) return false;

      // 분류 필터
      if (filter.category !== undefined && travelItem.category !== filter.category) return false;

      // 준비 상태 필터
      if (filter.isPrepared !== undefined && tripItem.isPrepared !== filter.isPrepared) return false;

      return true;
    });
  };

  // 아이템 준비 상태 토글
  const toggleItemPrepared = async (itemId: string, currentState: boolean) => {
    try {
      const token = cookieUtils.getToken();
      const res = await fetch("/api/travel-prep/trip-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          isPrepared: !currentState,
        }),
      });

      if (res.ok) {
        await loadTripData();
      }
    } catch (error) {
      console.error("준비 상태 업데이트 실패:", error);
    }
  };

  // 아이템 가방 변경
  const changeItemBag = async (itemId: string, newBagId: string) => {
    try {
      const token = cookieUtils.getToken();
      const res = await fetch("/api/travel-prep/trip-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          bagId: newBagId,
        }),
      });

      if (res.ok) {
        await loadTripData();
      }
    } catch (error) {
      console.error("가방 변경 실패:", error);
    }
  };

  // 아이템 삭제
  const removeItem = async (itemId: string) => {
    if (!confirm("이 아이템을 삭제하시겠습니까?")) return;

    try {
      const token = cookieUtils.getToken();
      const res = await fetch(`/api/travel-prep/trip-items?itemId=${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await loadTripData();
      }
    } catch (error) {
      console.error("아이템 삭제 실패:", error);
    }
  };

  const filteredItems = getFilteredItems();
  const categories = Array.from(new Set(allTravelItems.map((item) => item.category)));

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

  if (!currentTrip) {
    return null; // 리디렉트 중
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentTrip.name}</h1>
                <p className="text-gray-600 mt-1">
                  {currentTrip.type} • {currentTrip.days}일
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/travel-prep/select-trip")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                여행 변경
              </button>
            </div>
          </div>

          {/* 가방 섹션 */}
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">가방</h2>
                <button
                  onClick={() => router.push(`/dashboard/travel-prep/bags?tripId=${currentTrip.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  가방 추가
                </button>
              </div>

              {bagStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>가방을 추가해주세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bagStats.map((stats) => (
                    <BagCard
                      key={stats.bagId}
                      stats={stats}
                      isSelected={selectedBagId === stats.bagId}
                      onClick={() => {
                        setSelectedBagId(selectedBagId === stats.bagId ? null : stats.bagId);
                        setFilter({
                          ...filter,
                          bagId: selectedBagId === stats.bagId ? undefined : stats.bagId,
                        });
                      }}
                      showDetails={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 필터 바 */}
          <FilterBar
            filter={filter}
            onFilterChange={setFilter}
            bags={bagStats.map((s) => ({ id: s.bagId, name: s.bag.name }))}
            categories={categories}
          />

          {/* 준비물 리스트 */}
          <div className="mt-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">준비물 ({filteredItems.length}개)</h2>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">준비물이 없습니다</p>
                  <p className="text-sm">아래 버튼을 클릭하여 준비물을 추가해주세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((tripItem) => {
                    const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
                    if (!travelItem) return null;

                    const bag = bagStats.find((s) => s.bagId === tripItem.bagId);

                    return (
                      <ItemCard
                        key={tripItem.id}
                        item={travelItem}
                        isPrepared={tripItem.isPrepared}
                        bagName={bag?.bag.name}
                        onTogglePrepared={() => toggleItemPrepared(tripItem.id, tripItem.isPrepared)}
                        onChangeBag={() => {
                          const newBagId = prompt(
                            "가방 ID를 입력하세요:\n" + bagStats.map((s) => `${s.bagId}: ${s.bag.name}`).join("\n")
                          );
                          if (newBagId) changeItemBag(tripItem.id, newBagId);
                        }}
                        onRemove={() => removeItem(tripItem.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 플로팅 액션 버튼 */}
          <button
            onClick={() => router.push(`/dashboard/travel-prep/items?tripId=${currentTrip.id}`)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center text-2xl"
            title="준비물 추가"
          >
            +
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
