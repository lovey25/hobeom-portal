"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useNotification } from "@/contexts/NotificationContext";
import { DailyTask, DailyStat } from "@/types";
import { cookieUtils } from "@/lib/cookies";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  getEncouragementMessage,
  getLastNotificationThreshold,
  setLastNotificationThreshold,
  shouldSendReminder,
  getLastReminderTime,
  setLastReminderTime,
} from "@/lib/dailyTasksNotifications";

// 한국 시간으로 오늘 날짜 계산
const getTodayKST = (): string => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const kstTime = new Date(now.getTime() + kstOffset);
  return kstTime.toISOString().split("T")[0];
};

export default function DailyTasksPage() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const { notifyEncouragement, notifyDailyTasksReminder } = useNotification();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [encouragementEnabled, setEncouragementEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(["09:00", "12:00", "18:00", "21:00"]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    importance: 2,
  });

  useEffect(() => {
    setPageTitle("오늘의 할일 관리", "매일 해야 할 일들을 관리하고 완료율을 확인하세요");
    loadData();
    loadNotificationSettings();
  }, [setPageTitle]);

  // 접속 유도 알림 체크 (1분마다)
  useEffect(() => {
    if (!user || !reminderEnabled) return;

    const checkReminder = () => {
      const lastReminderTime = getLastReminderTime(user.id);
      const reminder = shouldSendReminder(reminderTimes, lastReminderTime);

      if (reminder) {
        notifyDailyTasksReminder(reminder.title, reminder.body);
        setLastReminderTime(user.id, reminder.time);
      }
    };

    // 초기 체크
    checkReminder();

    // 1분마다 체크
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [user, reminderEnabled, reminderTimes, notifyDailyTasksReminder]);

  const loadNotificationSettings = async () => {
    try {
      const token = cookieUtils.getToken();
      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data.notifications) {
        const notif = result.data.notifications;
        setEncouragementEnabled(notif.encouragementEnabled !== false);
        setReminderEnabled(notif.dailyTasksReminderEnabled === true);
        setReminderTimes(notif.dailyTasksReminderTimes || ["09:00", "12:00", "18:00", "21:00"]);
      }
    } catch (error) {
      console.error("알림 설정 로드 실패:", error);
    }
  };

  const checkAndSendEncouragement = async (completedCount: number, totalCount: number) => {
    if (!user || !encouragementEnabled || totalCount === 0) return;

    const completionRate = completedCount / totalCount;
    const lastThreshold = getLastNotificationThreshold(user.id);
    const message = getEncouragementMessage(completionRate, lastThreshold);

    if (message) {
      await notifyEncouragement(message.title, message.body);
      setLastNotificationThreshold(user.id, message.threshold);
      console.log(`✅ 응원 메시지 전송: ${message.title} (완료율: ${Math.floor(completionRate * 100)}%)`);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = cookieUtils.getToken();

      // 할일 목록 로드
      const tasksRes = await fetch("/api/daily-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasksData = await tasksRes.json();

      if (tasksData.success) {
        setTasks(tasksData.data);
      }

      // 최근 30일 통계 로드
      const endDate = getTodayKST();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const statsRes = await fetch(`/api/daily-tasks/stats?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (task?: DailyTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        importance: task.importance,
      });
    } else {
      setEditingTask(null);
      setFormData({ title: "", description: "", importance: 2 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({ title: "", description: "", importance: 2 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = cookieUtils.getToken();

      if (editingTask) {
        // 수정
        const res = await fetch("/api/daily-tasks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId: editingTask.id,
            ...formData,
          }),
        });

        const result = await res.json();

        if (result.success) {
          await loadData();
          closeModal();
        } else {
          alert(result.message || "할일 수정에 실패했습니다.");
        }
      } else {
        // 추가
        const res = await fetch("/api/daily-tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        const result = await res.json();

        if (result.success) {
          await loadData();
          closeModal();
        } else {
          alert(result.message || "할일 추가에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("할일 저장 실패:", error);
      alert("할일 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("이 할일을 삭제하시겠습니까?")) return;

    try {
      const token = cookieUtils.getToken();
      const res = await fetch(`/api/daily-tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        await loadData();
      } else {
        alert(result.message || "할일 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("할일 삭제 실패:", error);
      alert("할일 삭제 중 오류가 발생했습니다.");
    }
  };

  // 할일 선택/해제
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  // 선택된 할일 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedTasks.size === 0) {
      alert("삭제할 할일을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedTasks.size}개의 할일을 삭제하시겠습니까?`)) return;

    try {
      const token = cookieUtils.getToken();
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        fetch(`/api/daily-tasks?taskId=${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      await Promise.all(deletePromises);
      setSelectedTasks(new Set());
      await loadData();
      alert("선택한 할일이 삭제되었습니다.");
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("일괄 삭제 중 오류가 발생했습니다.");
    }
  };

  const getImportanceLabel = (importance: number) => {
    if (importance === 3) return "높음";
    if (importance === 2) return "보통";
    return "낮음";
  };

  const getImportanceColor = (importance: number) => {
    if (importance === 3) return "text-red-600 bg-red-50";
    if (importance === 2) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getImportanceIcon = (importance: number) => {
    if (importance === 3) return "⭐⭐⭐";
    if (importance === 2) return "⭐⭐";
    return "⭐";
  };

  // 최근 7일 평균 완료율
  const recentStats = stats.slice(-7);
  const averageCompletionRate =
    recentStats.length > 0 ? recentStats.reduce((sum, stat) => sum + stat.completionRate, 0) / recentStats.length : 0;

  if (isLoading) {
    return (
      <ProtectedRoute>
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📋 오늘의 할일 관리</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">매일 해야 할 일들을 등록하고 관리하세요</p>
            </div>
            <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              + 할일 추가
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
            <Card className="text-center p-3 sm:p-6">
              <div className="text-xl sm:text-3xl mb-1 sm:mb-2">📝</div>
              <h3 className="text-xs sm:text-lg font-semibold text-gray-900">등록된 할일</h3>
              <p className="text-lg sm:text-3xl font-bold text-blue-600">{tasks.length}개</p>
            </Card>

            <Card className="text-center p-3 sm:p-6">
              <div className="text-xl sm:text-3xl mb-1 sm:mb-2">📈</div>
              <h3 className="text-xs sm:text-lg font-semibold text-gray-900">최근 7일 평균</h3>
              <p className="text-lg sm:text-3xl font-bold text-green-600">{averageCompletionRate.toFixed(0)}%</p>
            </Card>

            <Card className="text-center p-3 sm:p-6">
              <div className="text-xl sm:text-3xl mb-1 sm:mb-2">🔥</div>
              <h3 className="text-xs sm:text-lg font-semibold text-gray-900">연속 기록</h3>
              <p className="text-lg sm:text-3xl font-bold text-orange-600">{stats.length}일</p>
            </Card>
          </div>

          {/* 할일 목록 */}
          <Card className="overflow-hidden">
            <div className="px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">할일 목록</h2>
                {tasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {selectedTasks.size === tasks.length ? "전체 해제" : "전체 선택"}
                    </button>
                    {selectedTasks.size > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        삭제 ({selectedTasks.size})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📋</div>
                  <p className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4">등록된 할일이 없습니다</p>
                  <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
                    첫 할일 추가하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{task.title}</h3>
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${getImportanceColor(
                              task.importance
                            )}`}
                          >
                            {getImportanceIcon(task.importance)}
                          </span>
                        </div>
                        {task.description && <p className="text-xs sm:text-sm text-gray-600">{task.description}</p>}
                      </div>
                      <button
                        onClick={() => openModal(task)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium flex-shrink-0"
                      >
                        편집
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 완료율 그래프 */}
          {stats.length > 0 ? (
            <Card className="mt-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 완료율 추이 (최근 30일)</h2>
                <p className="text-sm text-gray-500 mb-4">총 {stats.length}일의 데이터</p>
                <div className="relative h-64 border-l-2 border-b-2 border-gray-300 pl-2">
                  {/* Y축 라벨 */}
                  <div className="absolute -left-8 top-0 text-xs text-gray-500">100%</div>
                  <div className="absolute -left-8 top-1/2 text-xs text-gray-500">50%</div>
                  <div className="absolute -left-8 bottom-0 text-xs text-gray-500">0%</div>

                  {/* 100% 기준선 */}
                  <div className="absolute top-0 left-0 right-0 border-t border-dashed border-gray-400 opacity-50"></div>
                  {/* 50% 기준선 */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-300 opacity-30"></div>

                  <div className="h-full flex items-end justify-between gap-1">
                    {stats.map((stat, index) => {
                      const rate = parseFloat(stat.completionRate.toString());
                      const height = Math.max(rate, 2); // 최소 2% 높이 보장

                      // 완료율에 따른 색상 결정
                      let barColor = "";
                      if (rate >= 80) {
                        barColor = "bg-green-500 hover:bg-green-600";
                      } else if (rate >= 50) {
                        barColor = "bg-blue-500 hover:bg-blue-600";
                      } else if (rate >= 30) {
                        barColor = "bg-yellow-500 hover:bg-yellow-600";
                      } else {
                        barColor = "bg-red-500 hover:bg-red-600";
                      }

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                          <div className="relative w-full">
                            <div
                              className={`w-full rounded-t transition-colors cursor-pointer ${barColor}`}
                              style={{ height: `${height * 2.4}px` }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {stat.date}: {rate.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          {index % 5 === 0 && (
                            <span className="text-xs text-gray-500 mt-2 absolute" style={{ bottom: "-24px" }}>
                              {stat.date.slice(5)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    80% 이상
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    50-79%
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    30-49%
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    30% 미만
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="mt-8">
              <div className="p-6 text-center">
                <p className="text-gray-500">통계 데이터가 없습니다. 내일부터 데이터가 쌓입니다.</p>
              </div>
            </Card>
          )}
        </div>

        {/* 할일 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingTask ? "할일 수정" : "새 할일 추가"}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="제목"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="할일 제목을 입력하세요"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="할일에 대한 설명을 입력하세요 (선택사항)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">중요도</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, importance: level })}
                        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                          formData.importance === level
                            ? level === 3
                              ? "bg-red-600 text-white"
                              : level === 2
                              ? "bg-yellow-600 text-white"
                              : "bg-gray-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {level === 3 ? "⭐⭐⭐ 높음" : level === 2 ? "⭐⭐ 보통" : "⭐ 낮음"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" onClick={closeModal} className="flex-1 bg-gray-600 hover:bg-gray-700">
                    취소
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {editingTask ? "수정" : "추가"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
