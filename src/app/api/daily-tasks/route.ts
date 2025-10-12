import { NextRequest, NextResponse } from "next/server";
import { getDailyTasks, createDailyTask, updateDailyTask, deleteDailyTask } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/daily-tasks
 * 사용자의 할일 목록 조회
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

    const tasks = await getDailyTasks(decoded.id);

    const response: ApiResponse = {
      success: true,
      message: "할일 목록 조회 성공",
      data: tasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get daily tasks API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "할일 목록 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/daily-tasks
 * 할일 추가 (관리자는 targetUserId 지정 가능)
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
    const { title, description, importance, targetUserId } = body;

    if (!title) {
      const response: ApiResponse = {
        success: false,
        message: "제목은 필수입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 관리자가 다른 사용자의 할일을 추가하는 경우
    let userId = decoded.id;
    if (targetUserId && decoded.role === "admin") {
      userId = targetUserId;
    }

    const newTask = await createDailyTask({
      userId,
      title,
      description: description || "",
      importance: importance || 2,
    });

    const response: ApiResponse = {
      success: true,
      message: "할일이 추가되었습니다.",
      data: newTask,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Create daily task API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "할일 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/daily-tasks
 * 할일 수정
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
    const { taskId, title, description, importance } = body;

    if (!taskId) {
      const response: ApiResponse = {
        success: false,
        message: "할일 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await updateDailyTask(taskId, { title, description, importance });

    const response: ApiResponse = {
      success: true,
      message: "할일이 수정되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Update daily task API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "할일 수정 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/daily-tasks?taskId=xxx
 * 할일 삭제
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
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      const response: ApiResponse = {
        success: false,
        message: "할일 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteDailyTask(taskId);

    const response: ApiResponse = {
      success: true,
      message: "할일이 삭제되었습니다.",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete daily task API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "할일 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
