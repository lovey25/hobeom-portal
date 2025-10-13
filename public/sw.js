// Service Worker for Push Notifications
// 호범 포털 알림 서비스

const CACHE_NAME = "hobeom-portal-v1";
const NOTIFICATION_TAG_PREFIX = "hobeom-notification-";

// Service Worker 설치
self.addEventListener("install", (event) => {
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
  console.log("[SW] Push notification received");

  if (!event.data) {
    console.log("[SW] Push event but no data");
    return;
  }

  try {
    const payload = event.data.json();
    console.log("[SW] Push payload:", payload);

    const options = {
      body: payload.body || "새로운 알림이 있습니다",
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/badge-72x72.png",
      data: payload.data || {},
      tag: payload.tag || `${NOTIFICATION_TAG_PREFIX}${payload.data?.type || "push"}-${Date.now()}`,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200], // 진동 패턴
      timestamp: Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || "호범 포털", options).then(() => {
        console.log("[SW] Push notification shown successfully");
      })
    );
  } catch (error) {
    console.error("[SW] Error parsing push data:", error);

    // 파싱 실패 시에도 기본 알림 표시
    event.waitUntil(
      self.registration.showNotification("호범 포털", {
        body: "새로운 알림이 있습니다",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
      })
    );
  }
});

// Fetch 이벤트 (선택 사항 - 오프라인 지원)
self.addEventListener("fetch", (event) => {
  // 현재는 네트워크 우선 전략 사용
  // 향후 캐싱 전략 추가 가능
});

console.log("[SW] Service Worker loaded");
