#!/usr/bin/env node

/**
 * 백그라운드 푸시 알림 스케줄러
 *
 * 매 10분마다 실행되어:
 * 1. 리마인더 시간 체크 (09:00, 12:00, 18:00, 21:00 등)
 * 2. 여행 준비 알림 체크 (D-day 기준)
 * 3. 해당 사용자들에게 푸시 알림 전송
 *
 * 실행: node scripts/push-scheduler.js
 * 또는: npm run push-scheduler
 */

const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const csvParser = require("csv-parser");
const webpush = require("web-push");

// 환경 변수 로드
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

// VAPID 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@hobeom-portal.com";

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("❌ VAPID 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
  process.exit(1);
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const DATA_DIR = path.join(__dirname, "..", "data");

// CSV 읽기 헬퍼
async function readCSV(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const results = [];

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filepath)) {
      resolve([]);
      return;
    }

    fs.createReadStream(filepath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// 푸시 알림 전송
async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("푸시 전송 실패:", error.message);

    // 410 Gone = 구독 만료, 데이터에서 삭제 필요
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log("⚠️  만료된 구독 발견:", subscription.endpoint.substring(0, 50));
      // TODO: subscriptions.csv에서 삭제
    }

    return { success: false, error: error.message };
  }
}

// 리마인더 시간 체크
function shouldSendReminderNow(reminderTimes) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 반복해서 가장 먼저 매칭되는 reminder time 문자열(HH:MM)을 반환하거나 null 반환
  for (const time of reminderTimes) {
    if (!time || typeof time !== "string") continue;
    const parts = time.split(":").map(Number);
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) continue;

    const reminderMinutes = parts[0] * 60 + parts[1];

    // 정확한 시간 또는 10분 이내
    if (currentMinutes >= reminderMinutes && currentMinutes <= reminderMinutes + 10) {
      return `${String(parts[0]).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")}`;
    }
  }

  return null;
}

