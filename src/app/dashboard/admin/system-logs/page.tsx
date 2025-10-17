"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { cookieUtils } from "@/lib/cookies";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { layout, text, table, state } from "@/styles/design-system";

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
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className={layout.page}>
        <main className={layout.container}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={text.pageTitle}>시스템 로그</h1>
              <p className={text.description}>서버 및 사용자 활동 로그를 확인합니다</p>
            </div>
            <div>
              <Button onClick={loadLogs}>새로고침</Button>
            </div>
          </div>

          <Card padding="none">
            {isLoading ? (
              <div className="p-6">
                <p className={state.loading}>로딩 중...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <p className={state.error}>{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6">
                <p className={state.empty}>로그가 없습니다.</p>
              </div>
            ) : (
              <div className={table.container}>
                <table className={table.base}>
                  <thead className={table.thead}>
                    <tr>
                      <th className={table.th}>시간</th>
                      <th className={table.th}>사용자</th>
                      <th className={table.th}>행동</th>
                      <th className={table.th}>설명</th>
                      <th className={table.th}>앱</th>
                    </tr>
                  </thead>
                  <tbody className={table.tbody}>
                    {logs.map((l: any) => (
                      <tr key={l.id} className={table.tr}>
                        <td className={table.td}>{new Date(l.timestamp).toLocaleString()}</td>
                        <td className={table.tdPrimary}>{l.username || l.user || l.user_id || "-"}</td>
                        <td className={table.tdPrimary}>{l.actionType}</td>
                        <td className={table.td}>{l.actionDescription}</td>
                        <td className={table.tdSecondary}>{l.appId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
