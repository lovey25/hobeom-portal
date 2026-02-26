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
// CSV 쓰기 헬퍼 (간단 직렬화)
async function writeCSV(filename, rows) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!rows || rows.length === 0) {
      fs.writeFileSync(filepath, "", "utf8");
      return;
    }

    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [headers.join(",")].concat(rows.map((r) => headers.map((h) => escape(r[h])).join(",")));
    fs.writeFileSync(filepath, lines.join("\n"), "utf8");
  } catch (e) {
    console.error("[writeCSV] 파일 쓰기 실패:", e && e.message ? e.message : e);
  }
}

// subscriptions.csv에서 endpoint로 항목 제거
async function removeSubscriptionFromCSV(endpoint) {
  try {
    const rows = await readCSV("subscriptions.csv");
    const filtered = rows.filter((r) => r.endpoint !== endpoint);
    if (filtered.length === rows.length) return; // 변경 없음
    await writeCSV("subscriptions.csv", filtered);
    console.log(`🗑️ 구독 제거: ${endpoint.substring(0, 60)}...`);
  } catch (err) {
    console.error("[removeSubscriptionFromCSV] 실패:", err && err.message ? err.message : err);
  }
}

// activity-logs.csv에 발송 기록 추가
async function appendActivityLog(userId, actionType, description, appId) {
  try {
    const rows = await readCSV("activity-logs.csv");
    let maxId = 0;
    for (const r of rows) {
      const id = parseInt(r.id, 10);
      if (!Number.isNaN(id) && id > maxId) maxId = id;
    }

    const newId = maxId + 1;
    const now = new Date().toISOString();

    const newRow = {
      id: String(newId),
      user_id: String(userId || ""),
      action_type: actionType || "push_notification",
      action_description: description || "",
      created_at: now,
      app_id: appId ? String(appId) : "",
    };

    rows.push(newRow);
    await writeCSV("activity-logs.csv", rows);
    console.log(`📝 activity-logs 추가: id=${newId} user=${userId} type=${actionType}`);
  } catch (err) {
    console.error("[appendActivityLog] 실패:", err && err.message ? err.message : err);
  }
}

// 푸시 전송: 우선 프로젝트의 sendPushNotification(reusable)을 사용하고, 실패하면 로컬 web-push fallback 사용
// 로드 시도
let libSendPush = null;
try {
  // 시도: ts-node/register를 로드하면 .ts 파일을 require할 수 있음 (dev 환경)
  try {
    require("ts-node/register");
    console.log("ℹ️ ts-node/register loaded, TypeScript requires enabled");
  } catch {
    // 조용히 넘어감 - ts-node가 없으면 계속 진행
  }
  // require 시 TypeScript 파일이면 실패할 수 있으므로 안전하게 시도
  const pushLib = require(path.join(__dirname, "..", "src", "lib", "push"));
  libSendPush = pushLib && (pushLib.sendPushNotification || pushLib.default || pushLib);
  if (libSendPush) console.log("✅ sendPushNotification imported from src/lib/push");
} catch (e) {
  // 무시: 폴백으로 로컬 sendPushFallback 사용
  // 콘솔은 디버깅에 도움되므로 로깅
  console.log("⚠️ sendPushNotification import 실패, 로컬 폴백 사용:", e && e.message ? e.message : e);
}

// 기존의 web-push 기반 구현을 폴백으로 보존
async function sendPushFallback(rawSubscription, payload) {
  // 정규화된 subscription 객체 생성 (CSV 필드명 차이 대응)
  const subscription = {
    endpoint: rawSubscription.endpoint,
    keys: {
      p256dh:
        (rawSubscription.keys && rawSubscription.keys.p256dh) ||
        rawSubscription.p256dh_key ||
        rawSubscription.p256dh ||
        "",
      auth:
        (rawSubscription.keys && rawSubscription.keys.auth) || rawSubscription.auth_key || rawSubscription.auth || "",
    },
  };

  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);

  const options = {
    TTL: 60, // 1분
  };

  try {
    await webpush.sendNotification(subscription, payloadString, options);
    return { success: true, message: "푸시 알림 전송 성공" };
  } catch (error) {
    const statusCode = error && (error.statusCode || error.status);
    const body = (error && (error.body || error.message)) || String(error);

    console.error("푸시 전송 실패(폴백):", body, "statusCode:", statusCode);

    // 구독 만료(410) 또는 Not Found(404) -> CSV에서 제거
    if (statusCode === 410 || statusCode === 404) {
      try {
        await removeSubscriptionFromCSV(subscription.endpoint);
      } catch (e) {
        console.error("구독 제거 중 오류(폴백):", e && e.message ? e.message : e);
      }
    }

    return { success: false, message: body, statusCode };
  }
}

