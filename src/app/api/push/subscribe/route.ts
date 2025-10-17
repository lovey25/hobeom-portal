/**
 * POST /api/push/subscribe
 * 푸시 알림 구독 생성/업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { JwtPayload } from "jsonwebtoken";
import { savePushSubscription } from "@/lib/data";
import { detectDeviceInfo } from "@/lib/device";
import type { PushSubscription } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      console.error("[API Subscribe] 인증 실패");
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const decodedPayload = decoded as JwtPayload;
    const userId = decodedPayload?.id ?? decodedPayload?.userId;
    console.log("[API Subscribe] 사용자:", userId, "decoded:", decodedPayload);

    // 요청 데이터 파싱
    const body = (await request.json()) as { subscription?: PushSubscription };
    const { subscription } = body;

    console.log("[API Subscribe] 구독 정보:", {
      endpoint: subscription?.endpoint?.substring(0, 50) + "...",
      hasKeys: !!subscription?.keys,
    });

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      console.error("[API Subscribe] 구독 정보 불완전");
      return NextResponse.json({ success: false, message: "구독 정보가 올바르지 않습니다" }, { status: 400 });
    }

    // 디바이스 정보 감지
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = detectDeviceInfo(userAgent);
    console.log("[API Subscribe] 디바이스 정보:", deviceInfo);

    // 구독 정보 저장
    console.log("[API Subscribe] 저장 시도...");
    await savePushSubscription(
      userId,
      subscription.endpoint,
      subscription.keys.p256dh || "",
      subscription.keys.auth || "",
      deviceInfo.device_name,
      deviceInfo.device_type,
      deviceInfo.browser,
      deviceInfo.os
    );
    console.log("[API Subscribe] 저장 완료!");

    return NextResponse.json({
      success: true,
      message: "푸시 알림 구독이 완료되었습니다",
    });
  } catch (error) {
    console.error("[API Subscribe] 오류:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: message || "구독 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
