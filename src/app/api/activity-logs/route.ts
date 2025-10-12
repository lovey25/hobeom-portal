import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getActivityLogs, addActivityLog } from "@/lib/data";

/**
 * GET /api/activity-logs?limit=10 - 사용자 활동 로그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const logs = await getActivityLogs(decoded.id, limit);

    return NextResponse.json({
      success: true,
      message: "활동 로그를 불러왔습니다",
      data: logs,
    });
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ success: false, message: "활동 로그 조회 실패" }, { status: 500 });
  }
}

/**
 * POST /api/activity-logs - 활동 로그 추가
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { actionType, actionDescription, appId } = await request.json();

    if (!actionType || !actionDescription) {
      return NextResponse.json(
        { success: false, message: "actionType과 actionDescription이 필요합니다" },
        { status: 400 }
      );
    }

    await addActivityLog(decoded.id, actionType, actionDescription, appId);

    return NextResponse.json({
      success: true,
      message: "활동 로그가 추가되었습니다",
    });
  } catch (error) {
    console.error("POST /api/activity-logs error:", error);
    return NextResponse.json({ success: false, message: "활동 로그 추가 실패" }, { status: 500 });
  }
}
