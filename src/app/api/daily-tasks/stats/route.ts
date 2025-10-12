import { NextRequest, NextResponse } from "next/server";
import { getDailyStats } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/daily-tasks/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 일일 통계 조회
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const stats = await getDailyStats(decoded.id, startDate, endDate);

    const response: ApiResponse = {
      success: true,
      message: "통계 조회 성공",
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get daily stats API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
