/**
 * POST /api/admin/push/send
 * 관리자가 특정 사용자/디바이스에 푸시 알림 전송
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPushSubscriptions, getPushSubscriptionByEndpoint, getAllPushSubscriptions } from "@/lib/data";
import { sendPushNotification } from "@/lib/push";

interface SendPushRequest {
  userId?: string;
  endpoint?: string;
  title: string;
  body: string;
  url?: string;
  broadcast?: boolean;
}

type RawSubscription = {
  endpoint: string;
  p256dh_key?: string;
  auth_key?: string;
  device_name?: string;
};

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || "";
    const decoded = verifyToken(token);

    // 관리자 권한 확인
    if (!decoded || (decoded as { role?: string }).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 권한이 필요합니다",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as SendPushRequest;
    const { userId, endpoint, title, body: messageBody, url, broadcast } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        {
          success: false,
          message: "제목과 내용은 필수입니다",
        },
        { status: 400 }
      );
    }

    let subscriptions: RawSubscription[] = [];

    if (broadcast) {
      subscriptions = await getAllPushSubscriptions();
    } else if (endpoint && userId) {
      const sub = await getPushSubscriptionByEndpoint(userId, endpoint);
      if (sub) subscriptions = [sub];
    } else if (userId) {
      subscriptions = await getPushSubscriptions(userId);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "userId 또는 broadcast를 지정해야 합니다",
        },
        { status: 400 }
      );
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "푸시 구독 정보를 찾을 수 없습니다",
        },
        { status: 404 }
      );
    }

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key || "",
            auth: sub.auth_key || "",
          },
        };

        return sendPushNotification(subscription, {
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

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}개 디바이스에 전송 성공${failCount > 0 ? `, ${failCount}개 실패` : ""}`,
      data: {
        total: results.length,
        success: successCount,
        failed: failCount,
        results: results.map((r, idx) => ({
          endpoint: subscriptions[idx].endpoint,
          device: subscriptions[idx].device_name,
          success: r.success,
          error: r.message,
        })),
      },
    });
  } catch (error) {
    const err: any = error;
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "푸시 전송 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
