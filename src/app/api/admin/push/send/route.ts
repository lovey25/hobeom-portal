/**
 * POST /api/admin/push/send
 * 관리자가 특정 사용자/디바이스에 푸시 알림 전송
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPushSubscriptions, getPushSubscriptionByEndpoint } from "@/lib/data";
import { sendPushNotification } from "@/lib/push";

interface SendPushRequest {
  userId?: string; // 특정 사용자의 모든 디바이스
  endpoint?: string; // 특정 디바이스만
  title: string;
  body: string;
  url?: string;
  broadcast?: boolean; // 모든 구독자에게 전송
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, endpoint, title, body: messageBody, url, broadcast }: SendPushRequest = body;

    console.log("[Admin Push Send]", { userId, endpoint: endpoint?.substring(0, 50), title, broadcast });

    // 입력 검증
    if (!title || !messageBody) {
      return NextResponse.json({ success: false, message: "제목과 내용은 필수입니다" }, { status: 400 });
    }

    let subscriptions: any[] = [];

    // 1. 브로드캐스트: 모든 구독자에게
    if (broadcast) {
      const { getAllPushSubscriptions } = await import("@/lib/data");
      subscriptions = await getAllPushSubscriptions();
      console.log(`[Admin Push Send] 브로드캐스트: ${subscriptions.length}개 구독`);
    }
    // 2. 특정 endpoint만
    else if (endpoint && userId) {
      const sub = await getPushSubscriptionByEndpoint(userId, endpoint);
      if (sub) subscriptions = [sub];
    }
    // 3. 특정 사용자의 모든 디바이스
    else if (userId) {
      subscriptions = await getPushSubscriptions(userId);
      console.log(`[Admin Push Send] 사용자 ${userId}: ${subscriptions.length}개 디바이스`);
    } else {
      return NextResponse.json({ success: false, message: "userId 또는 broadcast를 지정해야 합니다" }, { status: 400 });
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: false, message: "푸시 구독 정보를 찾을 수 없습니다" }, { status: 404 });
    }

    // 모든 구독에 푸시 전송
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
          title,
          body: messageBody,
          data: {
            url: url || "/dashboard",
            type: "admin-message",
            timestamp: new Date().toISOString(),
          },
        });
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    console.log(`[Admin Push Send] 결과: 성공 ${successCount}, 실패 ${failCount}`);

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}개 디바이스에 전송 성공${failCount > 0 ? `, ${failCount}개 실패` : ""}`,
      data: {
        total: results.length,
        success: successCount,
        failed: failCount,
        results: results.map((r, idx) => ({
          endpoint: subscriptions[idx].endpoint.substring(0, 50) + "...",
          device: subscriptions[idx].device_name,
          success: r.success,
          error: r.message,
        })),
      },
    });
  } catch (error: any) {
    console.error("[Admin Push Send] 오류:", error);
    return NextResponse.json(
      { success: false, message: error.message || "푸시 전송 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
