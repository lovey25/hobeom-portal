import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUserByUsername } from "@/lib/data";
import { AuthResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response: AuthResponse = {
        success: false,
        message: "토큰이 제공되지 않았습니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyToken(token);
    if (!decoded) {
      const response: AuthResponse = {
        success: false,
        message: "유효하지 않은 토큰입니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // 사용자 정보 다시 조회 (최신 정보 반영)
    const user = await getUserByUsername(decoded.username);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 비밀번호 해시는 응답에서 제거
    const { passwordHash, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      message: "토큰이 유효합니다.",
      user: userWithoutPassword,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Token verification error:", error);
    const response: AuthResponse = {
      success: false,
      message: "토큰 검증 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
