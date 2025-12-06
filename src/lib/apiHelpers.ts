import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";
import jwt from "jsonwebtoken";
import { ApiResponse } from "@/types";

/**
 * 토큰에서 사용자 정보 추출
 */
export function extractUser(request: NextRequest): jwt.JwtPayload | null {
  // Authorization 헤더에서 토큰 확인
  let token = request.headers.get("authorization")?.replace("Bearer ", "");

  // 헤더에 없으면 쿠키에서 확인
  if (!token) {
    token = request.cookies.get("hobeom-portal-token")?.value;
  }

  return verifyToken(token || "");
}

/**
 * 인증 필요 여부 확인
 */
export function requireAuth(
  request: NextRequest
): { decoded: jwt.JwtPayload | null; response: null } | { decoded: null; response: NextResponse } {
  const decoded = extractUser(request);
  if (!decoded) {
    return {
      decoded: null,
      response: NextResponse.json<ApiResponse>({ success: false, message: "인증이 필요합니다." }, { status: 401 }),
    };
  }
  return { decoded, response: null };
}

/**
 * 관리자 권한 필요 여부 확인
 */
export function requireAdmin(
  request: NextRequest
): { decoded: jwt.JwtPayload | null; response: null } | { decoded: null; response: NextResponse } {
  const authResult = requireAuth(request);
  if (authResult.response) return { decoded: null, response: authResult.response };

  if ((authResult.decoded as jwt.JwtPayload).role !== "admin") {
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
export function withErrorHandler<T = any>(handler: (req: NextRequest, context?: T) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("처리 중 오류가 발생했습니다.", error);
      return errorResponse(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
    }
  };
}

/**
 * 인증 필요 (Promise 버전 - throws error on unauthorized)
 */
export async function requireAuthOrThrow(request: NextRequest): Promise<jwt.JwtPayload> {
  const decoded = extractUser(request);
  if (!decoded) {
    throw new Error("인증이 필요합니다.");
  }
  return decoded;
}
