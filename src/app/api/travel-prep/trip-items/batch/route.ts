import { NextRequest, NextResponse } from "next/server";
import { addTripItemsBatch } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * POST /api/travel-prep/trip-items/batch
 * 여행에 여러 아이템을 한 번에 추가 (배치)
 */
export async function POST(request: NextRequest) {
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
    const { tripListId, items } = body;

    if (!tripListId || !items || !Array.isArray(items) || items.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: "필수 정보가 누락되었거나 올바르지 않습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 모든 아이템이 필수 필드를 가지고 있는지 검증
    for (const item of items) {
      if (!item.itemId || !item.itemType) {
        const response: ApiResponse = {
          success: false,
          message: "각 아이템에 itemId와 itemType이 필요합니다.",
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const newItems = await addTripItemsBatch(tripListId, items);

    const response: ApiResponse = {
      success: true,
      message: `${newItems.length}개의 아이템이 추가되었습니다.`,
      data: newItems,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Batch add trip items API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 일괄 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
