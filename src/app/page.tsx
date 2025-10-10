"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { AppIconGrid } from "@/components/AppIconGrid";
import { Card } from "@/components/ui/Card";
import { AppIcon } from "@/types";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setPageTitle } = usePageTitle();
  const [publicApps, setPublicApps] = useState<AppIcon[]>([]);
  const [dashboardApps, setDashboardApps] = useState<AppIcon[]>([]);

  // 홈 페이지는 제목을 표시하지 않음
  useEffect(() => {
    setPageTitle("호범 포털");
  }, [setPageTitle]);

  useEffect(() => {
    loadApps();
  }, [isAuthenticated]);

  const loadApps = async () => {
    try {
      // 퍼블릭 앱 로드
      const publicRes = await fetch("/api/apps?category=public");
      const publicData = await publicRes.json();
      if (publicData.success) {
        setPublicApps(publicData.data);
      }

      // 로그인 상태일 때 대시보드 앱 미리보기 로드
      if (isAuthenticated) {
        const dashboardRes = await fetch("/api/apps?category=dashboard");
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success) {
          setDashboardApps(dashboardData.data);
        }
      }
    } catch (error) {
      console.error("앱 목록 로드 실패:", error);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">호범 포털에 오신 것을 환영합니다 🎉</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">다양한 도구와 기능을 한곳에서 편리하게 이용하세요</p>
            {isAuthenticated && user ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 inline-block">
                <p className="text-lg">
                  안녕하세요, <span className="font-bold">{user.name}</span>님! 👋
                </p>
                <p className="text-blue-100 text-sm mt-1">로그인 상태로 모든 기능을 이용하실 수 있습니다</p>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 inline-block">
                <p className="text-lg mb-2">더 많은 기능을 이용하고 싶으신가요?</p>
                <Link
                  href="/login"
                  className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  로그인하기
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Public Apps Section */}
        <section className="mb-12" id="samples">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">🌐 누구나 사용 가능한 앱</h2>
            <p className="text-gray-600 text-lg">로그인 없이도 이용할 수 있는 유용한 도구들입니다.</p>
          </div>
          <AppIconGrid apps={publicApps} columns={4} />
        </section>

        {/* Dashboard Apps Preview (로그인 시) */}
        {isAuthenticated && dashboardApps.length > 0 && (
          <section className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">🛠️ 개인 도구</h2>
              <p className="text-gray-600 text-lg">
                로그인한 사용자를 위한 고급 기능들입니다.{" "}
                <Link href="/dashboard" className="text-blue-600 hover:underline font-medium">
                  대시보드에서 더 보기 →
                </Link>
              </p>
            </div>
            <AppIconGrid apps={dashboardApps.slice(0, 8)} columns={4} />
          </section>
        )}

        {/* Feature Cards */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">빠른 시작</h3>
            <p className="text-gray-600">회원가입 없이도 바로 사용할 수 있는 도구들을 제공합니다.</p>
          </Card>

          <Card className="text-center p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">안전한 데이터</h3>
            <p className="text-gray-600">개인 데이터는 안전하게 보호되며, 로컬에 저장됩니다.</p>
          </Card>

          <Card className="text-center p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">현대적 기술</h3>
            <p className="text-gray-600">Next.js 15와 React 19를 기반으로 한 최신 웹 기술을 사용합니다.</p>
          </Card>
        </section>

        {/* CTA Section (비로그인 시) */}
        {!isAuthenticated && (
          <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">더 많은 기능이 필요하신가요?</h2>
            <p className="text-lg text-gray-600 mb-6">
              로그인하시면 개인화된 대시보드와 고급 도구들을 이용하실 수 있습니다.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="inline-block bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 호범 포털. 모든 권리 보유.</p>
            <p className="mt-2">Next.js 15 + TypeScript로 구축된 현대적 웹 포털</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
