import { NextRequest, NextResponse } from "next/server";
import { updateAppGlobalStatus } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const decoded = verifyToken(token || "");

    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        message: "인증이 필요합니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // 관리자 권한 확인
    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      const response: ApiResponse = {
        success: false,
        message: "isActive 값이 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

  const { id: appId } = await params;
    await updateAppGlobalStatus(appId, isActive);

    const response: ApiResponse = {
      success: true,
      message: `앱이 ${isActive ? "활성화" : "비활성화"}되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("App global status update error:", error);
    const response: ApiResponse = {
      success: false,
      message: "앱 상태 변경 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
