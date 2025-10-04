import { NextRequest, NextResponse } from "next/server";
import { getTripLists, createTripList, updateTripListLastUsed } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/travel-prep/trips
 * 사용자의 여행 리스트 조회
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

    const trips = await getTripLists(decoded.id);

    const response: ApiResponse = {
      success: true,
      message: "여행 리스트를 가져왔습니다.",
      data: trips,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Trip lists API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "여행 리스트를 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/travel-prep/trips
 * 새 여행 리스트 생성
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
    const { name, days, type, travelTypeId } = body;

    if (!name || !days || !type) {
      const response: ApiResponse = {
        success: false,
        message: "여행 이름, 일수, 타입은 필수입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newTrip = await createTripList({
      userId: decoded.id,
      travelTypeId,
      name,
      days: parseInt(days),
      type,
    });

    const response: ApiResponse = {
      success: true,
      message: "여행 리스트가 생성되었습니다.",
      data: newTrip,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create trip list API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "여행 리스트 생성 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/travel-prep/trips?id={tripId}
 * 여행 리스트 마지막 사용 시간 업데이트
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

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("id");

    if (!tripId) {
      const response: ApiResponse = {
        success: false,
        message: "여행 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await updateTripListLastUsed(tripId);

    const response: ApiResponse = {
      success: true,
      message: "여행 리스트가 업데이트되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update trip list API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "여행 리스트 업데이트 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
