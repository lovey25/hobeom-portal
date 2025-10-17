/**
 * Web Push 알림 유틸리티
 * VAPID 인증 및 푸시 전송 관리
 */

import webpush from "web-push";

// VAPID 키 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@hobeom-portal.com";

// VAPID 키가 설정되어 있으면 web-push 초기화
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("⚠️  VAPID 키가 설정되지 않았습니다. Web Push 기능이 비활성화됩니다.");
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean;
}

/**
 * 단일 사용자에게 푸시 알림 전송
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; message: string }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      success: false,
      message: "VAPID 키가 설정되지 않았습니다",
    };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return {
      success: true,
      message: "푸시 알림 전송 성공",
    };
  } catch (error) {
    console.error("Web-push send error:", error);

    // narrow unknown error
    if (error && typeof error === "object") {
      const errObj = error as { statusCode?: number; message?: string };
      if (errObj.statusCode === 410 || errObj.statusCode === 404) {
        return { success: false, message: "구독이 만료되었습니다" };
      }
      return { success: false, message: errObj.message || "푸시 알림 전송 실패" };
    }

    return { success: false, message: "푸시 알림 전송 실패" };
  }
}

/**
 * VAPID 공개키 가져오기 (클라이언트에서 사용)
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

/**
 * VAPID 설정 상태 확인
 */
export function isVapidConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}
