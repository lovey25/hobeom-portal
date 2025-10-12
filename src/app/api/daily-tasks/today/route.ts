import { NextRequest, NextResponse } from "next/server";
import {
  getDailyTasks,
  getDailyTaskLogs,
  toggleTaskCompletion,
  resetDailyTasksForUser,
  saveDailyStats,
  addActivityLog,
} from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";

/**
 * GET /api/daily-tasks/today?date=YYYY-MM-DD
 * 오늘의 할일 및 완료 상태 조회 (리셋 체크 포함)
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
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const lastAccessDate = searchParams.get("lastAccessDate");

    // 마지막 접속일이 다르면 리셋 및 완료율 기록
    if (lastAccessDate && lastAccessDate !== date) {
      await resetDailyTasksForUser(decoded.id, lastAccessDate);
    }

    // 오늘의 할일 목록
    const tasks = await getDailyTasks(decoded.id);

    // 오늘의 완료 로그
    const logs = await getDailyTaskLogs(decoded.id, date);

    // 할일 + 완료 상태 결합
    const tasksWithStatus = tasks.map((task) => {
      const log = logs.find((l) => l.taskId === task.id);
      return {
        ...task,
        isCompleted: log?.isCompleted || false,
        completedAt: log?.completedAt || null,
      };
    });

    // 완료율 계산
    const totalTasks = tasks.length;
    const completedTasks = tasksWithStatus.filter((t) => t.isCompleted).length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : "0.00";

    const response: ApiResponse = {
      success: true,
      message: "오늘의 할일 조회 성공",
      data: {
        date,
        tasks: tasksWithStatus,
        totalTasks,
        completedTasks,
        completionRate: parseFloat(completionRate),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get today tasks API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "오늘의 할일 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/daily-tasks/today
 * 할일 완료 상태 토글
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
    const { taskId, date } = body;

    if (!taskId || !date) {
      const response: ApiResponse = {
        success: false,
        message: "할일 ID와 날짜가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await toggleTaskCompletion(decoded.id, taskId, date);

    // 현재 완료율 계산 및 통계 업데이트
    const tasks = await getDailyTasks(decoded.id);
    const logs = await getDailyTaskLogs(decoded.id, date);
    const totalTasks = tasks.length;
    const completedTasks = logs.filter((l) => l.isCompleted).length;

    await saveDailyStats(decoded.id, date, totalTasks, completedTasks);

    // 활동 로그 추가 (완료된 할일 개수가 의미있을 때만)
    if (completedTasks > 0 && completedTasks % 3 === 0) {
      await addActivityLog(
        decoded.id,
        "task_complete",
        `할일 ${completedTasks}개를 완료했습니다`,
        "5" // 오늘할일 앱 ID
      );
    }

    const response: ApiResponse = {
      success: true,
      message: "할일 상태가 변경되었습니다.",
      data: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : "0.00",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Toggle task completion API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "할일 상태 변경 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
