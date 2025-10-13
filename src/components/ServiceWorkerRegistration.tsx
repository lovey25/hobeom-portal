"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Service Worker 등록
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration.scope);

          // 업데이트 확인
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("🔄 Service Worker updating...");

            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("✨ New Service Worker available");
                // 향후: 사용자에게 새로고침 안내 표시 가능
              }
            });
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // 이미 등록된 Service Worker 확인
      navigator.serviceWorker.ready.then((registration) => {
        console.log("✅ Service Worker is ready:", registration);
      });
    } else {
      console.warn("⚠️ Service Worker is not supported in this browser");
    }
  }, []);

  return null; // UI를 렌더링하지 않음
}
