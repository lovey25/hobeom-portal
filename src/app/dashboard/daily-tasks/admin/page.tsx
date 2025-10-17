"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { UserDailyStatus } from "@/types";
import { cookieUtils } from "@/lib/cookies";
import { Card } from "@/components/ui/Card";

// 한국 시간으로 오늘 날짜 계산
const getTodayKST = (): string => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const kstTime = new Date(now.getTime() + kstOffset);
  return kstTime.toISOString().split("T")[0];
};

export default function DailyTasksAdminPage() {
  const { setPageTitle } = usePageTitle();
  const [date, setDate] = useState(getTodayKST());
  const [usersStatus, setUsersStatus] = useState<UserDailyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // 할일 추가 모달
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskImportance, setNewTaskImportance] = useState<number>(2);

  useEffect(() => {
    setPageTitle("전체 사용자 할일 현황", "모든 사용자의 오늘 할일 현황을 조회합니다");
    loadUsersStatus();
  }, [setPageTitle, date]);

  const loadUsersStatus = async () => {
    try {
      setIsLoading(true);
      const token = cookieUtils.getToken();

      const response = await fetch(`/api/daily-tasks/all-users?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setUsersStatus(result.data.users);
      }
    } catch (error) {
      console.error("사용자 현황 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getProgressBar = (rate: number) => {
    const filled = Math.round((rate / 100) * 5);
    return "●".repeat(filled) + "○".repeat(5 - filled);
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getImportanceIcon = (importance: number) => {
    if (importance === 3) return "⭐⭐⭐";
    if (importance === 2) return "⭐⭐";
    return "⭐";
  };

  // 할일 추가 모달 열기
  const openAddModal = (userId: string) => {
    setSelectedUserId(userId);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskImportance(2);
    setIsAddModalOpen(true);
  };

  // 할일 추가
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      const token = cookieUtils.getToken();
      const res = await fetch("/api/daily-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          title: newTaskTitle,
          description: newTaskDescription,
          importance: newTaskImportance,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setIsAddModalOpen(false);
        await loadUsersStatus();
        alert("할일이 추가되었습니다.");
      } else {
        alert(result.message || "할일 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("할일 추가 실패:", error);
      alert("할일 추가 중 오류가 발생했습니다.");
    }
  };

  // 할일 삭제
  const handleDeleteTask = async (taskId: string, userName: string) => {
    if (!confirm(`${userName}님의 이 할일을 삭제하시겠습니까?`)) return;

    try {
      const token = cookieUtils.getToken();
      const res = await fetch(`/api/daily-tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        await loadUsersStatus();
        alert("할일이 삭제되었습니다.");
      } else {
        alert(result.message || "할일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("할일 삭제 실패:", error);
      alert("할일 삭제 중 오류가 발생했습니다.");
    }
  };

  // 전체 평균 완료율
  const averageCompletionRate =
    usersStatus.length > 0 ? usersStatus.reduce((sum, user) => sum + user.completionRate, 0) / usersStatus.length : 0;

  // 완료율별 사용자 수
  const highPerformers = usersStatus.filter((u) => u.completionRate >= 80).length;
  const lowPerformers = usersStatus.filter((u) => u.completionRate < 50).length;

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">👥 전체 사용자 할일 현황</h1>
            <p className="text-gray-600 mt-2">모든 사용자의 할일 완료 현황을 확인하세요</p>
          </div>

          {/* 날짜 선택 */}
          <Card className="mb-6">
            <div className="p-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">조회 날짜:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                onClick={() => setDate(getTodayKST())}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                오늘
              </button>
            </div>
          </Card>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-lg font-semibold text-gray-900">전체 사용자</h3>
              <p className="text-3xl font-bold text-blue-600">{usersStatus.length}명</p>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-lg font-semibold text-gray-900">평균 완료율</h3>
              <p className={`text-3xl font-bold ${getCompletionColor(averageCompletionRate)}`}>
                {averageCompletionRate.toFixed(0)}%
              </p>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900">우수 (80% 이상)</h3>
              <p className="text-3xl font-bold text-green-600">{highPerformers}명</p>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900">개선 필요 (50% 미만)</h3>
              <p className="text-3xl font-bold text-red-600">{lowPerformers}명</p>
            </Card>
          </div>

          {/* 사용자 목록 */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사용자별 현황</h2>

              {usersStatus.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500 text-lg">할일이 등록된 사용자가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersStatus
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .map((userStatus) => (
                      <div key={userStatus.userId} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* 사용자 헤더 */}
                        <div
                          className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => toggleUserExpand(userStatus.userId)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">{userStatus.name}</h3>
                              <span className="text-sm text-gray-500">@{userStatus.username}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                완료율:{" "}
                                <span className={`font-bold ${getCompletionColor(userStatus.completionRate)}`}>
                                  {userStatus.completionRate.toFixed(0)}%
                                </span>
                              </span>
                              <span className="text-lg">{getProgressBar(userStatus.completionRate)}</span>
                              <span className="text-sm text-gray-500">
                                {userStatus.completedTasks}/{userStatus.totalTasks}
                              </span>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-600 transform transition-transform ${
                              expandedUsers.has(userStatus.userId) ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* 할일 상세 */}
                        {expandedUsers.has(userStatus.userId) && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            {/* 할일 추가 버튼 */}
                            <div className="mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddModal(userStatus.userId);
                                }}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                할일 추가
                              </button>
                            </div>

                            {userStatus.tasks.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">등록된 할일이 없습니다</p>
                            ) : (
                              <div className="space-y-2">
                                {userStatus.tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      task.isCompleted ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        task.isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"
                                      }`}
                                    >
                                      {task.isCompleted && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-sm font-medium ${
                                          task.isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                                      )}
                                    </div>
                                    <span className="text-sm flex-shrink-0">{getImportanceIcon(task.importance)}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id, userStatus.name);
                                      }}
                                      className="flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="삭제"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 할일 추가 모달 */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">할일 추가</h3>

              <div className="space-y-4">
                {/* 사용자 표시 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용자</label>
                  <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                    {usersStatus.find((u) => u.userId === selectedUserId)?.name} (
                    {usersStatus.find((u) => u.userId === selectedUserId)?.username})
                  </div>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="할일 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="할일 설명 (선택사항)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* 중요도 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">중요도</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() => setNewTaskImportance(level)}
                        className={`flex-1 py-2 px-3 rounded-md border-2 transition-colors ${
                          newTaskImportance === level
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {getImportanceIcon(level)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
