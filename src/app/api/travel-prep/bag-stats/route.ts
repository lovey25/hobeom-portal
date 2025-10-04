import { NextRequest, NextResponse } from "next/server";
import { calculateBagStats } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/bag-stats?tripId={tripId}
 * 가방별 통계 계산 (무게, 포화도)
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
    const tripId = searchParams.get("tripId");
    const volumeRatio = parseFloat(searchParams.get("volumeRatio") || "0.7");

    if (!tripId) {
      const response: ApiResponse = {
        success: false,
        message: "여행 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const stats = await calculateBagStats(tripId, volumeRatio);

    const response: ApiResponse = {
      success: true,
      message: "가방 통계를 가져왔습니다.",
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bag stats API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "가방 통계를 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