// 여행 D-day 계산
function getDaysUntilTrip(travelDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripDate = new Date(travelDate);
  tripDate.setHours(0, 0, 0, 0);

  const diffTime = tripDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// 리마인더 메시지 가져오기
function getReminderMessage(hour) {
  const messages = {
    9: { title: "☀️ 좋은 아침이에요!", body: "오늘의 할일을 확인해보세요" },
    12: { title: "🍽️ 점심시간입니다", body: "오늘의 할일 진행 상황을 확인해보세요" },
    18: { title: "🌆 저녁이 되었어요", body: "오늘의 할일을 마무리할 시간입니다" },
    21: { title: "🌙 하루를 마무리하세요", body: "오늘 하루를 정리하고 내일을 준비해보세요" },
  };

  return messages[hour] || { title: "📋 할일 확인", body: "오늘의 할일을 확인해보세요" };
}

// 마지막 알림 시간 추적 (메모리 캐시)
const lastNotificationCache = {};

function getLastNotificationKey(userId, type) {
  return `${userId}-${type}-${new Date().toDateString()}`;
}

function wasNotifiedToday(userId, type) {
  const key = getLastNotificationKey(userId, type);
  return lastNotificationCache[key] === true;
}

function markAsNotified(userId, type) {
  const key = getLastNotificationKey(userId, type);
  lastNotificationCache[key] = true;
}

// 메인 스케줄러 로직
async function checkAndSendNotifications() {
  try {
    console.log(`\n⏰ [${new Date().toLocaleTimeString("ko-KR")}] 알림 체크 시작...`);

    // 1. 구독 정보 로드
    const subscriptions = await readCSV("subscriptions.csv");
    if (subscriptions.length === 0) {
      console.log("📭 구독자가 없습니다");
      return;
    }

    console.log(`📬 구독자 수: ${subscriptions.length}명`);

    // 2. 사용자 설정 로드
    const userSettings = await readCSV("user-settings.csv");

    // 3. 여행 목록 로드
    const tripLists = await readCSV("trip-lists.csv");

    const now = new Date();
    const currentHour = now.getHours();

    // 각 구독자에 대해 체크
    for (const sub of subscriptions) {
      const userId = sub.user_id;

      // 사용자 설정 찾기
      const settings = userSettings.find((s) => s.user_id === userId);
      if (!settings) {
        continue;
      }

      // 구독 객체 생성
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      // 알림 설정 파싱
      const notificationRows = userSettings.filter((s) => s.category === "notifications" && s.user_id === userId);
      const notificationSettings = {};
      notificationRows.forEach((row) => {
        if (row.key === "dailyTasksReminderTimes") {
          try {
            notificationSettings[row.key] = JSON.parse(row.value);
          } catch (error) {
            notificationSettings[row.key] = [];
          }
        } else if (row.key === "travelNotificationDays") {
          notificationSettings[row.key] = parseInt(row.value) || 3;
        } else {
          notificationSettings[row.key] = row.value === "true";
        }
      });

      // === 리마인더 알림 체크 ===
      if (notificationSettings.dailyTasksReminderEnabled) {
        const reminderTimes = notificationSettings.dailyTasksReminderTimes || [];

        // 변경: 매칭된 시간을 얻음 (예: "09:00")
        // const matchedReminderTime = shouldSendReminderNow(reminderTimes);
        const matchedReminderTime = "08:00";

        if (reminderTimes.length > 0 && matchedReminderTime) {
          // 오늘 이미 보냈는지 확인 (시간까지 포함한 고유 키 사용)
          const notifyKey = `reminder-${matchedReminderTime}`; // e.g. reminder-09:00

          if (!wasNotifiedToday(userId, notifyKey)) {
            const hour = Number(matchedReminderTime.split(":")[0]);
            const message = getReminderMessage(hour);

            console.log(`📢 리마인더 전송: ${userId} - ${matchedReminderTime} - ${message.title}`);

            const result = await sendPush(subscription, {
              title: message.title,
              body: message.body,
              data: {
                url: "/dashboard/daily-tasks",
                type: "daily-tasks-reminder",
                scheduledAt: matchedReminderTime,
              },
            });

            if (result.success) {
              markAsNotified(userId, notifyKey);
              console.log(`   ✅ 전송 성공`);
            } else {
              console.log(`   ❌ 전송 실패: ${result.error}`);
            }
          }
        }
      }

      // === 여행 준비 알림 체크 ===
      if (notificationSettings.travelPrepEnabled) {
        const userTrips = tripLists.filter((trip) => trip.user_id === userId);
        const travelNotificationDays = parseInt(notificationSettings.travelNotificationDays || 3);

        for (const trip of userTrips) {
          const daysUntil = getDaysUntilTrip(trip.travel_date);

          // D-day 범위 내이고, 오늘 이미 보내지 않았으면
          if (daysUntil >= 0 && daysUntil <= travelNotificationDays) {
            if (!wasNotifiedToday(userId, `travel-${trip.id}`)) {
              console.log(`✈️  여행 알림 전송: ${userId} - ${trip.name} (D-${daysUntil})`);

              const result = await sendPush(subscription, {
                title: `✈️ ${trip.name} 준비 알림 (D-${daysUntil})`,
                body: `여행이 ${daysUntil}일 남았습니다. 준비물을 확인해보세요!`,
                data: {
                  url: `/dashboard/travel-prep?trip=${trip.id}`,
                  type: "travel-prep",
                },
              });

              if (result.success) {
                markAsNotified(userId, `travel-${trip.id}`);
                console.log(`   ✅ 전송 성공`);
              } else {
                console.log(`   ❌ 전송 실패: ${result.error}`);
              }
            }
          }
        }
      }
    }

    console.log("✅ 알림 체크 완료\n");
  } catch (error) {
    console.error("❌ 알림 체크 중 오류:", error);
  }
}

// 스케줄러 시작
console.log("🚀 호범 포털 푸시 알림 스케줄러 시작");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`⏰ 매 10 분마다 실행됩니다`);
console.log(`📡 VAPID Public Key: ${vapidPublicKey.substring(0, 20)}...`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 초기 실행
checkAndSendNotifications();

// 매 분마다 실행 (*/1 = 1분마다)
cron.schedule("*/10 * * * *", () => {
  checkAndSendNotifications();
});

// 프로세스 종료 처리
process.on("SIGINT", () => {
  console.log("\n\n👋 푸시 스케줄러 종료 중...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 푸시 스케줄러 종료 중...");
  process.exit(0);
});
