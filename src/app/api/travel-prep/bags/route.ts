import { NextRequest, NextResponse } from "next/server";
import { getBags, createBag, updateBag, deleteBag } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
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

/**
 * POST /api/travel-prep/bags
 * 새 가방 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { name, width, height, depth, weight } = body;

    // 필수 필드 검증
    if (!name || !width || !height || !depth || !weight) {
      return NextResponse.json({ success: false, message: "모든 필드를 입력해주세요." }, { status: 400 });
    }

    const newBag = await createBag({
      name,
      width: parseFloat(width),
      height: parseFloat(height),
      depth: parseFloat(depth),
      weight: parseFloat(weight),
    });

    const response: ApiResponse = {
      success: true,
      message: "가방이 생성되었습니다.",
      data: newBag,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bag creation error:", error);
    const response: ApiResponse = {
      success: false,
      message: "가방 생성 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/travel-prep/bags
 * 가방 수정
 */
export async function PUT(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, width, height, depth, weight } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "가방 ID가 필요합니다." }, { status: 400 });
    }

    await updateBag(id, {
      ...(name !== undefined && { name }),
      ...(width !== undefined && { width: parseFloat(width) }),
      ...(height !== undefined && { height: parseFloat(height) }),
      ...(depth !== undefined && { depth: parseFloat(depth) }),
      ...(weight !== undefined && { weight: parseFloat(weight) }),
    });

    const response: ApiResponse = {
      success: true,
      message: "가방이 수정되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bag update error:", error);
    const response: ApiResponse = {
      success: false,
      message: "가방 수정 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/travel-prep/bags
 * 가방 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bagId = searchParams.get("id");

    if (!bagId) {
      return NextResponse.json({ success: false, message: "가방 ID가 필요합니다." }, { status: 400 });
    }

    await deleteBag(bagId);

    const response: ApiResponse = {
      success: true,
      message: "가방이 삭제되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bag deletion error:", error);
    const response: ApiResponse = {
      success: false,
      message: "가방 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
