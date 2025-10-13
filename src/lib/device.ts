/**
 * 디바이스 정보 감지 유틸리티
 */

export interface DeviceInfo {
  device_name: string; // 예: "Chrome on Windows"
  device_type: "desktop" | "mobile" | "tablet";
  browser: string; // 예: "Chrome", "Safari", "Edge"
  os: string; // 예: "Windows", "macOS", "iOS", "Android"
}

/**
 * User-Agent에서 디바이스 정보 추출
 */
export function detectDeviceInfo(userAgent?: string): DeviceInfo {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");

  // OS 감지
  let os = "Unknown";
  if (/Windows NT 10/.test(ua)) os = "Windows 10";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Mac OS X 10[._](\d+)/.test(ua)) {
    const version = ua.match(/Mac OS X 10[._](\d+)/);
    os = version ? `macOS 10.${version[1]}` : "macOS";
  } else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/iPhone/.test(ua)) os = "iOS";
  else if (/iPad/.test(ua)) os = "iPadOS";
  else if (/Android (\d+)/.test(ua)) {
    const version = ua.match(/Android (\d+)/);
    os = version ? `Android ${version[1]}` : "Android";
  } else if (/Linux/.test(ua)) os = "Linux";
  else if (/CrOS/.test(ua)) os = "ChromeOS";

  // 브라우저 감지
  let browser = "Unknown";
  if (/Edg\//.test(ua) || /Edge\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/SamsungBrowser\//.test(ua)) browser = "Samsung Internet";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";

  // 디바이스 타입 감지
  let device_type: "desktop" | "mobile" | "tablet" = "desktop";
  if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    device_type = "tablet";
  } else if (/iPhone|iPod|Android.*Mobile|Windows Phone/.test(ua)) {
    device_type = "mobile";
  }

  // 디바이스 이름 생성
  const device_name = `${browser} on ${os}`;

  return {
    device_name,
    device_type,
    browser,
    os,
  };
}

/**
 * 디바이스 타입에 따른 아이콘 반환
 */
export function getDeviceIcon(device_type: "desktop" | "mobile" | "tablet"): string {
  switch (device_type) {
    case "desktop":
      return "🖥️";
    case "mobile":
      return "📱";
    case "tablet":
      return "📱"; // 태블릿도 모바일 아이콘 사용
    default:
      return "💻";
  }
}

/**
 * 디바이스 정보를 읽기 쉬운 형태로 포맷
 */
export function formatDeviceInfo(deviceInfo: DeviceInfo): string {
  const icon = getDeviceIcon(deviceInfo.device_type);
  return `${icon} ${deviceInfo.device_name}`;
}
