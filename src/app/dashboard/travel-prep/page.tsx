"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useNotification } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { BagCard } from "./components/BagCard";
import { ItemCard } from "./components/ItemCard";
import { ItemFormModal } from "./components/ItemFormModal";
import { cookieUtils } from "@/lib/cookies";
import { TripList, TripItem, TravelItem, BagStats, TripItemFilter } from "@/types";
import { layout, text, state, button, badge, cn } from "@/styles/design-system";

export default function TravelPrepPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { notifyTravelItem } = useNotification();

  useEffect(() => {
    setPageTitle("여행 준비", "여행 짐을 체계적으로 관리하세요");
  }, [setPageTitle]);

  // 상태 관리
  const [currentTrip, setCurrentTrip] = useState<TripList | null>(null);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [allTravelItems, setAllTravelItems] = useState<TravelItem[]>([]);
  const [bagStats, setBagStats] = useState<BagStats[]>([]);
  const [filter, setFilter] = useState<TripItemFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [groupBy, setGroupBy] = useState<"none" | "category" | "importance">("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [travelNotificationDays, setTravelNotificationDays] = useState(3); // 기본값 3일

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
    loadNotificationSettings();
  }, [user]);

  // 여행이 변경될 때마다 데이터 갱신
  useEffect(() => {
    if (currentTrip) {
      loadTripData();
    }
  }, [currentTrip?.id]);

  // 스크롤 방향 감지
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 최상단 근처면 무조건 숨김
      if (currentScrollY <= 150) {
        setShowQuickNav(false);
      } else if (currentScrollY > lastScrollY) {
        // 아래로 스크롤 - 네비게이션 숨김
        setShowQuickNav(false);
      } else if (currentScrollY < lastScrollY && currentScrollY > 150) {
        // 위로 스크롤 - 네비게이션 표시
        setShowQuickNav(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const loadNotificationSettings = async () => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data.notifications) {
        setTravelNotificationDays(result.data.notifications.travelNotificationDays || 3);
      }
    } catch (error) {
      console.error("알림 설정 로드 실패:", error);
    }
  };

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
      await bagsRes.json(); // bagsData는 bagStats에서 사용되므로 별도 저장 불필요
      const tripsData = await tripsRes.json();

      if (itemsData.success) setAllTravelItems(itemsData.data);

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
        // 미배정 필터: bagId가 빈 문자열일 때
        if (filter.bagId === "") {
          if (tripItem.bagId && tripItem.bagId !== "") return false;
        } else {
          // 특정 가방 필터
          if (tripItem.bagId !== filter.bagId) return false;
        }
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

  // 여행일까지 남은 날짜 계산
  const shouldShowNotification = (): boolean => {
    if (!currentTrip || !currentTrip.startDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tripDate = new Date(currentTrip.startDate);
    tripDate.setHours(0, 0, 0, 0);

    const daysUntilTrip = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 여행일이 지났거나 설정된 일수보다 많이 남았으면 알림 안 함
    return daysUntilTrip >= 0 && daysUntilTrip <= travelNotificationDays;
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

        // 준비 완료 시 알림 전송 (여행 날짜 조건 체크)
        if (!currentState && shouldShowNotification()) {
          const travelItem = allTravelItems.find((ti) => ti.id === itemId);
          if (travelItem) {
            const daysLeft = Math.ceil(
              (new Date(currentTrip!.startDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            await notifyTravelItem(
              `"${travelItem.name}" 준비 완료! (D-${daysLeft})`,
              `${window.location.origin}/dashboard/travel-prep`
            );
          }
        }
      }
    } catch (error) {
      console.error("준비 상태 업데이트 실패:", error);
    }
  };

  // 선택된 아이템들의 가방을 일괄 변경
  const changeSelectedItemsBag = async (newBagId: string) => {
    try {
      const token = cookieUtils.getToken();
      const itemIds = Array.from(selectedItemIds);

      const res = await fetch("/api/travel-prep/trip-items/batch-update-bag", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemIds,
          bagId: newBagId,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // 선택 해제 및 데이터 새로고침
        setSelectedItemIds(new Set());
        await loadTripData();
      } else {
        alert(`가방 변경 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("가방 일괄 변경 실패:", error);
      alert("가방 변경 중 오류가 발생했습니다.");
    }
  };

  // 아이템 선택 토글
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  // 아이템 수량 변경
  const changeItemQuantity = async (itemId: string, newQuantity: number) => {
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
          quantity: newQuantity,
        }),
      });

      if (res.ok) {
        await loadTripData();
      }
    } catch (error) {
      console.error("수량 변경 실패:", error);
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

  // 선택된 아이템들 일괄 삭제
  const removeSelectedItems = async () => {
    if (selectedItemIds.size === 0) {
      alert("삭제할 아이템을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedItemIds.size}개의 아이템을 삭제하시겠습니까?`)) return;

    try {
      const token = cookieUtils.getToken();
      const itemIds = Array.from(selectedItemIds).join(",");

      const res = await fetch(`/api/travel-prep/trip-items/batch-delete?itemIds=${itemIds}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        setSelectedItemIds(new Set());
        await loadTripData();
      } else {
        alert(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("아이템 일괄 삭제 실패:", error);
      alert("아이템 삭제 중 오류가 발생했습니다.");
    }
  };

  // 모든 아이템 선택
  const selectAllItems = () => {
    const allItemIds = filteredItems.map((tripItem) => tripItem.id);
    setSelectedItemIds(new Set(allItemIds));
  };

  // 선택 해제
  const deselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  // 섹션 바로가기
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // 헤더 높이 고려
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  // 아이템 수정 모달 열기
  const openEditItemModal = (item: TravelItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  // 아이템 수정 저장
  const handleSaveItem = async (itemData: any) => {
    try {
      const token = cookieUtils.getToken();
      const res = await fetch("/api/travel-prep/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingItem?.id,
          ...itemData,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setIsItemModalOpen(false);
        setEditingItem(null);
        await loadInitialData(); // 마스터 아이템 목록 새로고침
        await loadTripData(); // 여행 데이터 새로고침
      } else {
        alert(`수정 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("아이템 수정 실패:", error);
      alert("아이템 수정 중 오류가 발생했습니다.");
    }
  };

  // 가방 삭제
  const deleteBag = async (bagId: string, bagName: string) => {
    // 해당 가방에 아이템이 있는지 확인
    const itemsInBag = tripItems.filter((item) => item.itemType === "item" && item.bagId === bagId);

    if (itemsInBag.length > 0) {
      if (
        !confirm(
          `"${bagName}" 가방에 ${itemsInBag.length}개의 아이템이 있습니다. 삭제하시겠습니까?\n(아이템들은 미배정 상태가 됩니다)`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`"${bagName}" 가방을 삭제하시겠습니까?`)) {
        return;
      }
    }

    try {
      const token = cookieUtils.getToken();

      // 여행 리스트에서 가방 아이템 찾기
      const bagTripItem = tripItems.find((item) => item.itemType === "bag" && item.itemId === bagId);

      if (!bagTripItem) {
        alert("가방을 찾을 수 없습니다.");
        return;
      }

      // 여행 리스트에서 가방 아이템 삭제
      const res = await fetch(`/api/travel-prep/trip-items?itemId=${bagTripItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        // 선택 상태 해제 및 필터 초기화
        setSelectedBagId(null);
        setFilter({ ...filter, bagId: undefined });
        await loadTripData();
      } else {
        alert(`삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("가방 삭제 실패:", error);
      alert("가방 삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredItems = getFilteredItems();
  const categories = Array.from(new Set(allTravelItems.map((item) => item.category)));

  // 그룹별로 아이템 정리
  const groupedItems: { [key: string]: typeof filteredItems } = {};

  if (groupBy === "category") {
    filteredItems.forEach((tripItem) => {
      const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
      if (!travelItem) return;
      const key = travelItem.category || "기타";
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(tripItem);
    });
  } else if (groupBy === "importance") {
    filteredItems.forEach((tripItem) => {
      const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
      if (!travelItem) return;
      const importanceLabels: { [key: number]: string } = {
        5: "매우중요",
        4: "중요",
        3: "보통",
        2: "낮음",
        1: "선택",
      };
      const key = importanceLabels[travelItem.importance] || "기타";
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(tripItem);
    });
  }

  // groupBy 변경 시 모든 그룹을 접힌 상태로 초기화
  useEffect(() => {
    if (groupBy !== "none") {
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
    e.stopPropagation();
    const groupItems = groupedItems[groupName] || [];
    const allSelected = groupItems.every((item) => selectedItemIds.has(item.id));

    const newSelection = new Set(selectedItemIds);
    if (allSelected) {
      groupItems.forEach((item) => newSelection.delete(item.id));
    } else {
      groupItems.forEach((item) => newSelection.add(item.id));
    }
    setSelectedItemIds(newSelection);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={layout.page}>
          <main className={layout.container}>
            <p className={state.loading}>로딩 중...</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentTrip) {
    return null; // 리디렉트 중
  }

  return (
    <ProtectedRoute>
      <div className={layout.page}>
        {/* 퀵 네비게이션 - 스크롤 시 동적 표시 */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md transition-all duration-300 ${
            showQuickNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-600">바로가기:</span>
              <button
                onClick={() => scrollToSection("filter-section")}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                필터
              </button>
              <button
                onClick={() => scrollToSection("bag-section")}
                className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                가방 ({bagStats.length})
              </button>
              <button
                onClick={() => scrollToSection("items-section")}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                준비물 ({filteredItems.length})
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="ml-auto px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ↑ 맨 위로
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* 헤더 */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentTrip.name}</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  {currentTrip.type} • {currentTrip.days}일
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/travel-prep/select-trip")}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                여행 변경
              </button>
            </div>
          </div>

          {/* 정렬 및 필터 */}
          <div id="filter-section">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
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
                      groupBy === "importance"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

              {/* 준비상태 필터 */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">준비상태:</span>
                <button
                  onClick={() => setFilter({ ...filter, isPrepared: undefined })}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter.isPrepared === undefined
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilter({ ...filter, isPrepared: false })}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter.isPrepared === false
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  준비중
                </button>
                <button
                  onClick={() => setFilter({ ...filter, isPrepared: true })}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter.isPrepared === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ✓ 준비완료
                </button>
              </div>
            </div>
          </div>

          {/* 가방 섹션 */}
          <div id="bag-section" className="my-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">가방</h2>
                  {selectedItemIds.size > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedItemIds.size}개 선택됨 - 이동할 가방을 클릭하세요
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedBagId && (
                    <button
                      onClick={() => {
                        const selectedBag = bagStats.find((s) => s.bagId === selectedBagId);
                        if (selectedBag) {
                          deleteBag(selectedBag.bagId, selectedBag.bag.name);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      선택된 가방 삭제
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/travel-prep/bags?tripId=${currentTrip.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    가방 추가
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 미배정 카드 (항상 첫 번째) */}
                <BagCard
                  key="unassigned"
                  stats={{
                    bagId: "",
                    bag: {
                      id: "",
                      name: "미배정",
                      width: 0,
                      height: 0,
                      depth: 0,
                      weight: 0,
                      isActive: true,
                    },
                    items: tripItems
                      .filter((item) => item.itemType === "item" && !item.bagId)
                      .map((item) => {
                        const travelItem = allTravelItems.find((ti) => ti.id === item.itemId);
                        return {
                          ...travelItem!,
                          isPrepared: item.isPrepared,
                        };
                      })
                      .filter((item) => item.id),
                    totalWeight: tripItems
                      .filter((item) => item.itemType === "item" && !item.bagId)
                      .reduce((sum, item) => {
                        const travelItem = allTravelItems.find((ti) => ti.id === item.itemId);
                        return sum + (travelItem?.weight || 0) * item.quantity;
                      }, 0),
                    totalVolume: tripItems
                      .filter((item) => item.itemType === "item" && !item.bagId)
                      .reduce((sum, item) => {
                        const travelItem = allTravelItems.find((ti) => ti.id === item.itemId);
                        const volume = travelItem
                          ? (travelItem.width * travelItem.height * travelItem.depth) / 1000
                          : 0;
                        return sum + volume * item.quantity;
                      }, 0),
                    saturation: 0,
                  }}
                  isSelected={selectedBagId === ""}
                  onClick={() => {
                    if (selectedItemIds.size > 0) {
                      // 선택된 아이템이 있으면 미배정으로 이동
                      if (confirm(`선택된 ${selectedItemIds.size}개 아이템을 미배정 상태로 이동하시겠습니까?`)) {
                        changeSelectedItemsBag("");
                      }
                    } else {
                      // 선택된 아이템이 없으면 필터링
                      setSelectedBagId(selectedBagId === "" ? null : "");
                      setFilter({
                        ...filter,
                        bagId: selectedBagId === "" ? undefined : "",
                      });
                    }
                  }}
                />

                {/* 일반 가방들 */}
                {bagStats.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>가방을 추가해주세요</p>
                  </div>
                ) : (
                  bagStats.map((stats) => (
                    <BagCard
                      key={stats.bagId}
                      stats={stats}
                      isSelected={selectedBagId === stats.bagId}
                      onClick={() => {
                        if (selectedItemIds.size > 0) {
                          // 선택된 아이템이 있으면 가방 이동
                          if (
                            confirm(
                              `선택된 ${selectedItemIds.size}개 아이템을 "${stats.bag.name}"(으)로 이동하시겠습니까?`
                            )
                          ) {
                            changeSelectedItemsBag(stats.bagId);
                          }
                        } else {
                          // 선택된 아이템이 없으면 필터링
                          setSelectedBagId(selectedBagId === stats.bagId ? null : stats.bagId);
                          setFilter({
                            ...filter,
                            bagId: selectedBagId === stats.bagId ? undefined : stats.bagId,
                          });
                        }
                      }}
                      showDetails={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 준비물 리스트 */}
          <div id="items-section" className="mt-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">준비물 ({filteredItems.length}개)</h2>
                <div className="flex gap-2">
                  {selectedItemIds.size > 0 ? (
                    <>
                      <button
                        onClick={removeSelectedItems}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        삭제 ({selectedItemIds.size})
                      </button>
                      <button
                        onClick={deselectAllItems}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        선택 해제
                      </button>
                    </>
                  ) : (
                    filteredItems.length > 0 && (
                      <button
                        onClick={selectAllItems}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        모두 선택
                      </button>
                    )
                  )}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">준비물이 없습니다</p>
                  <p className="text-sm">아래 버튼을 클릭하여 준비물을 추가해주세요</p>
                </div>
              ) : groupBy === "none" ? (
                // 기본 정렬 - 그리드 형태
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((tripItem) => {
                    const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
                    if (!travelItem) return null;

                    const bag = bagStats.find((s) => s.bagId === tripItem.bagId);
                    const isSelected = selectedItemIds.has(tripItem.id);

                    return (
                      <ItemCard
                        key={tripItem.id}
                        item={travelItem}
                        isPrepared={tripItem.isPrepared}
                        bagName={bag?.bag.name}
                        quantity={tripItem.quantity}
                        onTogglePrepared={() => toggleItemPrepared(tripItem.id, tripItem.isPrepared)}
                        onChangeBag={() => toggleItemSelection(tripItem.id)}
                        onQuantityChange={(newQuantity) => changeItemQuantity(tripItem.id, newQuantity)}
                        onEdit={() => openEditItemModal(travelItem)}
                        onRemove={() => removeItem(tripItem.id)}
                        isSelected={isSelected}
                      />
                    );
                  })}
                </div>
              ) : (
                // 그룹별 정렬 - 아코디언 형태
                <div className="space-y-3">
                  {Object.keys(groupedItems)
                    .sort((a, b) => {
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
                      return a.localeCompare(b);
                    })
                    .map((groupName) => {
                      const groupItems = groupedItems[groupName];
                      const isCollapsed = collapsedGroups.has(groupName);
                      const groupSelectedCount = groupItems.filter((item) => selectedItemIds.has(item.id)).length;

                      return (
                        <div key={groupName} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          {/* 그룹 헤더 */}
                          <div className="bg-gray-100 hover:bg-gray-200 transition-colors">
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
                                {groupItems.every((item) => selectedItemIds.has(item.id)) ? "선택 해제" : "전체 선택"}
                              </button>
                            </div>
                          </div>

                          {/* 그룹 아이템들 */}
                          {!isCollapsed && (
                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {groupItems.map((tripItem) => {
                                const travelItem = allTravelItems.find((ti) => ti.id === tripItem.itemId);
                                if (!travelItem) return null;

                                const bag = bagStats.find((s) => s.bagId === tripItem.bagId);
                                const isSelected = selectedItemIds.has(tripItem.id);

                                return (
                                  <ItemCard
                                    key={tripItem.id}
                                    item={travelItem}
                                    isPrepared={tripItem.isPrepared}
                                    quantity={tripItem.quantity}
                                    bagName={bag?.bag.name || "미배정"}
                                    onTogglePrepared={() => toggleItemPrepared(tripItem.id, tripItem.isPrepared)}
                                    onChangeBag={() => toggleItemSelection(tripItem.id)}
                                    onQuantityChange={(newQuantity) => changeItemQuantity(tripItem.id, newQuantity)}
                                    onEdit={() => openEditItemModal(travelItem)}
                                    onRemove={() => removeItem(tripItem.id)}
                                    isSelected={isSelected}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
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

        {/* 아이템 수정 모달 */}
        {isItemModalOpen && editingItem && (
          <ItemFormModal
            isOpen={isItemModalOpen}
            onClose={() => {
              setIsItemModalOpen(false);
              setEditingItem(null);
            }}
            onSave={handleSaveItem}
            item={editingItem}
            categories={categories}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
