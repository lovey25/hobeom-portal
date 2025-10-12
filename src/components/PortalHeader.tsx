"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";

export function PortalHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { title, subtitle } = usePageTitle();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // 홈 페이지인지 확인
  const isHomePage = pathname === "/";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <nav className="hidden md:flex space-x-6">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/"
                    className={`font-medium transition-colors ${
                      pathname === "/" ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    홈
                  </Link>
                  <Link href="/#samples" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    샘플 앱
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className={`font-medium transition-colors ${
                    pathname.startsWith("/dashboard") ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  대시보드
                </Link>
              )}
            </nav>
          </div>

          {/* 사용자 정보 및 로그인/로그아웃 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">안녕하세요,</span>
                  <span className="text-sm font-medium text-gray-900 ml-1">{user.name}님</span>
                </div>
                <Button
                  onClick={handleLogout}
                  className="hidden md:flex bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm"
                >
                  로그아웃
                </Button>
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

            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              aria-label="메뉴"
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
      </div>

      {/* 모바일 슬라이드 메뉴 */}
      {isMobileMenuOpen && (
        <>
          {/* 오버레이 배경 */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} aria-hidden="true" />

          {/* 슬라이드 메뉴 */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* 메뉴 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  aria-label="닫기"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                  </>
                ) : (
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
        </>
      )}
    </header>
  );
}
