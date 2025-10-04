import { NextRequest, NextResponse } from "next/server";
import { getTripItems, addTripItem, updateTripItem, deleteTripItem, calculateBagStats } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/trip-items?tripId={tripId}
 * 특정 여행의 아이템 목록 조회
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

    if (!tripId) {
      const response: ApiResponse = {
        success: false,
        message: "여행 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const items = await getTripItems(tripId);

    const response: ApiResponse = {
      success: true,
      message: "여행 아이템 목록을 가져왔습니다.",
      data: items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Trip items API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "여행 아이템 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/travel-prep/trip-items
 * 여행에 아이템 추가
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
    const { tripListId, itemId, itemType, bagId } = body;

    if (!tripListId || !itemId || !itemType) {
      const response: ApiResponse = {
        success: false,
        message: "필수 정보가 누락되었습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newItem = await addTripItem({
      tripListId,
      itemId,
      itemType,
      bagId,
    });

    const response: ApiResponse = {
      success: true,
      message: "아이템이 추가되었습니다.",
      data: newItem,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Add trip item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/travel-prep/trip-items
 * 여행 아이템 업데이트 (준비 상태, 가방 할당 등)
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
    const { itemId, bagId, isPrepared } = body;

    if (!itemId) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await updateTripItem(itemId, { bagId, isPrepared });

    const response: ApiResponse = {
      success: true,
      message: "아이템이 업데이트되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update trip item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 업데이트 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/travel-prep/trip-items?itemId={itemId}
 * 여행 아이템 삭제
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
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteTripItem(itemId);

    const response: ApiResponse = {
      success: true,
      message: "아이템이 삭제되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete trip item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "아이템 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
