import { NextRequest } from "next/server";
import { getAllUsers } from "@/lib/data";
import { requireAuth, successResponse, errorResponse } from "@/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증 (일반 사용자도 접근 가능)
    const authResult = requireAuth(request);
    if (authResult.response) return authResult.response;

    // 모든 사용자 조회
    const users = await getAllUsers();

    return successResponse("사용자 목록을 가져왔습니다.", users);
  } catch (error) {
    console.error("Users API error:", error);
    return errorResponse("사용자 목록을 가져오는 중 오류가 발생했습니다.");
  }
}
