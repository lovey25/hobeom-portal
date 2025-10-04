import { NextRequest, NextResponse } from "next/server";
import { updateTripItemsBagBatch } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * PATCH /api/travel-prep/trip-items/batch-update-bag
 * 여러 여행 아이템의 가방을 일괄 변경
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { itemIds, bagId } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID 목록이 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!bagId) {
      const response: ApiResponse = {
        success: false,
        message: "가방 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const updatedCount = await updateTripItemsBagBatch(itemIds, bagId);

    const response: ApiResponse = {
      success: true,
      message: `${updatedCount}개의 아이템이 가방으로 이동되었습니다.`,
      data: { updatedCount },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch update bag API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 가방 변경 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