// 통합 sendPush: libSendPush가 있으면 사용, 아니면 폴백
async function sendPush(rawSubscription, payload) {
  if (libSendPush) {
    try {
      // libSendPush는 sendPushNotification 인터페이스를 따름: (subscription, payload) => { success, message }
      const result = await libSendPush(rawSubscription, payload);
      // 보수적으로 반환 형태 정규화
      if (result && typeof result.success !== "undefined") return result;
      return { success: !!result, message: result && result.message ? result.message : JSON.stringify(result) };
    } catch (err) {
      console.error("sendPushNotification 호출 중 오류, 폴백으로 전환:", err && err.message ? err.message : err);
      return await sendPushFallback(rawSubscription, payload);
    }
  }

  return await sendPushFallback(rawSubscription, payload);
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

    // const currentHour = new Date().getHours(); // Reserved for future time-based logic

    // 각 구독자에 대해 체크
    for (const sub of subscriptions) {
      const userId = sub.user_id;

      // 사용자 설정 찾기
      const settings = userSettings.find((s) => s.user_id === userId);
      if (!settings) {
        continue;
      }

      // 구독 객체 생성 (CSV 필드명 차이를 안전하게 정규화)
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key || sub.p256dh || (sub.keys && sub.keys.p256dh) || "",
          auth: sub.auth_key || sub.auth || (sub.keys && sub.keys.auth) || "",
        },
      };

      // 알림 설정 파싱
      const notificationRows = userSettings.filter((s) => s.category === "notifications" && s.user_id === userId);
      const notificationSettings = {};
      notificationRows.forEach((row) => {
        if (row.key === "dailyTasksReminderTimes") {
          try {
            notificationSettings[row.key] = JSON.parse(row.value);
          } catch {
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
        const matchedReminderTime = shouldSendReminderNow(reminderTimes);
        console.log(`📅 매칭된 리마인더 시간: ${matchedReminderTime}`);

        if (reminderTimes.length > 0 && matchedReminderTime) {
          // 오늘 이미 보냈는지 확인 (시간까지 포함한 고유 키 사용)
          const notifyKey = `reminder-${matchedReminderTime}`; // e.g. reminder-09:00

          if (!wasNotifiedToday(userId, notifyKey)) {
            const hour = Number(matchedReminderTime.split(":")[0]);
            const message = getReminderMessage(hour);

            console.log(`📢 리마인더 전송: ${userId} - ${matchedReminderTime} - ${message.title}`);

            try {
              const result = await sendPush(subscription, {
                title: message.title,
                body: message.body,
                data: {
                  url: "/dashboard",
                  type: "daily-tasks-reminder",
                  scheduledAt: matchedReminderTime,
                  timeStamp: new Date().toISOString(),
                },
              });

              const endpointSnippet = (subscription.endpoint || "").substring(0, 80);
              const usedImpl = libSendPush ? "project-lib" : "fallback-web-push";

              if (result && result.success) {
                markAsNotified(userId, notifyKey);
                console.log(`   ✅ 전송 성공 (${usedImpl}) → ${endpointSnippet}...`);
              } else {
                const errMsg =
                  result && (result.message || result.error) ? result.message || result.error : JSON.stringify(result);
                console.log(`   ❌ 전송 실패 → ${endpointSnippet}...: ${errMsg}`);
              }
            } catch (err) {
              const endpointSnippet = (subscription.endpoint || "").substring(0, 80);
              console.error(`   ❌ 전송 중 예외 발생 → ${endpointSnippet}...:`, err && err.message ? err.message : err);
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

              try {
                const result = await sendPush(subscription, {
                  title: `✈️ ${trip.name} 준비 알림 (D-${daysUntil})`,
                  body: `여행이 ${daysUntil}일 남았습니다. 준비물을 확인해보세요!`,
                  data: {
                    url: `/dashboard/travel-prep?trip=${trip.id}`,
                    type: "travel-prep",
                  },
                });

                const endpointSnippet = (subscription.endpoint || "").substring(0, 80);
                const usedImpl = libSendPush ? "project-lib" : "fallback-web-push";

                if (result && result.success) {
                  markAsNotified(userId, `travel-${trip.id}`);
                  console.log(`   ✅ 전송 성공 (${usedImpl}) → ${endpointSnippet}...`);
                  // activity-logs에 기록
                  try {
                    await appendActivityLog(
                      userId,
                      "push_sent",
                      `여행 준비 알림 전송(${trip.name}) (D-${daysUntil})`,
                      6,
                    );
                  } catch (e) {
                    console.error("[activity-log] 여행 알림 기록 실패:", e && e.message ? e.message : e);
                  }
                } else {
                  const errMsg =
                    result && (result.message || result.error)
                      ? result.message || result.error
                      : JSON.stringify(result);
                  console.log(`   ❌ 전송 실패 → ${endpointSnippet}...: ${errMsg}`);
                }
              } catch (err) {
                const endpointSnippet = (subscription.endpoint || "").substring(0, 80);
                console.error(
                  `   ❌ 전송 중 예외 발생 → ${endpointSnippet}...:`,
                  err && err.message ? err.message : err,
                );
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
