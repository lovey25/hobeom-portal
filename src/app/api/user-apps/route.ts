import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUserAppSettings, updateUserAppVisibility, updateUserAppOrder } from "@/lib/data";

/**
 * GET /api/user-apps - 사용자별 앱 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const settings = await getUserAppSettings(decoded.id);

    return NextResponse.json({
      success: true,
      message: "앱 설정을 불러왔습니다",
      data: settings,
    });
  } catch (error) {
    console.error("GET /api/user-apps error:", error);
    return NextResponse.json({ success: false, message: "앱 설정 조회 실패" }, { status: 500 });
  }
}

/**
 * PUT /api/user-apps - 앱 표시 여부 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { appId, isVisible } = await request.json();

    if (!appId || isVisible === undefined) {
      return NextResponse.json({ success: false, message: "appId와 isVisible이 필요합니다" }, { status: 400 });
    }

    await updateUserAppVisibility(decoded.id, appId, isVisible);

    return NextResponse.json({
      success: true,
      message: "앱 표시 설정이 업데이트되었습니다",
    });
  } catch (error) {
    console.error("PUT /api/user-apps error:", error);
    return NextResponse.json({ success: false, message: "앱 설정 업데이트 실패" }, { status: 500 });
  }
}
