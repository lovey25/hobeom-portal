"use client";

import React from "react";
import { useNotification } from "@/contexts/NotificationContext";
import { Button } from "./ui/Button";

export function NotificationPermissionBanner() {
  const { permission, isSupported, requestPermission, subscribeToPush } = useNotification();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isSubscribing, setIsSubscribing] = React.useState(false);

  // 권한이 이미 부여되었거나 거부되었거나 지원되지 않으면 배너를 숨김
  if (!isSupported || permission !== "default" || !isVisible) {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result === "granted") {
        // 권한 부여됨, 푸시 구독 시도
        setIsSubscribing(true);
        const subscribed = await subscribeToPush();
        if (subscribed) {
          console.log("푸시 알림 구독 완료");
        } else {
          console.warn("푸시 알림 구독 실패");
        }
        setIsVisible(false); // 성공/실패 모두 배너 숨김
      } else if (result === "denied") {
        setIsVisible(false); // 거부 시 배너 숨김
      }
    } finally {
      setIsRequesting(false);
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // 로컬 스토리지에 배너 숨김 기록 (선택사항)
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-4">
      <div className="flex-shrink-0 text-2xl">🔔</div>
      <div className="flex-1">
        <h3 className="font-semibold text-blue-900 mb-1">알림 받기</h3>
        <p className="text-sm text-blue-700 mb-3">작업 완료 시 알림을 받으려면 알림 권한을 허용해주세요.</p>
        <div className="flex gap-2">
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting || isSubscribing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
          >
            {isRequesting ? "권한 요청 중..." : isSubscribing ? "구독 중..." : "알림 허용"}
          </Button>
          <Button onClick={handleDismiss} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 text-sm">
            나중에
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}
