"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AppIconGrid } from "@/components/AppIconGrid";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/types";

// 임시로 하드코딩된 앱 데이터 (나중에 API에서 가져올 예정)
const dashboardApps: AppIcon[] = [
  {
    id: "4",
    name: "할일관리",
    description: "개인 할일 관리 시스템",
    icon: "✅",
    href: "/dashboard/todo",
    requireAuth: true,
    category: "dashboard",
    order: 1,
    isActive: true,
  },
  {
    id: "5",
    name: "파일관리",
    description: "파일 업로드 및 관리",
    icon: "📁",
    href: "/dashboard/files",
    requireAuth: true,
    category: "dashboard",
    order: 2,
    isActive: true,
  },
  {
    id: "6",
    name: "데이터분석",
    description: "CSV 데이터 분석 도구",
    icon: "📊",
    href: "/dashboard/analytics",
    requireAuth: true,
    category: "dashboard",
    order: 3,
    isActive: true,
  },
  {
    id: "7",
    name: "설정",
    description: "사용자 설정 및 프로필",
    icon: "⚙️",
    href: "/dashboard/settings",
    requireAuth: true,
    category: "dashboard",
    order: 4,
    isActive: true,
  },
];

const adminApps: AppIcon[] = [
  {
    id: "8",
    name: "사용자관리",
    description: "사용자 및 권한 관리",
    icon: "👥",
    href: "/dashboard/users",
    requireAuth: true,
    category: "admin",
    order: 1,
    isActive: true,
  },
  {
    id: "9",
    name: "시스템로그",
    description: "시스템 로그 모니터링",
    icon: "📋",
    href: "/dashboard/logs",
    requireAuth: true,
    category: "admin",
    order: 2,
    isActive: true,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

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
            <AppIconGrid apps={dashboardApps} title="🛠️ 개인 도구" columns={4} />

            {user?.role === "admin" && <AppIconGrid apps={adminApps} title="👑 관리자 도구" columns={4} />}
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
