import { NextRequest, NextResponse } from "next/server";
import { deleteTripItemsBatch } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * DELETE /api/travel-prep/trip-items/batch
 * 여행에서 여러 아이템을 한 번에 삭제 (배치)
 */
export async function DELETE(request: NextRequest) {
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
    const itemIdsParam = searchParams.get("itemIds");

    if (!itemIdsParam) {
      const response: ApiResponse = {
        success: false,
        message: "삭제할 아이템 ID 목록이 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 쉼표로 구분된 ID 목록 파싱
    const itemIds = itemIdsParam.split(",").filter((id) => id.trim());

    if (itemIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: "유효한 아이템 ID가 없습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const deletedCount = await deleteTripItemsBatch(itemIds);

    const response: ApiResponse = {
      success: true,
      message: `${deletedCount}개의 아이템이 삭제되었습니다.`,
      data: { deletedCount },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch delete trip items API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 일괄 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
