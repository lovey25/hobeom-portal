"use client";

import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { setPageTitle } = usePageTitle();
  const router = useRouter();

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle("로그인", "계정에 로그인하여 모든 기능을 이용하세요");
  }, [setPageTitle]);

  // 이미 로그인된 경우 대시보드로 리디렉션
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // 리디렉션 중
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm />

        <div className="text-center text-sm text-gray-600">
          <p>
            테스트 계정: <span className="font-mono bg-gray-100 px-2 py-1 rounded">admin / password</span>
          </p>
        </div>
      </div>
    </div>
  );
}
