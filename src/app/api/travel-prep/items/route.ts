import { NextRequest, NextResponse } from "next/server";
import { getTravelItems, createTravelItem, updateTravelItem, deleteTravelItem } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/items
 * 여행 준비물 마스터 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const items = await getTravelItems(activeOnly);

    const response: ApiResponse = {
      success: true,
      message: "준비물 목록을 가져왔습니다.",
      data: items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Travel items API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "준비물 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/travel-prep/items
 * 새로운 준비물 아이템 생성
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
    const { name, category, importance, width, height, depth, weight } = body;

    if (!name || !category || importance === undefined || !width || !height || !depth || !weight) {
      const response: ApiResponse = {
        success: false,
        message: "필수 정보가 누락되었습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newItem = await createTravelItem({
      name,
      category,
      importance,
      width: parseFloat(width),
      height: parseFloat(height),
      depth: parseFloat(depth),
      weight: parseFloat(weight),
    });

    const response: ApiResponse = {
      success: true,
      message: "준비물이 추가되었습니다.",
      data: newItem,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create travel item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "준비물 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/travel-prep/items
 * 준비물 아이템 수정
 */
export async function PUT(request: NextRequest) {
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
    const { id, name, category, importance, width, height, depth, weight } = body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await updateTravelItem(id, {
      name,
      category,
      importance,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      depth: depth ? parseFloat(depth) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
    });

    const response: ApiResponse = {
      success: true,
      message: "준비물이 수정되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update travel item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "준비물 수정 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/travel-prep/items?itemId={itemId}
 * 준비물 아이템 삭제 (소프트 삭제)
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

    await deleteTravelItem(itemId);

    const response: ApiResponse = {
      success: true,
      message: "준비물이 삭제되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete travel item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "준비물 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
