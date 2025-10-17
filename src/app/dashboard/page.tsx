"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppIconGrid } from "@/components/AppIconGrid";
import { TodayTaskCard } from "@/components/TodayTaskCard";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
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
  const [dashboardColumns, setDashboardColumns] = useState(4);
  const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle("대시보드", "다양한 도구와 기능을 이용하실 수 있습니다");
  }, [setPageTitle]);

  useEffect(() => {
    loadApps();
    loadSettings();
    loadActivityLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success && result.data) {
        // 대시보드 열 개수 설정 적용
        setDashboardColumns(result.data.display?.dashboardColumns || 4);
        // 카드 크기 설정 적용
        setCardSize(result.data.display?.cardSize || "medium");
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
      // 기본값 유지
    }
  };

  const loadActivityLogs = async () => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/activity-logs?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setActivityLogs(result.data);
      }
    } catch (error) {
      console.error("활동 로그 로드 실패:", error);
    }
  };

  const loadApps = async () => {
    try {
      const token = cookieUtils.getToken();

      // 사용자별 앱 설정 로드
      const userAppSettingsRes = await fetch("/api/user-apps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userAppSettingsData = await userAppSettingsRes.json();
      const userAppSettings = userAppSettingsData.success ? userAppSettingsData.data : [];

      // 퍼블릭 앱 로드
      const publicRes = await fetch("/api/apps?category=public", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const publicData = await publicRes.json();

      if (publicData.success) {
        const apps = applyUserAppSettings(publicData.data, userAppSettings, "public");
        setPublicApps(apps);
      }

      // 대시보드 앱 로드
      const dashboardRes = await fetch("/api/apps?category=dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardRes.json();

      if (dashboardData.success) {
        const apps = applyUserAppSettings(dashboardData.data, userAppSettings, "dashboard");
        setDashboardApps(apps);
      }

      // 관리자 앱 로드
      const adminRes = await fetch("/api/apps?category=admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adminData = await adminRes.json();

      if (adminData.success) {
        const apps = applyUserAppSettings(adminData.data, userAppSettings, "admin");
        setAdminApps(apps);
      }
    } catch (error) {
      console.error("앱 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자별 앱 설정 적용 (보이기/숨기기, 순서)
  const applyUserAppSettings = (apps: AppIcon[], userSettings: any[], category: string) => {
    return apps
      .map((app) => {
        const setting = userSettings.find((s) => s.app_id === app.id && s.category === category);
        if (setting) {
          return {
            ...app,
            isVisible: setting.is_visible === "true",
            customOrder: parseInt(setting.custom_order) || app.order,
          };
        }
        return { ...app, isVisible: true, customOrder: app.order };
      })
      .filter((app) => app.isVisible)
      .sort((a, b) => a.customOrder - b.customOrder);
  };

  // 시간 표시 함수
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
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

          {/* Notification Permission Banner */}
          <NotificationPermissionBanner />

          {/* Today Tasks Card */}
          <div className="mb-8">{user && <TodayTaskCard userId={user.id} />}</div>

          {/* Dashboard Apps */}
          <div className="space-y-8">
            {publicApps.length > 0 && (
              <AppIconGrid apps={publicApps} title="🌐 공용 도구" columns={dashboardColumns} cardSize={cardSize} />
            )}

            {dashboardApps.length > 0 && (
              <AppIconGrid apps={dashboardApps} title="🛠️ 개인 도구" columns={dashboardColumns} cardSize={cardSize} />
            )}

            {user?.role === "admin" && adminApps.length > 0 && (
              <AppIconGrid apps={adminApps} title="👑 관리자 도구" columns={dashboardColumns} cardSize={cardSize} />
            )}
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 최근 활동</h3>
              {activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center space-x-3 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          log.actionType === "task_complete"
                            ? "bg-green-400"
                            : log.actionType === "file_upload"
                            ? "bg-blue-400"
                            : log.actionType === "data_analysis"
                            ? "bg-purple-400"
                            : log.actionType === "travel_prep"
                            ? "bg-yellow-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-gray-600">{getTimeAgo(log.createdAt)}</span>
                      <span>{log.actionDescription}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
