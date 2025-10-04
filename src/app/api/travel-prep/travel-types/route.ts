import { NextRequest, NextResponse } from "next/server";
import { getTravelTypes } from "@/lib/data";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/travel-types
 * 여행 종류 템플릿 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const travelTypes = await getTravelTypes();

    const response: ApiResponse = {
      success: true,
      message: "여행 종류 목록을 가져왔습니다.",
      data: travelTypes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Travel types API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "여행 종류 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
