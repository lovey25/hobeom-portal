"use client";

import React from "react";
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

  const handleLogout = () => {
    logout();
    router.push("/");
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
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className={`font-medium transition-colors ${
                    pathname === "/dashboard" ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
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
                <Button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm">
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm">회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 네비게이션 (필요시 확장 가능) */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-3 space-y-2">
          <Link href="/" className="block text-gray-600 hover:text-blue-600 font-medium py-1">
            홈
          </Link>
          <Link href="/#samples" className="block text-gray-600 hover:text-blue-600 font-medium py-1">
            샘플 앱
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className="block text-gray-600 hover:text-blue-600 font-medium py-1">
              대시보드
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
