// Service Worker for Push Notifications
// 호범 포털 알림 서비스

// const CACHE_NAME = "hobeom-portal-v1"; // Reserved for future caching strategy
const NOTIFICATION_TAG_PREFIX = "hobeom-notification-";

// Service Worker 설치
self.addEventListener("install", () => {
  console.log("[SW] Service Worker installing...");
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activated");
  // 모든 클라이언트를 즉시 제어
  event.waitUntil(self.clients.claim());
});

// 알림 클릭 이벤트
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification.tag);

  event.notification.close();

  // 알림 데이터에서 URL 가져오기
  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (let client of clientList) {
        if (client.url.includes(new URL(urlToOpen, self.location.origin).pathname) && "focus" in client) {
          return client.focus();
        }
      }

      // 열린 탭이 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 알림 닫기 이벤트
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);

  // 분석을 위해 닫힘 이벤트 기록 (선택 사항)
  // 향후 알림 효과 분석에 활용 가능
});

// Push 이벤트 (Web Push API)
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received at", new Date().toISOString());

  // 알림 권한 확인
  if (Notification.permission !== "granted") {
    console.warn("[SW] Notification permission not granted:", Notification.permission);
    return;
  }

  if (!event.data) {
    console.log("[SW] Push event but no data - showing default notification");
    event.waitUntil(
      self.registration
        .showNotification("호범 포털", {
          body: "새로운 알림이 있습니다",
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          requireInteraction: true, // 사용자가 반드시 확인하도록
        })
        .then(() => {
          console.log("[SW] Default notification shown successfully");
        })
        .catch((error) => {
          console.error("[SW] Failed to show default notification:", error);
        })
    );
    return;
  }

  try {
    const payload = event.data.json();
    console.log("[SW] Push payload received:", payload);

    const options = {
      body: payload.body || "새로운 알림이 있습니다",
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/badge-72x72.png",
      data: payload.data || {},
      tag: payload.tag || `${NOTIFICATION_TAG_PREFIX}${payload.data?.type || "push"}-${Date.now()}`,
      requireInteraction: true, // 사용자가 반드시 확인하도록 강제
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200], // 진동 패턴
      timestamp: Date.now(),
    };

    console.log("[SW] Showing notification with options:", options);

    event.waitUntil(
      self.registration
        .showNotification(payload.title || "호범 포털", options)
        .then(() => {
          console.log("[SW] Push notification shown successfully at", new Date().toISOString());
        })
        .catch((error) => {
          console.error("[SW] Failed to show notification:", error);
          // 권한 재확인
          console.log("[SW] Current permission status:", Notification.permission);
        })
    );
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);

    // 파싱 실패 시에도 기본 알림 표시
    event.waitUntil(
      self.registration
        .showNotification("호범 포털", {
          body: "새로운 알림이 있습니다",
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          requireInteraction: true,
        })
        .then(() => {
          console.log("[SW] Fallback notification shown successfully");
        })
        .catch((error) => {
          console.error("[SW] Failed to show fallback notification:", error);
        })
    );
  }
});

// Fetch 이벤트 (선택 사항 - 오프라인 지원)
self.addEventListener("fetch", () => {
  // 현재는 네트워크 우선 전략 사용
  // 향후 캐싱 전략 추가 가능
});

console.log("[SW] Service Worker loaded");
