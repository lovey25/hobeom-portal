import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUserSettings, updateUserSettings } from "@/lib/data";

/**
 * GET /api/settings - 사용자 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const settings = await getUserSettings(decoded.id);

    return NextResponse.json({
      success: true,
      message: "설정을 불러왔습니다",
      data: settings,
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ success: false, message: "설정 조회 실패" }, { status: 500 });
  }
}

/**
 * POST /api/settings - 사용자 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const settings = await request.json();

    await updateUserSettings(decoded.id, settings);

    return NextResponse.json({
      success: true,
      message: "설정이 저장되었습니다",
    });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ success: false, message: "설정 저장 실패" }, { status: 500 });
  }
}
