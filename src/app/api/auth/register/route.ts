import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByUsername, getUserByEmail, initializeUserAppSettings } from "@/lib/data";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { username, email, name, password } = await request.json();

    // 입력값 검증
    if (!username || !email || !name || !password) {
      const response: ApiResponse = {
        success: false,
        message: "모든 필드를 입력해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (password.length < 6) {
      const response: ApiResponse = {
        success: false,
        message: "비밀번호는 최소 6자 이상이어야 합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response: ApiResponse = {
        success: false,
        message: "올바른 이메일 형식을 입력해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 사용자명 중복 검사
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      const response: ApiResponse = {
        success: false,
        message: "이미 존재하는 사용자명입니다.",
      };
      return NextResponse.json(response, { status: 409 });
    }

    // 이메일 중복 검사
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      const response: ApiResponse = {
        success: false,
        message: "이미 존재하는 이메일입니다.",
      };
      return NextResponse.json(response, { status: 409 });
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const newUser = await createUser({
      username,
      email,
      name,
      passwordHash,
      role: "user", // 기본적으로 일반 사용자로 생성
    });

    // 사용자 앱 설정 초기화
    await initializeUserAppSettings(newUser.id);

    const response: ApiResponse = {
      success: true,
      message: "회원가입이 완료되었습니다.",
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Register API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "회원가입 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
