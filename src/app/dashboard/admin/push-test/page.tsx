"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { cookieUtils } from "@/lib/cookies";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserSubscription {
  id: string;
  username: string;
  name: string;
  email: string;
  subscriptionCount: number;
  subscriptions: {
    endpoint: string;
    device_name: string;
    device_type: "desktop" | "mobile" | "tablet";
    browser: string;
    os: string;
    last_used: string;
  }[];
}

export default function AdminPushTestPage() {
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 전송 설정
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [title, setTitle] = useState("📢 관리자 메시지");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/dashboard");

  // 전송 결과
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    setPageTitle("푸시 알림 테스트");
    loadUsers();
  }, [setPageTitle]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = cookieUtils.getToken();
      const response = await fetch("/api/admin/push/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.users);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("사용자 목록 로드 오류:", error);
      alert("사용자 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      alert("제목과 내용을 입력하세요");
      return;
    }

    if (!isBroadcast && !selectedUserId) {
      alert("사용자를 선택하세요");
      return;
    }

    const message = isBroadcast
      ? `모든 구독자(${users.reduce((sum, u) => sum + u.subscriptionCount, 0)}개 디바이스)에게 전송하시겠습니까?`
      : selectedEndpoint
      ? `선택한 디바이스에 전송하시겠습니까?`
      : `선택한 사용자의 모든 디바이스(${
          users.find((u) => u.id === selectedUserId)?.subscriptionCount
        }개)에 전송하시겠습니까?`;

    if (!confirm(message)) {
      return;
    }

    try {
      setSending(true);
      const token = cookieUtils.getToken();
      const response = await fetch("/api/admin/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: isBroadcast ? undefined : selectedUserId,
          endpoint: selectedEndpoint || undefined,
          title,
          body,
          url: url || undefined,
          broadcast: isBroadcast,
        }),
      });

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        alert(result.message);
      } else {
        alert(`전송 실패: ${result.message}`);
      }
    } catch (error) {
      console.error("푸시 전송 오류:", error);
      alert("푸시 전송 중 오류가 발생했습니다");
    } finally {
      setSending(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return "📱";
      case "tablet":
        return "📱";
      case "desktop":
        return "🖥️";
      default:
        return "💻";
    }
  };

  // const selectedUser = users.find((u) => u.id === selectedUserId); // Reserved for future UI display

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">푸시 알림 테스트</h1>
          <p className="text-sm text-gray-600 mt-1">구독된 디바이스에 테스트 푸시 알림을 전송합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 사용자 및 디바이스 선택 */}
          <Card>
            <h2 className="text-lg font-bold mb-4">1️⃣ 수신 대상 선택</h2>

            {loading ? (
              <p className="text-gray-500">로딩 중...</p>
            ) : (
              <div className="space-y-4">
                {/* 브로드캐스트 옵션 */}
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={isBroadcast}
                    onChange={() => {
                      setIsBroadcast(true);
                      setSelectedUserId("");
                      setSelectedEndpoint("");
                    }}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">📢 전체 브로드캐스트</div>
                    <div className="text-xs text-gray-600">
                      모든 구독자 ({users.reduce((sum, u) => sum + u.subscriptionCount, 0)}개 디바이스)
                    </div>
                  </div>
                </label>

                {/* 개별 사용자 선택 */}
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={!isBroadcast}
                    onChange={() => setIsBroadcast(false)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">👤 특정 사용자 선택</div>
                    <div className="text-xs text-gray-600">개별 사용자 또는 디바이스 선택</div>
                  </div>
                </label>

                {/* 사용자 목록 */}
                {!isBroadcast && (
                  <div className="ml-8 space-y-2 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="user"
                            checked={selectedUserId === user.id}
                            onChange={() => {
                              setSelectedUserId(user.id);
                              setSelectedEndpoint("");
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {user.name} (@{user.username})
                            </div>
                            <div className="text-xs text-gray-600">{user.subscriptionCount}개 디바이스</div>
                          </div>
                        </label>

                        {/* 디바이스 목록 */}
                        {selectedUserId === user.id && user.subscriptions.length > 0 && (
                          <div className="mt-3 ml-7 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="radio"
                                name="device"
                                checked={selectedEndpoint === ""}
                                onChange={() => setSelectedEndpoint("")}
                                className="w-3 h-3"
                              />
                              <span className="text-blue-600 font-medium">모든 디바이스</span>
                            </label>
                            {user.subscriptions.map((sub, idx) => (
                              <label key={idx} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                  type="radio"
                                  name="device"
                                  checked={selectedEndpoint === sub.endpoint}
                                  onChange={() => setSelectedEndpoint(sub.endpoint)}
                                  className="w-3 h-3"
                                />
                                <span>
                                  {getDeviceIcon(sub.device_type)} {sub.device_name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {users.length === 0 && <p className="text-center text-gray-500 py-4">구독된 사용자가 없습니다</p>}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 오른쪽: 메시지 작성 및 전송 */}
          <Card>
            <h2 className="text-lg font-bold mb-4">2️⃣ 메시지 작성</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="알림 제목" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="알림 내용을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연결 URL (선택)</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/dashboard" />
                <p className="text-xs text-gray-500 mt-1">알림 클릭 시 이동할 페이지</p>
              </div>

              {/* 미리보기 */}
              <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                <p className="text-xs text-gray-600 mb-2">📱 알림 미리보기</p>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-semibold text-gray-900 text-sm">{title || "제목 없음"}</div>
                  <div className="text-gray-700 text-xs mt-1">{body || "내용 없음"}</div>
                </div>
              </div>

              <Button onClick={handleSend} disabled={sending || !title || !body} className="w-full">
                {sending ? "전송 중..." : "🚀 푸시 알림 전송"}
              </Button>

              {/* 전송 결과 */}
              {lastResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    lastResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p className={`font-semibold ${lastResult.success ? "text-green-900" : "text-red-900"}`}>
                    {lastResult.message}
                  </p>
                  {lastResult.data && (
                    <div className="mt-2 text-xs text-gray-700">
                      <p>
                        총 {lastResult.data.total}개 중 성공 {lastResult.data.success}개, 실패 {lastResult.data.failed}
                        개
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 하단: 통계 */}
        {!loading && (
          <Card>
            <h2 className="text-lg font-bold mb-4">📊 구독 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-600">구독 사용자</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.reduce((sum, u) => sum + u.subscriptionCount, 0)}
                </div>
                <div className="text-sm text-gray-600">전체 디바이스</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {users.reduce((sum, u) => sum + u.subscriptions.filter((s) => s.device_type === "desktop").length, 0)}
                </div>
                <div className="text-sm text-gray-600">데스크톱</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {users.reduce((sum, u) => sum + u.subscriptions.filter((s) => s.device_type === "mobile").length, 0)}
                </div>
                <div className="text-sm text-gray-600">모바일</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
