import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증 및 관리자 권한 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: "인증 토큰이 필요합니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    // 모든 사용자 조회
    const users = await getAllUsers();

    const response: ApiResponse = {
      success: true,
      message: "사용자 목록을 가져왔습니다.",
      data: users,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Users API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "사용자 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
