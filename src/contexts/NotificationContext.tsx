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

  // 설정 변경 시 로컬 스토리지에 저장
  const handleSetIsEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabled(enabled);
      if (user) {
        localStorage.setItem(`notification-enabled-${user.id}`, enabled.toString());
      }
    },
    [user]
  );

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
        url: url || `${window.location.origin}/dashboard/daily-tasks`,
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
        url: `${window.location.origin}/dashboard/daily-tasks`,
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
        setIsEnabled: handleSetIsEnabled,
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
