"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BrowserType = "chrome" | "edge" | "safari" | "firefox" | "samsung" | "unknown";
type Platform = "ios" | "android" | "desktop";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [browser, setBrowser] = useState<BrowserType>("unknown");
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    console.log("[PWA] 컴포넌트 마운트");

    // 브라우저 및 플랫폼 감지
    const ua = navigator.userAgent;
    let detectedBrowser: BrowserType = "unknown";
    let detectedPlatform: Platform = "desktop";

    // 플랫폼 감지
    if (/iPhone|iPad|iPod/.test(ua)) {
      detectedPlatform = "ios";
    } else if (/Android/.test(ua)) {
      detectedPlatform = "android";
    } else {
      detectedPlatform = "desktop";
    }

    // 브라우저 감지
    if (ua.includes("Edg/") || ua.includes("Edge/")) {
      detectedBrowser = "edge";
    } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
      detectedBrowser = "chrome";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
      detectedBrowser = "safari";
    } else if (ua.includes("Firefox/")) {
      detectedBrowser = "firefox";
    } else if (ua.includes("SamsungBrowser/")) {
      detectedBrowser = "samsung";
    }

    setPlatform(detectedPlatform);
    setBrowser(detectedBrowser);

    console.log("[PWA] 브라우저:", detectedBrowser, "플랫폼:", detectedPlatform);
    console.log("[PWA] HTTPS:", window.location.protocol === "https:" || window.location.hostname === "localhost");
    console.log("[PWA] User Agent:", ua.substring(0, 100) + "...");

    // PWA가 이미 설치되었는지 확인
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

    console.log("[PWA] Standalone mode:", isStandalone);

    if (isStandalone) {
      setIsInstalled(true);
      console.log("[PWA] 이미 설치됨");
      return;
    }

    // beforeinstallprompt 이벤트 캐치
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("[PWA] ✅ 설치 프롬프트 준비됨! 설치 버튼이 활성화됩니다.");
    };

    // 설치 완료 이벤트
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[PWA] 설치 완료");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    console.log("[PWA] 이벤트 리스너 등록됨, beforeinstallprompt 대기 중...");

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      // 설치 프롬프트 표시
      await deferredPrompt.prompt();

      // 사용자 선택 대기
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("사용자가 PWA 설치 수락");
      } else {
        console.log("사용자가 PWA 설치 거부");
      }

      // 프롬프트는 한 번만 사용 가능
      setDeferredPrompt(null);
    } catch (error) {
      console.error("PWA 설치 중 오류:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  // 이미 설치됨
  if (isInstalled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-800">
          ✅ <b>PWA로 설치됨</b>
          <br />
          <span className="text-xs">브라우저가 꺼져도 백그라운드 알림을 받을 수 있습니다!</span>
        </p>
      </div>
    );
  }

  // 설치 가능한 경우
  if (deferredPrompt) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800 mb-3">
          📱 <b>앱으로 설치 가능</b>
          <br />
          <span className="text-xs">설치하면 브라우저가 완전히 꺼져도 백그라운드 알림을 받을 수 있습니다</span>
        </p>
        <Button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm w-full"
        >
          {isInstalling ? "설치 중..." : "🚀 앱으로 설치하기"}
        </Button>
      </div>
    );
  }

  // 수동 설치 안내
  console.log("[PWA] 수동 설치 안내 표시 (beforeinstallprompt 이벤트 없음)");

  const getManualInstallGuide = () => {
    if (platform === "ios") {
      return (
        <div className="space-y-2">
          <div className="font-medium text-blue-600">📱 iOS/iPadOS Safari:</div>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
            <li>Safari 브라우저에서 이 페이지를 엽니다</li>
              <li>
              하단 중앙의 <b className="text-blue-600">공유 버튼 (⎋)</b>을 탭합니다
            </li>
            <li>
              스크롤하여 <b className="text-blue-600">&quot;홈 화면에 추가&quot;</b>를 선택합니다
            </li>
            <li>오른쪽 상단의 &quot;추가&quot; 버튼을 탭합니다</li>
          </ol>
        </div>
      );
    }

    if (platform === "android") {
      if (browser === "chrome" || browser === "samsung") {
        return (
          <div className="space-y-2">
            <div className="font-medium text-blue-600">🤖 Android Chrome/Samsung:</div>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>
                주소창 오른쪽의 <b className="text-blue-600">점 3개 메뉴 (⋮)</b>를 탭합니다
              </li>
              <li>
                <b className="text-blue-600">&quot;앱 설치&quot;</b> 또는 <b className="text-blue-600">&quot;홈 화면에 추가&quot;</b>를
                선택합니다
              </li>
              <li>&quot;설치&quot; 버튼을 탭합니다</li>
            </ol>
            <div className="text-[10px] text-amber-600 mt-2">💡 주소창에 설치 아이콘이 보이면 바로 탭하셔도 됩니다</div>
          </div>
        );
      }
    }

    // Desktop
    if (browser === "chrome" || browser === "edge") {
      return (
        <div className="space-y-2">
          <div className="font-medium text-blue-600">🖥️ Desktop {browser === "chrome" ? "Chrome" : "Edge"}:</div>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>
              주소창 오른쪽의 <b className="text-blue-600">설치 아이콘 (⊕)</b>을 클릭합니다
              <br />
              <span className="text-gray-500 text-[10px]">(아이콘이 없으면 아래 2번 방법 시도)</span>
            </li>
            <li>
              또는 오른쪽 상단 <b className="text-blue-600">점 3개 메뉴 (⋮)</b> → <b>&quot;앱 설치&quot;</b> 클릭
            </li>
          </ol>
        </div>
      );
    }

    // 기타 브라우저
    return (
      <div className="space-y-2">
        <div className="font-medium text-amber-600">⚠️ 브라우저 제한</div>
        <p className="text-[11px]">
          현재 브라우저는 PWA 설치를 지원하지 않습니다.
          <br />
          <b className="text-blue-600">Chrome, Edge, Safari</b>에서 접속해주세요.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-4">
      <div className="mb-3">
        <div className="text-sm font-bold text-gray-900 mb-1">💡 앱으로 설치하기 (PWA)</div>
        <div className="text-[10px] text-gray-600">
          자동 설치 버튼이 나타나지 않습니다. 아래 방법으로 수동 설치하세요.
        </div>
      </div>

      {getManualInstallGuide()}

      <div className="mt-3 pt-3 border-t border-gray-300 text-[10px] text-gray-600 space-y-1">
        <div>
          <b>설치 후 장점:</b>
        </div>
        <ul className="list-disc list-inside pl-2 space-y-0.5">
          <li>앱 아이콘으로 빠른 실행</li>
          <li>독립된 창에서 실행 (앱처럼)</li>
          <li>브라우저 꺼져도 알림 수신 (모바일)</li>
        </ul>
      </div>

      <div className="mt-2 text-[9px] text-gray-500 italic">※ 이미 설치했다면 이 안내는 무시하셔도 됩니다</div>
    </div>
  );
}
