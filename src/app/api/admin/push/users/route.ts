/**
 * GET /api/admin/push/users
 * 푸시 구독 사용자 목록 조회 (관리자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUsers, getPushSubscriptions } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    // 모든 사용자 조회
    const users = await getUsers();

    // 각 사용자의 구독 정보 조회
    const usersWithSubscriptions = await Promise.all(
      users.map(async (user) => {
        const subscriptions = await getPushSubscriptions(user.id);
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionCount: subscriptions.length,
          subscriptions: subscriptions.map((sub) => ({
            endpoint: sub.endpoint,
            device_name: sub.device_name,
            device_type: sub.device_type,
            browser: sub.browser,
            os: sub.os,
            last_used: sub.last_used,
          })),
        };
      })
    );

    // 구독이 있는 사용자만 필터링
    const subscribedUsers = usersWithSubscriptions.filter((u) => u.subscriptionCount > 0);

    return NextResponse.json({
      success: true,
      data: {
        total: subscribedUsers.length,
        users: subscribedUsers,
      },
    });
  } catch (error) {
    console.error("[Admin Push Users] 오류:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, message: message || "사용자 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
