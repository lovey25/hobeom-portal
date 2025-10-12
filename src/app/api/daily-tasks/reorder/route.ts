import { NextRequest, NextResponse } from "next/server";
import { reorderDailyTasks } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * PATCH /api/daily-tasks/reorder
 * 할일 순서 변경
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
    const { taskId, direction } = body;

    if (!taskId || !direction) {
      const response: ApiResponse = {
        success: false,
        message: "taskId와 direction이 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (direction !== "up" && direction !== "down") {
      const response: ApiResponse = {
        success: false,
        message: "direction은 'up' 또는 'down'이어야 합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await reorderDailyTasks(decoded.id, taskId, direction);

    const response: ApiResponse = {
      success: true,
      message: "순서가 변경되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Reorder daily tasks API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "순서 변경 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
