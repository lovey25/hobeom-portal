"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AppIconGrid } from "@/components/AppIconGrid";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/types";
import { cookieUtils } from "@/lib/cookies";

export default function DashboardPage() {
  const { user } = useAuth();
  const [publicApps, setPublicApps] = useState<AppIcon[]>([]);
  const [dashboardApps, setDashboardApps] = useState<AppIcon[]>([]);
  const [adminApps, setAdminApps] = useState<AppIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">환영합니다, {user?.name}님! 👋</h1>
            <p className="text-gray-600">대시보드에서 다양한 도구와 기능을 이용하실 수 있습니다.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="text-lg font-semibold text-gray-900">활성 프로젝트</h3>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900">오늘 할일</h3>
              <p className="text-2xl font-bold text-green-600">8</p>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-lg font-semibold text-gray-900">완료율</h3>
              <p className="text-2xl font-bold text-purple-600">85%</p>
            </Card>
          </div>

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
