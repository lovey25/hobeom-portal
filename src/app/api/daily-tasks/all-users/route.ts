import { NextRequest, NextResponse } from "next/server";
import { getAllUsersDailyStatus } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/daily-tasks/all-users?date=YYYY-MM-DD
 * 모든 사용자의 오늘 할일 현황 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
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

    // 관리자 권한 체크
    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const allStatus = await getAllUsersDailyStatus(date);

    const response: ApiResponse = {
      success: true,
      message: "전체 사용자 현황 조회 성공",
      data: {
        date,
        users: allStatus,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get all users daily status API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "전체 사용자 현황 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
