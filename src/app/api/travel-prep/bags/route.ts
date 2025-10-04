import { NextRequest, NextResponse } from "next/server";
import { getBags } from "@/lib/data";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/bags
 * 가방 마스터 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const bags = await getBags(activeOnly);

    const response: ApiResponse = {
      success: true,
      message: "가방 목록을 가져왔습니다.",
      data: bags,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bags API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "가방 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
