/**
 * GET /api/push/subscription
 * 현재 사용자의 푸시 구독 상태 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getPushSubscriptions } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      console.error("[API Subscription] 인증 실패");
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = decoded.id || decoded.userId; // id 또는 userId 필드 지원
    console.log("[API Subscription] 사용자:", userId, "구독 상태 조회");

    // 현재 디바이스의 endpoint 가져오기 (Service Worker에서 조회 필요)
    // 클라이언트에서 endpoint를 보내주거나, 모든 구독 목록을 반환
    const subscriptions = await getPushSubscriptions(userId);

    console.log("[API Subscription] 조회 결과:", {
      count: subscriptions.length,
      devices: subscriptions.map((s) => s.device_name),
    });

    return NextResponse.json({
      success: true,
      data: {
        subscribed: subscriptions.length > 0,
        count: subscriptions.length,
        subscriptions: subscriptions.map((sub) => ({
          endpoint: sub.endpoint,
          device_name: sub.device_name,
          device_type: sub.device_type,
          browser: sub.browser,
          os: sub.os,
          created_at: sub.created_at,
          last_used: sub.last_used,
        })),
      },
    });
  } catch (error: any) {
    console.error("[API Subscription] 오류:", error);
    return NextResponse.json({ success: false, message: "구독 상태 조회 중 오류가 발생했습니다" }, { status: 500 });
  }
}
