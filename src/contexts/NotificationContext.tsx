"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions & { url?: string }) => Promise<void>;
  notifyTaskComplete: (taskTitle: string, url?: string) => Promise<void>;
  notifyTravelItem: (message: string, url?: string) => Promise<void>;
  notifyEncouragement: (title: string, message: string, url?: string) => Promise<void>;
  notifyDailyTasksReminder: (title: string, message: string) => Promise<void>;
  // 사용자 설정 (향후 settings에서 가져올 수 있음)
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  // 푸시 구독
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // 기본값: 활성화

  // 브라우저 지원 확인 및 권한 상태 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // 로컬 스토리지에서 사용자 알림 설정 불러오기
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedSetting = localStorage.getItem(`notification-enabled-${user.id}`);
      if (storedSetting !== null) {
        setIsEnabled(storedSetting === "true");
      }
    }
  }, [isAuthenticated, user]);

  // 푸시 구독
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Push] 구독 시작");

      // 1. 지원 확인
      if (!isSupported) {
        console.warn("푸시 알림이 지원되지 않습니다.");
        return false;
      }

      // 2. 권한 확인
      if (permission !== "granted") {
        console.warn("알림 권한이 필요합니다.");
        return false;
      }

      // 3. Service Worker 확인
      if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker가 지원되지 않습니다.");
        return false;
      }

      // 4. VAPID 공개키 확인
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("VAPID 공개키가 설정되지 않았습니다.");
        return false;
      }

      // 5. Service Worker 준비 대기
      const registration = await navigator.serviceWorker.ready;
      console.log("[Push] Service Worker 준비됨");

      // 6. 기존 구독 확인 및 해제
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("[Push] 기존 구독 존재, 해제 중...");
        await existingSubscription.unsubscribe();
      }

      // 7. 새 구독 생성
      console.log("[Push] 새 구독 생성 중...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
      console.log("[Push] 구독 생성됨:", subscription.endpoint);

      // 8. 서버에 전송 (인증 필요)
      if (!user || !isAuthenticated) {
        console.warn("사용자 인증이 필요합니다.");
        return false;
      }

      const token = localStorage.getItem("hobeom-portal-token") || "";
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

      return result.success;
    } catch (error) {
      console.error("[Push] 구독 오류:", error);
      return false;
    }
  }, [isSupported, permission, user, isAuthenticated]);

  // 푸시 구독 해제
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Push] 구독 해제 시작");

      if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker가 지원되지 않습니다.");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("[Push] 구독 해제됨");

        // 서버에 알림
        if (user && isAuthenticated) {
          const token = localStorage.getItem("hobeom-portal-token") || "";
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }

        return true;
      } else {
        console.log("[Push] 구독이 존재하지 않습니다.");
        return true;
      }
    } catch (error) {
      console.error("[Push] 구독 해제 오류:", error);
      return false;
    }
  }, [user, isAuthenticated]);

  // 권한 변경 시 자동 구독 시도
  useEffect(() => {
    if (isSupported && permission === "granted" && isAuthenticated && user && isEnabled) {
      // 잠시 후에 구독 시도 (Service Worker가 완전히 등록될 시간을 줌)
      const timer = setTimeout(async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          if (!existingSubscription) {
            console.log("[Push] 권한 부여됨, 자동 구독 시도");
            await subscribeToPush();
          }
        } catch (error) {
          console.error("[Push] 자동 구독 실패:", error);
        }
      }, 2000); // 2초 후 시도

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, isAuthenticated, user, isEnabled, subscribeToPush]);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn("알림이 지원되지 않는 브라우저입니다.");
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log(`알림 권한 요청 결과: ${result}`);
      return result;
    } catch (error) {
      console.error("알림 권한 요청 실패:", error);
      return "denied";
    }
  }, [isSupported]);

  // 알림 전송 (Service Worker 사용)
  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions & { url?: string }) => {
      console.log("🔔 알림 전송 시도:", { title, isSupported, isEnabled, permission });

      // 1. 지원 확인
      if (!isSupported) {
        console.warn("❌ 알림이 지원되지 않습니다.");
        return;
      }

      // 2. 사용자 설정 확인
      if (!isEnabled) {
        console.warn("❌ 사용자가 알림을 비활성화했습니다.");
        return;
      }

      // 3. 권한 확인
      if (permission !== "granted") {
        console.warn("❌ 알림 권한이 없습니다. 현재 상태:", permission);
        console.warn("💡 설정 페이지 또는 대시보드 배너에서 알림 권한을 허용해주세요.");
        return;
      }

      // 4. Service Worker 확인
      if (!("serviceWorker" in navigator)) {
        console.warn("❌ Service Worker가 지원되지 않습니다.");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;

        // URL을 data에 포함 (Service Worker의 notificationclick 이벤트에서 사용)
        const notificationOptions: NotificationOptions = {
          body: options?.body || "",
          icon: options?.icon || "/icon-192x192.png",
          badge: options?.badge || "/badge-72x72.png",
          tag: options?.tag || `notification-${Date.now()}`,
          requireInteraction: options?.requireInteraction || false,
          data: {
            url: options?.url || window.location.origin,
            timestamp: Date.now(),
            ...options?.data,
          },
        };

        await registration.showNotification(title, notificationOptions);
        console.log(`✅ 알림 전송: ${title}`);
      } catch (error) {
        console.error("알림 전송 실패:", error);
      }
    },
    [isSupported, isEnabled, permission]
  );

  // 편의 함수: 작업 완료 알림
  const notifyTaskComplete = useCallback(
    async (taskTitle: string, url?: string) => {
      await sendNotification("✅ 작업 완료!", {
        body: `"${taskTitle}" 작업을 완료했습니다.`,
        tag: "task-complete",
        url: url || `${window.location.origin}/dashboard/daily-tasks`,
      });
    },
    [sendNotification]
  );

  // 편의 함수: 여행 준비 알림
  const notifyTravelItem = useCallback(
    async (message: string, url?: string) => {
      await sendNotification("✈️ 여행 준비", {
        body: message,
        tag: "travel-prep",
        url: url || `${window.location.origin}/dashboard/travel-prep`,
      });
    },
    [sendNotification]
  );

  // 편의 함수: 할일 응원 메시지
  const notifyEncouragement = useCallback(
    async (title: string, message: string, url?: string) => {
      await sendNotification(title, {
        body: message,
        tag: "daily-tasks-encouragement",
        requireInteraction: false,
        url: url || `${window.location.origin}/dashboard`,
      });
    },
    [sendNotification]
  );

  // 편의 함수: 할일 접속 유도
  const notifyDailyTasksReminder = useCallback(
    async (title: string, message: string) => {
      await sendNotification(title, {
        body: message,
        tag: "daily-tasks-reminder",
        requireInteraction: false,
        url: `${window.location.origin}/dashboard`,
      });
    },
    [sendNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isSupported,
        requestPermission,
        sendNotification,
        notifyTaskComplete,
        notifyTravelItem,
        notifyEncouragement,
        notifyDailyTasksReminder,
        isEnabled,
        setIsEnabled,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
