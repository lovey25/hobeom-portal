import { NextRequest, NextResponse } from "next/server";
import { extractUser, successResponse, errorResponse } from "@/lib/apiHelpers";
import { getUserByUsername } from "@/lib/data";
import { AuthResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const decoded = extractUser(request);
    if (!decoded) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    // 사용자 정보 다시 조회 (최신 정보 반영)
    const user = await getUserByUsername(decoded.username);
    if (!user) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 비밀번호 해시는 응답에서 제거
    const { passwordHash, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      message: "토큰이 유효합니다.",
      user: userWithoutPassword as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: "토큰 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
