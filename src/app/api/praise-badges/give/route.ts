import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV, getAllUsers, getPushSubscriptions } from "@/lib/data";
import { sendPushNotification } from "@/lib/push";
import { PraiseBadge, PraiseHistory, PraiseMapping, ApiResponse } from "@/types";

/**
 * POST /api/praise-badges/give
 * 매핑 관계가 있는 사용자에게 칭찬 주기
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        message: "인증이 필요합니다.",
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json();
    const { userId, comment } = body;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: "사용자 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (decoded.id === userId) {
      const response: ApiResponse = {
        success: false,
        message: "자기 자신에게 칭찬을 줄 수 없습니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");
    const canGivePraise = mappings.some(
      (mapping) => mapping.isActive && mapping.giverUserId === decoded.id && mapping.receiverUserId === userId,
    );

    if (!canGivePraise) {
      const response: ApiResponse = {
        success: false,
        message: "칭찬 권한이 없습니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    // 칭찬뱃지 현황 조회
    const badges = await readCSV<PraiseBadge>("praise-badges.csv");
    let userBadge = badges.find((b) => b.userId === userId);

    if (!userBadge) {
      // 뱃지가 없으면 초기 생성
      userBadge = {
        id: `badge-${userId}-${Date.now()}`,
        userId,
        currentPoints: 0,
        completedBadges: 0,
        lastUpdated: new Date().toISOString(),
      };
      badges.push(userBadge);
    }

    // 칭찬 포인트 증가 (숫자로 명시적 변환)
    userBadge.currentPoints = Number(userBadge.currentPoints) + 1;

    // 4개 모이면 뱃지 완성
    if (userBadge.currentPoints >= 4) {
      userBadge.completedBadges = Number(userBadge.completedBadges) + 1;
      userBadge.currentPoints = 0;
    }

    userBadge.lastUpdated = new Date().toISOString();

    // 업데이트
    await writeCSV("praise-badges.csv", badges);

    // 히스토리 기록
    const history = await readCSV<PraiseHistory>("praise-history.csv");
    const historyEntry: PraiseHistory = {
      id: `history-${Date.now()}`,
      userId,
      givenBy: decoded.id,
      timestamp: new Date().toISOString(),
      pointsAfter: userBadge.currentPoints,
      badgesAfter: userBadge.completedBadges,
      comment: comment || "",
    };
    history.push(historyEntry);
    await writeCSV("praise-history.csv", history);

    // 수신자에게 푸시 알림 전송 (실패해도 메인 응답에 영향 없음)
    try {
      const subscriptions = await getPushSubscriptions(userId);
      if (subscriptions.length > 0) {
        const allUsers = await getAllUsers();
        const giver = allUsers.find((u) => u.id === decoded.id);
        const giverName = giver?.name || giver?.username || "관리자";

        const isBadgeCompleted = userBadge.currentPoints === 0;
        const notificationTitle = isBadgeCompleted ? "🏅 칭찬 뱃지 완성!" : "🌟 칭찬을 받았어요!";
        const notificationBody = isBadgeCompleted
          ? `${giverName}님 덕분에 뱃지를 완성했어요! (총 ${userBadge.completedBadges}개)`
          : `${giverName}님이 칭찬을 보내주셨어요! (${userBadge.currentPoints}/4 포인트)`;

        await Promise.allSettled(
          subscriptions.map((sub) =>
            sendPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key || "", auth: sub.auth_key || "" } },
              {
                title: notificationTitle,
                body: notificationBody,
                data: { url: "/dashboard/praise-badge", type: "praise-received" },
              },
            ),
          ),
        );
      }
    } catch (pushError) {
      console.error("칭찬 푸시 알림 전송 오류:", pushError);
    }

    const response: ApiResponse<PraiseBadge> = {
      success: true,
      message: "칭찬을 주었습니다! 🎉",
      data: userBadge,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Give praise API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "칭찬 처리 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
