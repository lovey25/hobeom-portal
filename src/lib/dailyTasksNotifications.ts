/**
 * 오늘의 할일 응원 메시지 알림 관리
 */

export interface EncouragementMessage {
  threshold: number; // 완료율 임계값
  title: string;
  body: string;
  icon?: string;
}

/**
 * 완료율에 따른 응원 메시지 정의
 */
export const ENCOURAGEMENT_MESSAGES: EncouragementMessage[] = [
  {
    threshold: 0,
    title: "💪 오늘도 화이팅!",
    body: "오늘의 할일을 시작해보세요!",
  },
  {
    threshold: 25,
    title: "🌟 좋은 시작이에요!",
    body: "25% 완료! 이 기세로 계속 가볼까요?",
  },
  {
    threshold: 50,
    title: "🎉 반 이상 완료!",
    body: "절반을 넘었어요! 잘하고 계세요!",
  },
  {
    threshold: 75,
    title: "🚀 거의 다 왔어요!",
    body: "75% 완료! 조금만 더 힘내세요!",
  },
  {
    threshold: 100,
    title: "🎊 모두 완료!",
    body: "오늘의 할일을 모두 완료했어요! 축하합니다!",
  },
];

/**
 * 마지막 알림 전송 기록을 localStorage에 저장/조회
 */
export function getLastNotificationThreshold(userId: string): number {
  if (typeof window === "undefined") return -1;

  const key = `daily-tasks-last-notification-${userId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();

      // 오늘 날짜가 아니면 초기화
      if (data.date !== today) {
        localStorage.removeItem(key);
        return -1;
      }

      return data.threshold;
    } catch {
      return -1;
    }
  }

  return -1;
}

export function setLastNotificationThreshold(userId: string, threshold: number): void {
  if (typeof window === "undefined") return;

  const key = `daily-tasks-last-notification-${userId}`;
  const today = new Date().toDateString();

  localStorage.setItem(
    key,
    JSON.stringify({
      date: today,
      threshold,
    })
  );
}

/**
 * 완료율에 따라 보낼 메시지 결정 (중복 방지)
 */
export function getEncouragementMessage(completionRate: number, lastThreshold: number): EncouragementMessage | null {
  // 완료율을 정수로 변환 (0-100)
  const rate = Math.floor(completionRate * 100);

  // 해당 완료율에 맞는 메시지 찾기 (내림차순 정렬)
  const sortedMessages = [...ENCOURAGEMENT_MESSAGES].sort((a, b) => b.threshold - a.threshold);

  for (const message of sortedMessages) {
    // 현재 완료율이 임계값 이상이고, 아직 해당 메시지를 보내지 않았다면
    if (rate >= message.threshold && message.threshold > lastThreshold) {
      return message;
    }
  }

  return null;
}

/**
 * 시간대별 인사말
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "좋은 아침이에요! ☀️";
  if (hour >= 12 && hour < 17) return "즐거운 오후 되세요! 🌤️";
  if (hour >= 17 && hour < 21) return "좋은 저녁이에요! 🌆";
  return "편안한 밤 되세요! 🌙";
}

/**
 * 접속 유도 메시지 (시간대별)
 */
export interface ReminderMessage {
  time: string; // "HH:mm" 형식
  title: string;
  body: string;
}

export const REMINDER_MESSAGES: ReminderMessage[] = [
  {
    time: "09:00",
    title: "📝 오늘의 할일",
    body: "좋은 아침이에요! 오늘의 할일을 확인해보세요",
  },
  {
    time: "12:00",
    title: "🍽️ 점심시간",
    body: "점심 식사 후 할일 진행 상황을 체크해보세요",
  },
  {
    time: "18:00",
    title: "🏃 마무리 시간",
    body: "퇴근 전 오늘의 할일을 마무리하세요",
  },
  {
    time: "21:00",
    title: "🌙 하루 정리",
    body: "오늘 하루를 정리하고 내일을 준비해보세요",
  },
];

/**
 * 마지막 접속 유도 알림 시간 저장/조회
 */
export function getLastReminderTime(userId: string): string | null {
  if (typeof window === "undefined") return null;

  const key = `daily-tasks-last-reminder-${userId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();

      // 오늘 날짜가 아니면 초기화
      if (data.date !== today) {
        localStorage.removeItem(key);
        return null;
      }

      return data.time;
    } catch {
      return null;
    }
  }

  return null;
}

export function setLastReminderTime(userId: string, time: string): void {
  if (typeof window === "undefined") return;

  const key = `daily-tasks-last-reminder-${userId}`;
  const today = new Date().toDateString();

  localStorage.setItem(
    key,
    JSON.stringify({
      date: today,
      time,
    })
  );
}

/**
 * 현재 시간에 보낼 알림이 있는지 확인
 */
export function shouldSendReminder(enabledTimes: string[], lastReminderTime: string | null): ReminderMessage | null {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (const reminder of REMINDER_MESSAGES) {
    // 설정된 시간에 포함되어 있고
    if (enabledTimes.includes(reminder.time)) {
      // 아직 오늘 이 시간에 알림을 보내지 않았고
      if (lastReminderTime !== reminder.time) {
        // 현재 시간이 알림 시간과 일치하거나 지났으면 (5분 이내)
        const [reminderHour, reminderMin] = reminder.time.split(":").map(Number);
        const [currentHour, currentMin] = currentTime.split(":").map(Number);

        const reminderMinutes = reminderHour * 60 + reminderMin;
        const currentMinutes = currentHour * 60 + currentMin;

        // 알림 시간에서 +5분 이내면 전송
        if (currentMinutes >= reminderMinutes && currentMinutes <= reminderMinutes + 5) {
          return reminder;
        }
      }
    }
  }

  return null;
}
