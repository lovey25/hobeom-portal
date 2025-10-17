/**
 * POST /api/push/test
 * 테스트 푸시 알림 전송
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";
import { getPushSubscriptions } from "@/lib/data";
import { sendPushNotification, isVapidConfigured } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const decodedPayload = decoded as JwtPayload;
    const userId = decodedPayload?.id ?? decodedPayload?.userId; // id 또는 userId 필드 지원

    // VAPID 설정 확인
    if (!isVapidConfigured()) {
      return NextResponse.json({ success: false, message: "서버 푸시 설정이 완료되지 않았습니다" }, { status: 500 });
    }

    // 사용자의 모든 구독 정보 조회
    const subscriptions = await getPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: "푸시 구독 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    console.log(`[API Test] ${subscriptions.length}개 디바이스에 테스트 푸시 전송`);

    // 모든 디바이스에 테스트 푸시 전송
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        return await sendPushNotification(subscription, {
          title: "🔔 테스트 푸시 알림",
          body: `${sub.device_name}에서 푸시 알림이 정상 작동합니다!`,
          data: {
            url: "/dashboard",
            type: "test",
          },
        });
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}개 디바이스에 전송 성공${failCount > 0 ? `, ${failCount}개 실패` : ""}`,
      data: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Test push error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: message || "테스트 푸시 전송 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
