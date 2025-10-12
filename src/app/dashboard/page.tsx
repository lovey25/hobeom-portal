"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppIconGrid } from "@/components/AppIconGrid";
import { TodayTaskCard } from "@/components/TodayTaskCard";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { AppIcon } from "@/types";
import { cookieUtils } from "@/lib/cookies";

export default function DashboardPage() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const [publicApps, setPublicApps] = useState<AppIcon[]>([]);
  const [dashboardApps, setDashboardApps] = useState<AppIcon[]>([]);
  const [adminApps, setAdminApps] = useState<AppIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle("대시보드", "다양한 도구와 기능을 이용하실 수 있습니다");
  }, [setPageTitle]);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const token = cookieUtils.getToken();

      // 퍼블릭 앱 로드 (모든 사용자에게 표시)
      const publicRes = await fetch("/api/apps?category=public", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const publicData = await publicRes.json();

      if (publicData.success) {
        setPublicApps(publicData.data);
      }

      // 대시보드 앱 로드
      const dashboardRes = await fetch("/api/apps?category=dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardRes.json();

      if (dashboardData.success) {
        setDashboardApps(dashboardData.data);
      }

      // 관리자 앱 로드
      const adminRes = await fetch("/api/apps?category=admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adminData = await adminRes.json();

      if (adminData.success) {
        setAdminApps(adminData.data);
      }
    } catch (error) {
      console.error("앱 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">환영합니다, {user?.name}님! 👋</h2>
              <p className="text-blue-100">오늘도 좋은 하루 되세요!</p>
            </div>
          </div>

          {/* Today Tasks Card */}
          <div className="mb-8">{user && <TodayTaskCard userId={user.id} />}</div>

          {/* Dashboard Apps */}
          <div className="space-y-8">
            {publicApps.length > 0 && <AppIconGrid apps={publicApps} title="🌐 공용 도구" columns={4} />}

            {dashboardApps.length > 0 && <AppIconGrid apps={dashboardApps} title="🛠️ 개인 도구" columns={4} />}

            {user?.role === "admin" && adminApps.length > 0 && (
              <AppIconGrid apps={adminApps} title="👑 관리자 도구" columns={4} />
            )}
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 최근 활동</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600">2시간 전</span>
                  <span>새로운 파일을 업로드했습니다.</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-600">4시간 전</span>
                  <span>할일 3개를 완료했습니다.</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-600">어제</span>
                  <span>데이터 분석 리포트를 생성했습니다.</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
