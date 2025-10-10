"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export function PortalHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 메인 네비게이션 */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">🏠</span>
              <span className="text-xl font-bold text-gray-900">Hobeom Portal</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                홈
              </Link>
              <Link href="/#samples" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                샘플 앱
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
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
