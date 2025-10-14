"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { AppIcon } from "@/types";
import { cookieUtils } from "@/lib/cookies";

export function PortalHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { title, subtitle } = usePageTitle();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardApps, setDashboardApps] = useState<AppIcon[]>([]);
  const [publicApps, setPublicApps] = useState<AppIcon[]>([]);
  const [adminApps, setAdminApps] = useState<AppIcon[]>([]);

  const handleLogout = () => {
    logout();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // 페이지 변경 시 스크롤을 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 앱 목록 로드
  useEffect(() => {
    loadApps();
  }, [isAuthenticated, user]);

  const loadApps = async () => {
    try {
      console.log("Loading apps, authenticated:", isAuthenticated, "user:", user);

      // 공용 앱 로드
      const publicResponse = await fetch("/api/apps?category=public");
      const publicResult = await publicResponse.json();
      console.log("Public apps result:", publicResult);
      if (publicResult.success && publicResult.data) {
        setPublicApps(publicResult.data);
        console.log("Public apps set:", publicResult.data.length);
      }

      if (isAuthenticated) {
        const token = cookieUtils.getToken();
        console.log("Token available:", !!token);

        // 대시보드 앱 로드
        const dashboardResponse = await fetch("/api/apps?category=dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dashboardResult = await dashboardResponse.json();
        console.log("Dashboard apps result:", dashboardResult);
        if (dashboardResult.success && dashboardResult.data) {
          setDashboardApps(dashboardResult.data);
          console.log("Dashboard apps set:", dashboardResult.data.length);
        }

        // 관리자 앱 로드 (관리자인 경우)
        if (user?.role === "admin") {
          console.log("Loading admin apps");
          const adminResponse = await fetch("/api/apps?category=admin", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const adminResult = await adminResponse.json();
          console.log("Admin apps result:", adminResult);
          if (adminResult.success && adminResult.data) {
            setAdminApps(adminResult.data);
            console.log("Admin apps set:", adminResult.data.length);
          }
        } else {
          setAdminApps([]);
          console.log("Not admin, clearing admin apps");
        }
      } else {
        setDashboardApps([]);
        setAdminApps([]);
        console.log("Not authenticated, clearing dashboard and admin apps");
      }
    } catch (error) {
      console.error("Failed to load apps:", error);
    }
  }; // 홈 페이지인지 확인
  const isHomePage = pathname === "/";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 페이지 제목 */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">🏠</span>
              <span className="text-xl font-bold text-gray-900">호범 포털</span>
            </Link>

            {!isHomePage && (
              <div className="hidden lg:block border-l border-gray-300 pl-6">
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* 사용자 정보 및 로그인/로그아웃 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">안녕하세요,</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">{user.name}님</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm">회원가입</Button>
                </Link>
              </div>
            )}

            {/* 햄버거 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* 슬라이드 메뉴 */}
        {isMobileMenuOpen && (
          <div className="absolute top-full right-0 w-64 bg-white shadow-xl border-t border-gray-200 z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col">
              {/* 메뉴 헤더 */}
              <div className="flex items-center justify-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
              </div>

              {/* 사용자 정보 (로그인 시) */}
              {isAuthenticated && user && (
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">안녕하세요,</p>
                  <p className="text-base font-semibold text-gray-900">{user.name}님</p>
                  {user.role === "admin" && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">관리자</span>
                  )}
                </div>
              )}

              {/* 네비게이션 링크 */}
              <nav className="flex-1 p-4 space-y-1">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/"
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        pathname === "/"
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                      }`}
                    >
                      🏠 홈
                    </Link>
                    <Link
                      href="/#samples"
                      onClick={closeMobileMenu}
                      className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600 font-medium transition-colors"
                    >
                      📱 샘플 앱
                    </Link>
                    {/* 공용 도구 */}
                    {publicApps.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          공용 도구
                        </div>
                        {publicApps.map((app) => (
                          <Link
                            key={app.id}
                            href={app.href}
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 ml-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            {app.icon} {app.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        pathname.startsWith("/dashboard")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                      }`}
                    >
                      📊 대시보드
                    </Link>
                    {/* 대시보드 앱들 */}
                    {dashboardApps.map((app) => (
                      <Link
                        key={app.id}
                        href={app.href}
                        onClick={closeMobileMenu}
                        className="block px-4 py-2 ml-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                      >
                        {app.icon} {app.name}
                      </Link>
                    ))}
                    {/* 공용 도구 */}
                    {publicApps.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200 mt-2 pt-4">
                          공용 도구
                        </div>
                        {publicApps.map((app) => (
                          <Link
                            key={app.id}
                            href={app.href}
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 ml-4 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            {app.icon} {app.name}
                          </Link>
                        ))}
                      </>
                    )}
                    {/* 관리자 도구 */}
                    {adminApps.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-red-500 uppercase tracking-wider border-t border-gray-200 mt-2 pt-4">
                          관리자 도구
                        </div>
                        {adminApps.map((app) => (
                          <Link
                            key={app.id}
                            href={app.href}
                            onClick={closeMobileMenu}
                            className="block px-4 py-2 ml-4 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            {app.icon} {app.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </>
                )}
              </nav>

              {/* 하단 액션 버튼 */}
              <div className="p-4 border-t border-gray-200 space-y-2">
                {isAuthenticated ? (
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-sm"
                  >
                    로그아웃
                  </Button>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMobileMenu}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-sm">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={closeMobileMenu}>
                      <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 text-sm">
                        회원가입
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
