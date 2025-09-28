"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              📊 대시보드
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              안녕하세요, <span className="font-medium">{user?.name}</span>님
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                홈으로
              </Link>
              <span className="text-gray-400">|</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
