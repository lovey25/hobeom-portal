"use client";

import { useState, useEffect } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { cookieUtils } from "@/lib/cookies";
import { layout, text, grid, state } from "@/styles/design-system";
import type { PraiseMapping, User } from "@/types";

export default function PraiseBadgeAdminPage() {
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState<User[]>([]);
  const [mappings, setMappings] = useState<PraiseMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedGiver, setSelectedGiver] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setPageTitle("칭찬뱃지 관리", "칭찬을 주는 사람과 받는 사람을 매핑하세요");
  }, [setPageTitle]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = cookieUtils.getToken();

      const [usersRes, mappingsRes] = await Promise.all([
        fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/praise-badges/mappings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data || []);
      }

      if (mappingsRes.ok) {
        const data = await mappingsRes.json();
        setMappings(data.data || []);
      }
    } catch (err) {
      setError("데이터 로딩 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedGiver || !selectedReceiver) {
      alert("칭찬을 주는 사람과 받는 사람을 모두 선택해주세요.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          giverUserId: selectedGiver,
          receiverUserId: selectedReceiver,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      alert(data.message);
      setShowAddMapping(false);
      setSelectedGiver("");
      setSelectedReceiver("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "매핑 추가 실패");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleMapping = async (mappingId: string, currentStatus: boolean) => {
    if (!confirm(`이 매핑을 ${currentStatus ? "비활성화" : "활성화"}하시겠습니까?`)) {
      return;
    }

    try {
      const token = cookieUtils.getToken();

      const res = await fetch("/api/praise-badges/mappings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: mappingId,
          isActive: !currentStatus,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      alert(data.message);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "매핑 상태 변경 실패");
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm("이 매핑을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = cookieUtils.getToken();

      const res = await fetch(`/api/praise-badges/mappings?id=${mappingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      alert(data.message);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "매핑 삭제 실패");
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} (${user.username})` : "알 수 없음";
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className={layout.page}>
          <main className={layout.container}>
            <p className={state.loading}>로딩 중...</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className={layout.page}>
        <main className={layout.container}>
          <div className="mb-6">
            <h1 className={text.pageTitle}>🏆 칭찬뱃지 관리</h1>
            <p className={text.description}>칭찬을 주는 사람과 받는 사람을 매핑하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className={text.cardTitle}>👥 칭찬 매핑 관리</h2>
                <Button variant="primary" size="sm" onClick={() => setShowAddMapping(!showAddMapping)}>
                  {showAddMapping ? "취소" : "+ 매핑 추가"}
                </Button>
              </div>

              {showAddMapping && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-4">새 매핑 추가</h3>
                  <div className="space-y-4">
                    <div className={grid.cols2}>
                      <Select
                        label="칭찬을 주는 사람"
                        value={selectedGiver}
                        onChange={(e) => setSelectedGiver(e.target.value)}
                      >
                        <option value="">선택해주세요</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.username}) {u.role === "admin" && "👑"}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label="칭찬을 받는 사람"
                        value={selectedReceiver}
                        onChange={(e) => setSelectedReceiver(e.target.value)}
                      >
                        <option value="">선택해주세요</option>
                        {users
                          .filter((u) => u.role === "user")
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.username})
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddMapping}
                        disabled={adding || !selectedGiver || !selectedReceiver}
                      >
                        {adding ? "추가 중..." : "추가"}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowAddMapping(false)}>
                        취소
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {mappings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤝</div>
                  <p className={text.secondary}>등록된 매핑이 없습니다</p>
                  <p className="text.tertiary mt-2">칭찬을 주는 사람과 받는 사람을 매핑하세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mappings.map((mapping) => (
                    <div key={mapping.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">{getUserName(mapping.giverUserId)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold text-blue-600">{getUserName(mapping.receiverUserId)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={mapping.isActive ? "green" : "gray"}>
                              {mapping.isActive ? "활성" : "비활성"}
                            </Badge>
                            <span className="text.tertiary">
                              생성일: {new Date(mapping.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleMapping(mapping.id, mapping.isActive)}
                          >
                            {mapping.isActive ? "비활성화" : "활성화"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteMapping(mapping.id)}>
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">💡 사용 방법</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  • <strong>칭찬을 주는 사람</strong>: 칭찬뱃지 앱에서 다른 사람에게 칭찬을 줄 수 있습니다
                </p>
                <p>
                  • <strong>칭찬을 받는 사람</strong>: 칭찬뱃지 앱에서 자신이 받은 칭찬을 확인하고 보상을 신청할 수
                  있습니다
                </p>
                <p>• 한 사람이 여러 사람에게 칭찬을 줄 수 있습니다 (여러 매핑 생성)</p>
                <p>• 비활성화된 매핑은 앱에서 표시되지 않습니다</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
