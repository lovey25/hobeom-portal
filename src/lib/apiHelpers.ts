import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { ApiResponse } from "@/types";

/**
 * 토큰에서 사용자 정보 추출
 */
export function extractUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return verifyToken(token || "");
}

/**
 * 인증 필요 여부 확인
 */
export function requireAuth(request: NextRequest): { decoded: any; response: null } | { decoded: null; response: NextResponse } {
  const decoded = extractUser(request);
  if (!decoded) {
    return {
      decoded: null,
      response: NextResponse.json<ApiResponse>(
        { success: false, message: "인증이 필요합니다." },
        { status: 401 }
      ),
    };
  }
  return { decoded, response: null };
}

/**
 * 관리자 권한 필요 여부 확인
 */
export function requireAdmin(request: NextRequest): { decoded: any; response: null } | { decoded: null; response: NextResponse } {
  const authResult = requireAuth(request);
  if (authResult.response) return { decoded: null, response: authResult.response };

  if (authResult.decoded.role !== "admin") {
    return {
      decoded: null,
      response: NextResponse.json<ApiResponse>(
        { success: false, message: "관리자 권한이 필요합니다." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(message: string, data?: T, status: number = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status });
}

/**
 * 에러 응답 생성
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json<ApiResponse>({ success: false, message }, { status });
}

/**
 * API 핸들러를 위한 try-catch 래퍼
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  errorMessage: string = "처리 중 오류가 발생했습니다."
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(errorMessage, error);
    return errorResponse(errorMessage);
  }
}
