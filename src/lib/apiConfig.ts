/**
 * 환경별 API 엔드포인트 설정
 */

export const API_CONFIG = {
  // 클라이언트 사이드: 자동으로 현재 호스트 사용
  // 서버 사이드: 정확한 URL 필요
  BASE_URL:
    typeof window !== "undefined"
      ? "" // 브라우저 환경: 상대경로 사용
      : `http://localhost:${process.env.PORT || 3000}`, // Node 환경: 절대경로

  // 환경 정보
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  // 포트
  PORT: process.env.PORT || 3000,

  // 공개 API URL (클라이언트에서 접근 가능)
  PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

export default API_CONFIG;
