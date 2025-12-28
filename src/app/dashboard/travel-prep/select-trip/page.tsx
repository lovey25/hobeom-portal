"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { cookieUtils } from "@/lib/cookies";
import { TravelTypeTemplate, TripList } from "@/types";
import { layout, text, state, button, cn } from "@/styles/design-system";

export default function SelectTripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();

  const [travelTypes, setTravelTypes] = useState<TravelTypeTemplate[]>([]);
  const [existingTrips, setExistingTrips] = useState<TripList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTitle("여행 선택", "새로운 여행을 만들거나 기존 여행을 선택하세요");
  }, [setPageTitle]);

  // 새 여행 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    days: 3,
    type: "여행" as "여행" | "출장",
    travelTypeId: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const token = cookieUtils.getToken();

      const [typesRes, tripsRes] = await Promise.all([
        fetch("/api/travel-prep/travel-types"),
        fetch("/api/travel-prep/trips", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const typesData = await typesRes.json();
      const tripsData = await tripsRes.json();

      if (typesData.success) setTravelTypes(typesData.data);
      if (tripsData.success) setExistingTrips(tripsData.data);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: TravelTypeTemplate) => {
    setFormData({
      name: template.name,
      days: template.days,
      type: template.type,
      travelTypeId: template.id,
    });
    setIsCreating(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.days < 1 || formData.days > 10) {
      alert("여행 이름과 올바른 일수(1-10일)를 입력해주세요.");
      return;
    }

    try {
      const token = cookieUtils.getToken();
      const res = await fetch("/api/travel-prep/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard/travel-prep");
      } else {
        alert(data.message || "여행 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("여행 생성 실패:", error);
      alert("여행 생성 중 오류가 발생했습니다.");
    }
  };

  const selectExistingTrip = async (trip: TripList) => {
    try {
      const token = cookieUtils.getToken();
      await fetch(`/api/travel-prep/trips?id=${trip.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/dashboard/travel-prep");
    } catch (error) {
      console.error("여행 선택 실패:", error);
    }
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

  return (
    <ProtectedRoute>
      <div className={layout.page}>
        <div className={cn(layout.containerMedium, "py-8")}>
          {/* 기존 여행 목록 */}
          {existingTrips.length > 0 && (
            <div className="mb-8">
              <h2 className={cn(text.sectionTitle, "mb-4")}>최근 여행</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingTrips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => selectExistingTrip(trip)}
                    className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
                  >
                    <h3 className="font-semibold text-lg text-gray-900">{trip.name}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>{trip.type}</span>
                      <span>•</span>
                      <span>{trip.days}일</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      최근 사용: {new Date(trip.lastUsed).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 새 여행 생성 */}
          <div>
            {!isCreating ? (
              <div>
                <h2 className={cn(text.sectionTitle, "mb-4")}>새 여행 만들기</h2>

                {/* 템플릿 선택 */}
                <div className="mb-6">
                  <h3 className={cn(text.cardTitle, "mb-3")}>템플릿에서 선택</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {travelTypes.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                      >
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {template.type} • {template.days}일
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 직접 만들기 버튼 */}
                <button
                  onClick={() => setIsCreating(true)}
                  className={cn(button.base, button.medium, button.primary, "w-full")}
                >
                  직접 만들기
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className={cn(text.sectionTitle, "mb-4")}>여행 정보 입력</h2>

                <form onSubmit={handleCreateTrip} className="space-y-4">
                  {/* 여행 이름 */}
                  <div>
                    <label className={cn(text.label, "mb-1")}>여행 이름 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="예: 제주도 여행"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* 여행 타입 */}
                  <div>
                    <label className={cn(text.label, "mb-1")}>타입 *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="여행"
                          checked={formData.type === "여행"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              type: e.target.value as "여행" | "출장",
                            })
                          }
                          className="mr-2"
                        />
                        여행
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="출장"
                          checked={formData.type === "출장"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              type: e.target.value as "여행" | "출장",
                            })
                          }
                          className="mr-2"
                        />
                        출장
                      </label>
                    </div>
                  </div>

                  {/* 일수 */}
                  <div>
                    <label className={cn(text.label, "mb-1")}>일수 (1-10일) *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          days: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      생성하기
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 돌아가기 버튼 */}
          {existingTrips.length > 0 && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 대시보드로 돌아가기
            </button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
