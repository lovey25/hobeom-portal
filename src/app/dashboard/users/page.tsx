"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";
import { layout, text, table, state } from "@/styles/design-system";

export default function UsersPage() {
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageTitle("사용자 관리", "시스템 사용자를 관리합니다");
  }, [setPageTitle]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // 토큰을 가져와서 API 호출
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      if (!token) {
        setError("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("사용자 목록을 불러오는 중 오류가 발생했습니다.");
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      if (!token) {
        alert("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
        alert(`사용자 권한이 ${newRole === "admin" ? "관리자" : "사용자"}로 변경되었습니다.`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("권한 변경 중 오류가 발생했습니다.");
      console.error("Failed to update user role:", err);
    }
  };

  const handlePasswordReset = async (userId: string) => {
    if (!confirm("정말로 이 사용자의 비밀번호를 초기화하시겠습니까? 기본 비밀번호 'password'로 설정됩니다.")) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      if (!token) {
        alert("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passwordReset: true }),
      });

      const data = await response.json();

      if (data.success) {
        alert("비밀번호가 초기화되었습니다. 기본 비밀번호: password");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("비밀번호 초기화 중 오류가 발생했습니다.");
      console.error("Failed to reset password:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      if (!token) {
        alert("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // 로컬 상태 업데이트
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        alert("사용자가 삭제되었습니다.");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("사용자 삭제 중 오류가 발생했습니다.");
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className={layout.page}>
        <div className={layout.container}>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className={state.loading}>로딩 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className={text.error}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <Card padding="none">
              <div className={table.container}>
                <table className={table.base}>
                  <thead className={table.thead}>
                    <tr>
                      <th className={table.th}>사용자</th>
                      <th className={table.th}>이메일</th>
                      <th className={table.th}>권한</th>
                      <th className={table.th}>가입일</th>
                      <th className={table.th}>마지막 접속</th>
                      <th className={table.th}>역할</th>
                    </tr>
                  </thead>
                  <tbody className={table.tbody}>
                    {users.map((user) => (
                      <tr key={user.id} className={table.tr}>
                        <td className={table.td}>
                          <div>
                            <div className={table.tdPrimary}>{user.name}</div>
                            <div className={table.tdSecondary}>@{user.username}</div>
                          </div>
                        </td>
                        <td className={table.tdPrimary}>{user.email}</td>
                        <td className={table.td}>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "admin" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role === "admin" ? "관리자" : "사용자"}
                          </span>
                        </td>
                        <td className={table.td}>{new Date(user.createdAt).toLocaleDateString("ko-KR")}</td>
                        <td className={table.td}>
                          {user.lastAccess
                            ? `${new Date(user.lastAccess).toLocaleString("ko-KR")} (로컬)`
                            : "접속 기록 없음"}
                        </td>
                        <td className={table.td}>
                          <div className="flex space-x-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as "admin" | "user")}
                              className="text-xs text-gray-900 border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="user">사용자</option>
                              <option value="admin">관리자</option>
                            </select>
                            <Button
                              onClick={() => handlePasswordReset(user.id)}
                              className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1"
                            >
                              초기화
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1"
                            >
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800 text-sm">
              <strong>✅ 실제 데이터 연동 완료:</strong> 사용자관리 기능이 CSV 데이터와 연결되어 실제로 작동합니다.
            </p>
            <ul className="mt-2 text-green-700 text-sm list-disc list-inside">
              <li>✅ GET /api/users - 사용자 목록 조회</li>
              <li>✅ PATCH /api/users/[id] - 사용자 권한 수정</li>
              <li>✅ DELETE /api/users/[id] - 사용자 삭제</li>
              <li>🔒 관리자 권한 확인 및 자기 자신 삭제 방지</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
