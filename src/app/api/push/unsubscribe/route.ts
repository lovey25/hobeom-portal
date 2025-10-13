/**
 * POST /api/push/unsubscribe
 * 푸시 알림 구독 해제
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { deletePushSubscription } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const userId = decoded.id || decoded.userId; // id 또는 userId 필드 지원

    // 요청 데이터 파싱 (endpoint 필수)
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ success: false, message: "endpoint가 필요합니다" }, { status: 400 });
    }

    console.log("[API Unsubscribe] 디바이스 구독 해제:", { userId, endpoint: endpoint.substring(0, 50) + "..." });

    // 특정 디바이스 구독 해제
    await deletePushSubscription(userId, endpoint);

    return NextResponse.json({
      success: true,
      message: "이 디바이스의 푸시 알림 구독이 해제되었습니다",
    });
  } catch (error: any) {
    console.error("[API Unsubscribe] 오류:", error);
    return NextResponse.json(
      { success: false, message: error.message || "구독 해제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
