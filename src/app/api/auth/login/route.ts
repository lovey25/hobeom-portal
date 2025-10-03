import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { getUserByUsername, updateUserLastLogin } from "@/lib/data";
import { ApiResponse, AuthResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      const response: AuthResponse = {
        success: false,
        message: "사용자명과 비밀번호를 입력해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 사용자 찾기
    const user = await getUserByUsername(username);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "존재하지 않는 사용자입니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const response: AuthResponse = {
        success: false,
        message: "비밀번호가 올바르지 않습니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // JWT 토큰 생성
    const token = generateToken(user);

    // 마지막 로그인 시간 업데이트
    try {
      await updateUserLastLogin(user.id);
    } catch (error) {
      console.error("Failed to update last login time:", error);
      // 로그인 시간 업데이트 실패는 로그인 자체를 실패시키지 않음
    }

    // 업데이트된 사용자 정보 다시 조회
    const updatedUser = await getUserByUsername(username);

    // 비밀번호 해시는 응답에서 제거
    const { passwordHash, ...userWithoutPassword } = updatedUser || user;

    const response: AuthResponse = {
      success: true,
      message: "로그인되었습니다.",
      user: userWithoutPassword,
      token,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response: AuthResponse = {
      success: false,
      message: "서버 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
