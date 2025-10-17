import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/data";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { role, passwordReset } = await request.json();
    const { id: userId } = await params;

    if (passwordReset) {
      // 비밀번호 초기화: 기본 비밀번호 "password"로 설정
  const hashedPassword = await bcrypt.hash("password", 10);
      await updateUser(userId, { passwordHash: hashedPassword });

      const response: ApiResponse = {
        success: true,
        message: "비밀번호가 초기화되었습니다. 기본 비밀번호: password",
      };
      return NextResponse.json(response);
    }

    if (!role || !["admin", "user"].includes(role)) {
      const response: ApiResponse = {
        success: false,
        message: "올바른 권한을 선택해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 사용자 권한 업데이트
    await updateUser(userId, { role });

    const response: ApiResponse = {
      success: true,
      message: "사용자 권한이 업데이트되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update user error:", error);
    const response: ApiResponse = {
      success: false,
      message: "사용자 권한 업데이트 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: userId } = await params;

    // 자기 자신을 삭제하려는 경우 방지
    if (decoded.id === userId) {
      const response: ApiResponse = {
        success: false,
        message: "자기 자신의 계정은 삭제할 수 없습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 사용자 삭제
    await deleteUser(userId);

    const response: ApiResponse = {
      success: true,
      message: "사용자가 삭제되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete user error:", error);
    const response: ApiResponse = {
      success: false,
      message: "사용자 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
