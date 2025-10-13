"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useNotification } from "@/contexts/NotificationContext";
import { cookieUtils } from "@/lib/cookies";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PWAInstallButton } from "@/components/PWAInstallButton";

interface Settings {
  display: {
    dashboardColumns: number;
    cardSize: "small" | "medium" | "large";
    language: string;
  };
  dailyTasks: {
    resetTime: string;
    excludeWeekends: boolean;
    statsPeriod: number;
    completionGoal: number;
  };
  notifications: {
    dailyTasksEnabled: boolean;
    travelPrepEnabled: boolean;
    emailEnabled: boolean;
    travelNotificationDays: number; // 여행 N일 전부터 알림
    encouragementEnabled: boolean; // 응원 메시지
    dailyTasksReminderEnabled: boolean; // 접속 유도 알림
    dailyTasksReminderTimes: string[]; // 알림 시간
  };
}

type TabType = "profile" | "display" | "daily-tasks" | "notifications" | "apps";

export default function SettingsPage() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { permission, isSupported, requestPermission, sendNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingNotification, setTestingNotification] = useState(false);
  const [saving, setSaving] = useState(false);

  // 푸시 구독 상태 (다중 디바이스)
  const [currentDeviceSubscribed, setCurrentDeviceSubscribed] = useState(false); // 현재 디바이스 구독 여부
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]); // 모든 디바이스 구독 목록
  const [currentDeviceEndpoint, setCurrentDeviceEndpoint] = useState<string | null>(null); // 현재 디바이스 endpoint
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // 프로필 상태
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 앱 관리 상태
  const [apps, setApps] = useState<any[]>([]);
  const [userAppSettings, setUserAppSettings] = useState<any[]>([]);
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [dragOverAppId, setDragOverAppId] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle("설정", "개인 설정 및 환경 설정");
  }, [setPageTitle]);

  useEffect(() => {
    fetchSettings();
    fetchApps();
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApps = async () => {
    try {
      const token = cookieUtils.getToken();

      // 관리자는 비활성화된 앱도 포함, 일반 사용자는 활성화된 앱만
      const includeInactive = user?.role === "admin" ? "&includeInactive=true" : "";

      // 모든 카테고리의 앱 목록 가져오기
      const categories = ["public", "dashboard", "admin"];
      const appsPromises = categories.map((category) =>
        fetch(`/api/apps?category=${category}${includeInactive}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      );

      // 사용자 앱 설정
      const settingsRes = await fetch("/api/user-apps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const settingsData = await settingsRes.json();

      const appsResults = await Promise.all(appsPromises);
      const allApps = appsResults.filter((result) => result.success).flatMap((result) => result.data);

      setApps(allApps);
      if (settingsData.success) {
        setUserAppSettings(settingsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    }
  };

  const toggleAppVisibility = async (appId: string, currentVisibility: boolean) => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/user-apps", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appId, isVisible: !currentVisibility }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchApps(); // 재로드
      }
    } catch (error) {
      console.error("Failed to toggle app visibility:", error);
    }
  };

  const toggleAppGlobalStatus = async (appId: string, currentStatus: boolean) => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch(`/api/apps/${appId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchApps(); // 재로드
      }
    } catch (error) {
      console.error("Failed to toggle app global status:", error);
    }
  };

  // 푸시 구독 상태 확인 (다중 디바이스)
  const checkPushSubscription = async () => {
    try {
      console.log("[Push] 구독 상태 확인 중...");

      // 현재 디바이스의 endpoint 가져오기
      const registration = await navigator.serviceWorker.ready;
      const currentSubscription = await registration.pushManager.getSubscription();
      const currentEndpoint = currentSubscription?.endpoint || null;
      setCurrentDeviceEndpoint(currentEndpoint);

      console.log("[Push] 현재 디바이스 endpoint:", currentEndpoint?.substring(0, 50) + "...");

      // 서버에서 모든 구독 목록 가져오기
      const token = cookieUtils.getToken();
      const response = await fetch("/api/push/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      console.log("[Push] 구독 상태 응답:", result);

      if (result.success) {
        const subscriptions = result.data.subscriptions || [];
        setAllSubscriptions(subscriptions);

        // 현재 디바이스가 구독되어 있는지 확인
        const isCurrentDeviceSubscribed = subscriptions.some((sub: any) => sub.endpoint === currentEndpoint);
        setCurrentDeviceSubscribed(isCurrentDeviceSubscribed);

        console.log("[Push] 전체 구독 수:", subscriptions.length);
        console.log("[Push] 현재 디바이스 구독 여부:", isCurrentDeviceSubscribed);
      } else {
        console.error("[Push] 구독 상태 확인 실패:", result.message);
      }
    } catch (error) {
      console.error("[Push] 구독 상태 확인 오류:", error);
    }
  };

  // 푸시 구독
  const handlePushSubscribe = async () => {
    try {
      setIsSubscribing(true);
      console.log("[Push] 구독 시작");

      // 1. 알림 권한 확인
      if (permission !== "granted") {
        const result = await requestPermission();
        if (result !== "granted") {
          alert("알림 권한이 필요합니다");
          return;
        }
      }

      // 2. Service Worker 등록 확인
      const registration = await navigator.serviceWorker.ready;
      console.log("[Push] Service Worker 준비됨");

      // 3. VAPID 공개키 가져오기
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        alert("서버 설정이 완료되지 않았습니다");
        console.error("[Push] VAPID 공개키 없음");
        return;
      }

      // 4. 기존 구독 확인 및 해제
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("[Push] 기존 구독 존재, 해제 중...");
        await existingSubscription.unsubscribe();
      }

      // 5. 푸시 구독 생성
      console.log("[Push] 새 구독 생성 중...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
      console.log("[Push] 구독 생성됨:", subscription.endpoint);

      // 6. 서버에 구독 정보 전송
      const token = cookieUtils.getToken();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      const result = await response.json();
      console.log("[Push] 서버 응답:", result);

      if (result.success) {
        // 상태 즉시 업데이트
        setCurrentDeviceSubscribed(true);
        alert("이 디바이스에서 푸시 알림 구독이 완료되었습니다!");

        // 서버에서 다시 확인 (검증용)
        setTimeout(async () => {
          await checkPushSubscription();
        }, 500);
      } else {
        alert(`구독 실패: ${result.message}`);
      }
    } catch (error: any) {
      console.error("[Push] 구독 오류:", error);
      alert(`구독 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  // 현재 디바이스 푸시 구독 해제
  const handlePushUnsubscribe = async () => {
    if (!currentDeviceEndpoint) {
      alert("현재 디바이스가 구독되어 있지 않습니다");
      return;
    }

    if (!confirm("이 디바이스의 푸시 알림 구독을 해제하시겠습니까?")) {
      return;
    }

    try {
      setIsSubscribing(true);

      // 1. Service Worker의 구독 해제
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // 2. 서버에서 구독 정보 삭제
      const token = cookieUtils.getToken();
      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: currentDeviceEndpoint }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentDeviceSubscribed(false);
        alert("이 디바이스의 푸시 알림 구독이 해제되었습니다");
        await checkPushSubscription();
      } else {
        alert(`구독 해제 실패: ${result.message}`);
      }
    } catch (error: any) {
      console.error("[Push] 구독 해제 오류:", error);
      alert(`구독 해제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  // 특정 디바이스 구독 해제
  const handleRemoveDevice = async (endpoint: string, deviceName: string) => {
    if (!confirm(`"${deviceName}" 디바이스의 구독을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`"${deviceName}" 디바이스의 구독이 해제되었습니다`);
        await checkPushSubscription();
      } else {
        alert(`구독 해제 실패: ${result.message}`);
      }
    } catch (error: any) {
      console.error("[Push] 디바이스 구독 해제 오류:", error);
      alert(`구독 해제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 테스트 푸시 전송
  const handleTestPush = async () => {
    try {
      setTestingPush(true);

      const token = cookieUtils.getToken();
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        alert("테스트 푸시가 전송되었습니다! 곧 알림이 표시됩니다.");
      } else {
        alert(`테스트 푸시 전송 실패: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Test push error:", error);
      alert(`테스트 푸시 전송 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setTestingPush(false);
    }
  };

  useEffect(() => {
    if (user && permission === "granted") {
      checkPushSubscription();
    }
  }, [user, permission]);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", appId);
    setDraggingAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent, appId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingAppId && draggingAppId !== appId) {
      setDragOverAppId(appId);
    }
  };

  const handleDragLeave = () => {
    setDragOverAppId(null);
  };

  const handleDragEnd = () => {
    setDraggingAppId(null);
    setDragOverAppId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetAppId: string, category: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggingAppId || draggingAppId === targetAppId) {
      setDraggingAppId(null);
      setDragOverAppId(null);
      return;
    }

    try {
      const categoryApps = apps
        .filter((app) => app.category === category)
        .sort((a, b) => {
          const aSettings = userAppSettings.find((s) => s.app_id === a.id);
          const bSettings = userAppSettings.find((s) => s.app_id === b.id);
          const aOrder = aSettings?.custom_order ? parseInt(aSettings.custom_order) : parseInt(a.order);
          const bOrder = bSettings?.custom_order ? parseInt(bSettings.custom_order) : parseInt(b.order);
          return aOrder - bOrder;
        });

      const dragIndex = categoryApps.findIndex((app) => app.id === draggingAppId);
      const dropIndex = categoryApps.findIndex((app) => app.id === targetAppId);

      if (dragIndex === -1 || dropIndex === -1) {
        setDraggingAppId(null);
        setDragOverAppId(null);
        return;
      }

      const newApps = [...categoryApps];
      const [draggedApp] = newApps.splice(dragIndex, 1);
      newApps.splice(dropIndex, 0, draggedApp);

      const appOrders = newApps.map((app, index) => ({
        appId: app.id,
        order: index + 1,
      }));

      const token = cookieUtils.getToken();
      const response = await fetch("/api/user-apps/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category, appOrders }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchApps();
      }
    } catch (error) {
      console.error("Failed to reorder apps:", error);
    } finally {
      setDraggingAppId(null);
      setDragOverAppId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        alert("설정이 저장되었습니다.\n대시보드 페이지를 새로고침하면 변경사항이 반영됩니다.");
      } else {
        alert(result.message || "설정 저장 실패");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("설정 저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      await sendNotification("🔔 테스트 알림", {
        body: "알림이 정상적으로 작동합니다!",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: "test-notification",
        requireInteraction: false,
        data: {
          url: window.location.origin + "/dashboard/settings",
        },
      });
      console.log("✅ 테스트 알림이 전송되었습니다.");
    } catch (error) {
      console.error("테스트 알림 전송 실패:", error);
    } finally {
      setTestingNotification(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !email) {
      alert("이름과 이메일을 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      if (result.success) {
        alert("프로필이 업데이트되었습니다");
        // 쿠키의 user 정보 업데이트
        cookieUtils.setUser(result.data);
      } else {
        alert(result.message || "프로필 업데이트 실패");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("모든 필드를 입력해주세요");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다");
      return;
    }

    if (newPassword.length < 6) {
      alert("새 비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setSaving(true);
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();
      if (result.success) {
        alert("비밀번호가 변경되었습니다");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(result.message || "비밀번호 변경 실패");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("비밀번호 변경 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const tabs = [
    { id: "profile" as TabType, label: "프로필", icon: "👤" },
    { id: "display" as TabType, label: "표시", icon: "🎨" },
    { id: "daily-tasks" as TabType, label: "할일", icon: "✅" },
    { id: "notifications" as TabType, label: "알림", icon: "🔔" },
    { id: "apps" as TabType, label: "앱 관리", icon: "📱" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">⚙️ 설정</h1>

          {/* 탭 네비게이션 */}
          <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 프로필 탭 */}
          {activeTab === "profile" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <h2 className="text-lg sm:text-xl font-bold mb-4">기본 정보</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
                    <Input value={user?.username || ""} disabled className="bg-gray-100" />
                    <p className="text-xs text-gray-500 mt-1">사용자명은 변경할 수 없습니다</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <Input
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "저장 중..." : "프로필 저장"}
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg sm:text-xl font-bold mb-4">비밀번호 변경</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? "변경 중..." : "비밀번호 변경"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* 표시 탭 */}
          {activeTab === "display" && (
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4">표시 설정</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">대시보드 열 개수</label>
                  <div className="flex gap-4">
                    {[3, 4, 5, 6].map((cols) => (
                      <button
                        key={cols}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            display: { ...settings.display, dashboardColumns: cols },
                          })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          settings.display.dashboardColumns === cols
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {cols}열
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">대시보드 앱 아이콘 그리드의 열 개수를 설정합니다</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카드 크기</label>
                  <div className="flex gap-4">
                    {[
                      { value: "small", label: "작게" },
                      { value: "medium", label: "보통" },
                      { value: "large", label: "크게" },
                    ].map((size) => (
                      <button
                        key={size.value}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            display: {
                              ...settings.display,
                              cardSize: size.value as "small" | "medium" | "large",
                            },
                          })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          settings.display.cardSize === size.value
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 미리보기 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">미리보기</h3>
                  <div
                    className={`grid gap-2 ${
                      settings.display.dashboardColumns === 3
                        ? "grid-cols-3"
                        : settings.display.dashboardColumns === 4
                        ? "grid-cols-4"
                        : settings.display.dashboardColumns === 5
                        ? "grid-cols-5"
                        : "grid-cols-6"
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6].slice(0, settings.display.dashboardColumns).map((i) => (
                      <div
                        key={i}
                        className={`bg-white rounded-lg border border-gray-200 ${
                          settings.display.cardSize === "small"
                            ? "p-2"
                            : settings.display.cardSize === "large"
                            ? "p-6"
                            : "p-4"
                        }`}
                      >
                        <div className="text-center">
                          <div
                            className={`${
                              settings.display.cardSize === "small"
                                ? "text-xl"
                                : settings.display.cardSize === "large"
                                ? "text-4xl"
                                : "text-3xl"
                            }`}
                          >
                            📱
                          </div>
                          <div
                            className={`font-medium text-gray-900 mt-1 ${
                              settings.display.cardSize === "small" ? "text-xs" : "text-sm"
                            }`}
                          >
                            앱 {i}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">설정이 변경되면 대시보드 페이지에 실시간으로 반영됩니다</p>
                </div>

                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? "저장 중..." : "설정 저장"}
                </Button>
              </div>
            </Card>
          )}

          {/* 할일 탭 */}
          {activeTab === "daily-tasks" && (
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4">할일 설정</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">할일 초기화 시간</label>
                  <Input
                    type="time"
                    value={settings.dailyTasks.resetTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        dailyTasks: { ...settings.dailyTasks, resetTime: e.target.value },
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">매일 이 시간에 할일이 초기화됩니다</p>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.dailyTasks.excludeWeekends}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          dailyTasks: {
                            ...settings.dailyTasks,
                            excludeWeekends: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">주말 제외</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">주말에는 할일을 초기화하지 않습니다</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">통계 기간 (일)</label>
                  <Input
                    type="number"
                    min="7"
                    max="90"
                    value={settings.dailyTasks.statsPeriod}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        dailyTasks: {
                          ...settings.dailyTasks,
                          statsPeriod: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">최근 N일간의 통계를 표시합니다 (7-90일)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">목표 완료율 (%)</label>
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={settings.dailyTasks.completionGoal}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({
                        ...settings,
                        dailyTasks: {
                          ...settings.dailyTasks,
                          completionGoal: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">목표로 하는 완료율입니다 (50-100%)</p>
                </div>

                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? "저장 중..." : "설정 저장"}
                </Button>
              </div>
            </Card>
          )}

          {/* 알림 탭 */}
          {activeTab === "notifications" && (
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4">알림 설정</h2>
              <div className="space-y-6">
                {/* ========== 1단계: 브라우저 알림 권한 ========== */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">1️⃣ 브라우저 알림 권한</h3>
                      <p className="text-xs text-gray-500 mt-1">먼저 브라우저에서 알림을 허용해야 합니다</p>
                    </div>
                    {isSupported && permission === "default" && (
                      <Button onClick={requestPermission} className="ml-4">
                        권한 요청
                      </Button>
                    )}
                  </div>

                  {!isSupported ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">⚠️ 이 브라우저는 알림을 지원하지 않습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 권한 상태 표시 */}
                      <div
                        className={`rounded-lg p-3 ${
                          permission === "granted"
                            ? "bg-green-50 border border-green-200"
                            : permission === "denied"
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {permission === "granted" && (
                            <span className="text-green-800">✅ 권한 허용됨 - 알림을 받을 수 있습니다</span>
                          )}
                          {permission === "denied" && (
                            <span className="text-red-800">🚫 권한 거부됨 - 브라우저 설정에서 변경하세요</span>
                          )}
                          {permission === "default" && (
                            <span className="text-gray-800">❓ 아직 권한을 요청하지 않았습니다</span>
                          )}
                        </div>
                      </div>

                      {/* 테스트 알림 */}
                      {permission === "granted" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800 mb-2">💡 기본 알림 테스트</p>
                          <Button
                            onClick={handleTestNotification}
                            disabled={testingNotification}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            {testingNotification ? "전송 중..." : "🔔 테스트 알림 보내기"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ========== 2단계: PWA 설치 (선택 사항) ========== */}
                <div className="border-b pb-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">2️⃣ 앱으로 설치 (선택 사항)</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      브라우저를 완전히 닫아도 알림을 받으려면 PWA로 설치하세요
                    </p>
                  </div>

                  <PWAInstallButton />

                  <div className="mt-3 text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <b>💡 설치 시 장점:</b>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 브라우저가 완전히 꺼져도 알림 수신 (모바일)</li>
                      <li>• 앱 아이콘으로 빠른 실행</li>
                      <li>• 독립된 창에서 실행 (앱처럼)</li>
                    </ul>
                  </div>
                </div>

                {/* ========== 3단계: 백그라운드 푸시 구독 (다중 디바이스) ========== */}
                {isSupported && permission === "granted" && (
                  <div className="border-b pb-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">3️⃣ 백그라운드 푸시 알림</h3>
                      <p className="text-xs text-gray-500 mt-1">여러 디바이스에서 개별적으로 구독할 수 있습니다</p>
                    </div>

                    {/* 현재 디바이스 구독 상태 */}
                    {currentDeviceSubscribed ? (
                      <div className="space-y-3">
                        {/* 현재 디바이스 구독 상태 */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800 mb-1">✅ 이 디바이스 구독 중</p>
                          <p className="text-xs text-green-700">
                            현재 디바이스에서 리마인더와 여행 알림을 탭이 닫혀있어도 받을 수 있습니다
                          </p>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={handleTestPush}
                            disabled={testingPush}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                          >
                            {testingPush ? "전송 중..." : "🚀 모든 디바이스에 테스트"}
                          </Button>
                          <Button
                            onClick={handlePushUnsubscribe}
                            disabled={isSubscribing}
                            variant="outline"
                            className="text-sm"
                          >
                            {isSubscribing ? "처리 중..." : "이 디바이스 구독 해제"}
                          </Button>
                        </div>

                        {/* 다른 디바이스 목록 */}
                        {allSubscriptions.length > 1 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-blue-900 mb-2">
                              📱 다른 구독 디바이스 ({allSubscriptions.length - 1}개)
                            </p>
                            <div className="space-y-2">
                              {allSubscriptions
                                .filter((sub) => sub.endpoint !== currentDeviceEndpoint)
                                .map((sub, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between bg-white rounded p-2 text-xs"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{sub.device_name}</div>
                                      <div className="text-gray-500 text-[10px]">
                                        {new Date(sub.last_used).toLocaleString("ko-KR")}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveDevice(sub.endpoint, sub.device_name)}
                                      className="text-red-600 hover:text-red-800 font-medium px-2 py-1"
                                    >
                                      제거
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                          💡 <b>테스트 푸시</b>는 구독된 모든 디바이스에 전송됩니다!
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* 미구독 상태 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-800 mb-1">❌ 구독하지 않음</p>
                          <p className="text-xs text-gray-600">
                            백그라운드에서 리마인더와 여행 알림을 받으려면 구독하세요
                          </p>
                        </div>
                        <Button onClick={handlePushSubscribe} disabled={isSubscribing} className="w-full">
                          {isSubscribing ? "구독 중..." : "✅ 푸시 알림 구독하기"}
                        </Button>

                        <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                          ⚠️ <b>중요:</b> 구독 후에도 브라우저는 실행 중이어야 합니다. 브라우저가 완전히 꺼지면 알림을
                          받을 수 없습니다.
                          <br />
                          💡 <b>해결책:</b> 위의 "2️⃣ 앱으로 설치"를 통해 PWA로 설치하면 브라우저 종료와 무관하게 알림을
                          받을 수 있습니다 (모바일 권장)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========== 4단계: 알림 종류별 설정 ========== */}
                <div className="border-b pb-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">4️⃣ 알림 종류 설정</h3>
                    <p className="text-xs text-gray-500 mt-1">받고 싶은 알림 종류를 선택하세요</p>
                  </div>

                  <div className="space-y-3">
                    {/* 할일 알림 */}
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">📋 할일 알림</div>
                        <div className="text-sm text-gray-500">할일 완료 시 알림</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyTasksEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              dailyTasksEnabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5"
                        disabled={!isSupported || permission !== "granted"}
                      />
                    </label>

                    {/* 여행 준비 알림 */}
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">✈️ 여행 준비 알림</div>
                        <div className="text-sm text-gray-500">여행 D-day 알림</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.travelPrepEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              travelPrepEnabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5"
                        disabled={!isSupported || permission !== "granted"}
                      />
                    </label>

                    {/* 여행 알림 시작일 설정 */}
                    {settings.notifications.travelPrepEnabled && (
                      <div className="ml-8 mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">여행</span>
                        <select
                          value={settings.notifications.travelNotificationDays}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                travelNotificationDays: parseInt(e.target.value),
                              },
                            })
                          }
                          className="px-2 py-1 border rounded text-sm bg-white"
                        >
                          <option value={1}>1일</option>
                          <option value={3}>3일</option>
                          <option value={7}>7일</option>
                          <option value={14}>14일</option>
                          <option value={30}>30일</option>
                        </select>
                        <span className="text-gray-600">전부터 알림</span>
                      </div>
                    )}

                    {/* 응원 메시지 */}
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">🎉 할일 응원 메시지</div>
                        <div className="text-sm text-gray-500">완료율 25%, 50%, 75%, 100% 달성 시</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.encouragementEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              encouragementEnabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5"
                        disabled={!isSupported || permission !== "granted"}
                      />
                    </label>

                    {/* 리마인더 알림 */}
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">⏰ 할일 리마인더 알림</div>
                        <div className="text-sm text-gray-500">정해진 시간에 할일 확인 유도</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyTasksReminderEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              dailyTasksReminderEnabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5"
                        disabled={!isSupported || permission !== "granted"}
                      />
                    </label>

                    {/* 리마인더 시간 선택 */}
                    {settings.notifications.dailyTasksReminderEnabled && (
                      <div className="ml-8 mt-2 space-y-2">
                        <div className="text-sm font-medium text-gray-700">알림 시간 선택</div>
                        <div className="flex flex-wrap gap-2">
                          {["09:00", "12:00", "15:00", "18:00", "21:00"].map((time) => (
                            <label
                              key={time}
                              className="flex items-center gap-1 px-2 py-1 bg-white border rounded cursor-pointer hover:bg-blue-50 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={settings.notifications.dailyTasksReminderTimes.includes(time)}
                                onChange={(e) => {
                                  const times = e.target.checked
                                    ? [...settings.notifications.dailyTasksReminderTimes, time]
                                    : settings.notifications.dailyTasksReminderTimes.filter((t) => t !== time);
                                  setSettings({
                                    ...settings,
                                    notifications: {
                                      ...settings.notifications,
                                      dailyTasksReminderTimes: times,
                                    },
                                  });
                                }}
                                className="w-4 h-4"
                              />
                              <span>{time}</span>
                            </label>
                          ))}
                        </div>
                        <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                          💡 푸시 알림 구독 시 선택한 시간에 자동으로 알림이 전송됩니다
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? "저장 중..." : "설정 저장"}
                </Button>
              </div>
            </Card>
          )}

          {/* 앱 관리 탭 */}
          {activeTab === "apps" && (
            <div className="space-y-6">
              {["public", "dashboard", "admin"].map((category) => {
                const categoryLabel =
                  category === "public" ? "🌐 공용 도구" : category === "dashboard" ? "🛠️ 개인 도구" : "👑 관리자 도구";
                const categoryApps = apps
                  .filter((app) => app.category === category)
                  .map((app) => {
                    const setting = userAppSettings.find((s) => s.app_id === app.id);
                    return {
                      ...app,
                      isVisible: setting ? setting.is_visible === "true" : true,
                      customOrder: setting ? parseInt(setting.custom_order) : app.order,
                    };
                  })
                  .sort((a, b) => a.customOrder - b.customOrder);

                if (categoryApps.length === 0) return null;
                if (category === "admin" && user?.role !== "admin") return null;

                return (
                  <Card key={category}>
                    <h2 className="text-lg sm:text-xl font-bold mb-4">{categoryLabel}</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      드래그하여 순서를 변경하거나 토글하여 표시/숨김을 설정하세요
                      {user?.role === "admin" && category !== "admin" && (
                        <span className="block mt-1 text-red-600">
                          👑 관리자: 빨간색 토글로 전체 사용자 대상 활성화/비활성화 가능
                        </span>
                      )}
                    </p>
                    <div className="space-y-2">
                      {categoryApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragOver={(e) => handleDragOver(e, app.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, app.id, category)}
                          onDragEnd={handleDragEnd}
                          className={`relative flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-move ${
                            !app.isActive
                              ? "bg-red-50 border-red-300"
                              : draggingAppId === app.id
                              ? "border-blue-500 bg-blue-50 opacity-50"
                              : dragOverAppId === app.id
                              ? "border-green-500 bg-green-50 border-dashed shadow-lg"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                          } ${!app.isVisible ? "opacity-50" : ""}`}
                        >
                          {dragOverAppId === app.id && draggingAppId !== app.id && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full shadow-md z-10 whitespace-nowrap">
                              ⬇️ 여기에 드롭
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{app.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900">{app.name}</div>
                                {!app.isActive && user?.role === "admin" && (
                                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                    전체 비활성
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{app.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">#{app.customOrder}</span>

                            {/* 관리자 도구가 아닌 경우에만 전체 토글 표시 */}
                            {user?.role === "admin" && category !== "admin" && (
                              <div className="flex flex-col items-end gap-1">
                                <label
                                  className="relative inline-flex items-center cursor-pointer"
                                  title="전체 사용자 대상 활성화/비활성화"
                                >
                                  <input
                                    type="checkbox"
                                    checked={app.isActive}
                                    onChange={() => toggleAppGlobalStatus(app.id, app.isActive)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                                <span className="text-xs text-gray-500">전체</span>
                              </div>
                            )}

                            <div className="flex flex-col items-end gap-1">
                              <label
                                className="relative inline-flex items-center cursor-pointer"
                                title="내 대시보드에 표시/숨김"
                              >
                                <input
                                  type="checkbox"
                                  checked={app.isVisible}
                                  onChange={() => toggleAppVisibility(app.id, app.isVisible)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                              <span className="text-xs text-gray-500">개인</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 사용 팁</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 앱을 드래그하여 순서를 변경할 수 있습니다</li>
                  <li>• 토글 스위치로 앱을 숨기거나 표시할 수 있습니다</li>
                  <li>• 숨긴 앱은 대시보드에서 보이지 않습니다</li>
                  <li>• 변경사항은 대시보드를 새로고침하면 반영됩니다</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
