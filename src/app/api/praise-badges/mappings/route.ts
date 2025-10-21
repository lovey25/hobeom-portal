import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV } from "@/lib/data";
import type { PraiseMapping, ApiResponse } from "@/types";

/**
 * GET /api/praise-badges/mappings
 * 칭찬 매핑 조회
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

    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");

    // 관리자는 모든 매핑 조회 가능
    if (decoded.role === "admin") {
      const response: ApiResponse<PraiseMapping[]> = {
        success: true,
        message: "매핑 목록을 불러왔습니다",
        data: mappings,
      };
      return NextResponse.json(response);
    }

    // 일반 사용자는 자신과 관련된 매핑만 조회 가능
    const userMappings = mappings.filter(
      (m) => m.isActive && (m.giverUserId === decoded.id || m.receiverUserId === decoded.id)
    );

    const response: ApiResponse<PraiseMapping[]> = {
      success: true,
      message: "매핑 목록을 불러왔습니다",
      data: userMappings,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get mappings API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "매핑 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/praise-badges/mappings
 * 새로운 칭찬 매핑 추가 (관리자 전용)
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { giverUserId, receiverUserId } = body;

    if (!giverUserId || !receiverUserId) {
      const response: ApiResponse = {
        success: false,
        message: "칭찬을 주는 사람과 받는 사람을 지정해주세요",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (giverUserId === receiverUserId) {
      const response: ApiResponse = {
        success: false,
        message: "자기 자신에게 칭찬을 줄 수 없습니다",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");

    // 이미 같은 매핑이 존재하는지 확인
    const existingMapping = mappings.find(
      (m) => m.isActive && m.giverUserId === giverUserId && m.receiverUserId === receiverUserId
    );

    if (existingMapping) {
      const response: ApiResponse = {
        success: false,
        message: "이미 동일한 매핑이 존재합니다",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newMapping: PraiseMapping = {
      id: Date.now().toString(),
      giverUserId,
      receiverUserId,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    mappings.push(newMapping);
    await writeCSV("praise-mappings.csv", mappings);

    const response: ApiResponse<PraiseMapping> = {
      success: true,
      message: "매핑이 추가되었습니다",
      data: newMapping,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Add mapping API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "매핑 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/praise-badges/mappings
 * 칭찬 매핑 수정 (관리자 전용)
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: "매핑 ID가 필요합니다",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");
    const index = mappings.findIndex((m) => m.id === id);

    if (index === -1) {
      const response: ApiResponse = {
        success: false,
        message: "매핑을 찾을 수 없습니다",
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (typeof isActive === "boolean") {
      mappings[index].isActive = isActive;
    }

    await writeCSV("praise-mappings.csv", mappings);

    const response: ApiResponse<PraiseMapping> = {
      success: true,
      message: "매핑이 수정되었습니다",
      data: mappings[index],
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Update mapping API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "매핑 수정 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/praise-badges/mappings
 * 칭찬 매핑 삭제 (관리자 전용)
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: "매핑 ID가 필요합니다",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");
    const filteredMappings = mappings.filter((m) => m.id !== id);

    if (filteredMappings.length === mappings.length) {
      const response: ApiResponse = {
        success: false,
        message: "매핑을 찾을 수 없습니다",
      };
      return NextResponse.json(response, { status: 404 });
    }

    await writeCSV("praise-mappings.csv", filteredMappings);

    const response: ApiResponse = {
      success: true,
      message: "매핑이 삭제되었습니다",
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete mapping API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "매핑 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
