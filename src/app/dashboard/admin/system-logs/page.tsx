"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { cookieUtils } from "@/lib/cookies";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SystemLogsPage() {
  const { setPageTitle } = usePageTitle();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle("시스템 로그", "서버/사용자 활동 로그를 확인할 수 있습니다");
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = cookieUtils.getToken();
      const res = await fetch("/api/activity-logs?limit=200", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      } else {
        setError(data.message || "로그를 불러오는 데 실패했습니다.");
      }
    } catch (e) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">시스템 로그</h1>
            <p className="text-sm text-gray-500">서버 및 사용자 활동 로그를 확인합니다.</p>
          </div>
          <div>
            <Button onClick={loadLogs}>새로고침</Button>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-6 text-center">로딩 중...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : logs.length === 0 ? (
            <div className="p-6">로그가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">시간</th>
                    <th className="px-4 py-2 text-left">사용자</th>
                    <th className="px-4 py-2 text-left">행동</th>
                    <th className="px-4 py-2 text-left">설명</th>
                    <th className="px-4 py-2 text-left">앱</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((l: any) => (
                    <tr key={l.id} className="even:bg-white odd:bg-gray-50">
                      <td className="px-4 py-2">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">{l.username || l.user || l.user_id || "-"}</td>
                      <td className="px-4 py-2">{l.actionType}</td>
                      <td className="px-4 py-2">{l.actionDescription}</td>
                      <td className="px-4 py-2">{l.appId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </ProtectedRoute>
  );
}
