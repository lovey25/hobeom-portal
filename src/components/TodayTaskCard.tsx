"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DailyTaskWithStatus } from "@/types";
import { cookieUtils } from "@/lib/cookies";

interface TodayTaskCardProps {
  userId: string;
}

export function TodayTaskCard({ userId }: TodayTaskCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [tasks, setTasks] = useState<DailyTaskWithStatus[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage에서 접기/펴기 상태 불러오기
    const savedState = localStorage.getItem("todayTaskCardExpanded");
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    }

    loadTodayTasks();
  }, []);

  const loadTodayTasks = async () => {
    try {
      const token = cookieUtils.getToken();
      const today = new Date().toISOString().split("T")[0];
      const lastAccessDate = localStorage.getItem("lastTaskAccessDate") || today;

      const response = await fetch(`/api/daily-tasks/today?date=${today}&lastAccessDate=${lastAccessDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setTasks(result.data.tasks);
        setTotalTasks(result.data.totalTasks);
        setCompletedTasks(result.data.completedTasks);
        setCompletionRate(result.data.completionRate);

        // 오늘 날짜 저장
        localStorage.setItem("lastTaskAccessDate", today);
      }
    } catch (error) {
      console.error("오늘의 할일 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("todayTaskCardExpanded", newState.toString());
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const token = cookieUtils.getToken();
      const today = new Date().toISOString().split("T")[0];

      const response = await fetch("/api/daily-tasks/today", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId, date: today }),
      });

      const result = await response.json();

      if (result.success) {
        // 상태 업데이트
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task))
        );
        setCompletedTasks(result.data.completedTasks);
        setCompletionRate(parseFloat(result.data.completionRate));
      }
    } catch (error) {
      console.error("할일 상태 변경 실패:", error);
    }
  };

  const handleReorder = async (taskId: string, direction: "up" | "down") => {
    try {
      const token = cookieUtils.getToken();

      const response = await fetch("/api/daily-tasks/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId, direction }),
      });

      const result = await response.json();

      if (result.success) {
        // 목록 새로고침
        await loadTodayTasks();
      }
    } catch (error) {
      console.error("순서 변경 실패:", error);
    }
  };

  const getImportanceIcon = (importance: number) => {
    if (importance === 3) return "⭐⭐⭐";
    if (importance === 2) return "⭐⭐";
    return "⭐";
  };

  const getProgressBar = () => {
    const filled = Math.round((completionRate / 100) * 5);
    return "●".repeat(filled) + "○".repeat(5 - filled);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="text-2xl">📋</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">오늘의 할일</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-600">
                완료율: <span className="font-bold text-blue-600">{completionRate.toFixed(0)}%</span>
              </span>
              <span className="text-lg">{getProgressBar()}</span>
              <span className="text-sm text-gray-500">
                {completedTasks}/{totalTasks}
              </span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white rounded-lg transition-colors">
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 할일 목록 */}
      {isExpanded && (
        <div className="p-4">
          {totalTasks === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">등록된 할일이 없습니다</p>
              <button
                onClick={() => router.push("/dashboard/daily-tasks")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                할일 추가하기
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      task.isCompleted
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {/* 순서 변경 버튼 */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(task.id, "up");
                        }}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-colors ${
                          index === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title="위로 이동"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(task.id, "down");
                        }}
                        disabled={index === tasks.length - 1}
                        className={`p-0.5 rounded transition-colors ${
                          index === tasks.length - 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title="아래로 이동"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        task.isCompleted ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-blue-500"
                      }`}
                    >
                      {task.isCompleted && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          task.isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>}
                    </div>
                    <span className="text-sm flex-shrink-0">{getImportanceIcon(task.importance)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/dashboard/daily-tasks")}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                할일 관리 →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
