import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV, getPushSubscriptions } from "@/lib/data";
import { PraiseBadge, PraiseRedemption, PraiseRewardItem, User, ApiResponse } from "@/types";
import { sendPushNotification, type PushSubscription } from "@/lib/push";

/**
 * POST /api/praise-badges/redeem
 * 사용자가 뱃지를 소진하여 보상 받기
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
    const { rewardItemId } = body;

    if (!rewardItemId) {
      const response: ApiResponse = {
        success: false,
        message: "보상 아이템을 선택해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 보상 아이템 조회
    const rewards = await readCSV<PraiseRewardItem>("praise-reward-items.csv");
    const rewardItem = rewards.find((r) => r.id === rewardItemId);

    if (!rewardItem) {
      const response: ApiResponse = {
        success: false,
        message: "보상 아이템을 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 사용자 뱃지 현황 조회
    const badges = await readCSV<PraiseBadge>("praise-badges.csv");
    const userBadge = badges.find((b) => b.userId === decoded.id);

    if (!userBadge) {
      const response: ApiResponse = {
        success: false,
        message: "칭찬뱃지 정보를 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 뱃지 개수 확인
    if (userBadge.completedBadges < rewardItem.badgeLevel) {
      const response: ApiResponse = {
        success: false,
        message: `뱃지가 ${rewardItem.badgeLevel}개 필요합니다. (현재: ${userBadge.completedBadges}개)`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 뱃지 차감
    userBadge.completedBadges -= rewardItem.badgeLevel;
    userBadge.lastUpdated = new Date().toISOString();
    await writeCSV("praise-badges.csv", badges);

    // 소진 히스토리 기록
    const redemptions = await readCSV<PraiseRedemption>("praise-redemptions.csv");
    const redemption: PraiseRedemption = {
      id: `redemption-${Date.now()}`,
      userId: decoded.id,
      badgeCount: rewardItem.badgeLevel,
      rewardItemId: rewardItem.id,
      rewardItemName: rewardItem.name,
      timestamp: new Date().toISOString(),
      status: "pending",
      comment: "",
    };
    redemptions.push(redemption);
    await writeCSV("praise-redemptions.csv", redemptions);

    // 관리자에게 푸시 알림 발송
    try {
      const users = await readCSV<User>("users.csv");
      const admins = users.filter((u) => u.role === "admin");
      const user = users.find((u) => u.id === decoded.id);

      for (const admin of admins) {
        const subscriptions = await getPushSubscriptions(admin.id);

        for (const sub of subscriptions) {
          const pushSub: PushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          };

          await sendPushNotification(pushSub, {
            title: "🎁 칭찬뱃지 소진 알림",
            body: `${user?.name || decoded.username}님이 "${rewardItem.name}"을(를) 선택했습니다!`,
            data: {
              type: "praise-redemption",
              redemptionId: redemption.id,
              userId: decoded.id,
              url: "/dashboard/admin/praise-badges",
            },
          });
        }
      }
    } catch (pushError) {
      console.error("Push notification error:", pushError);
      // 푸시 알림 실패해도 소진은 성공으로 처리
    }

    const response: ApiResponse<{
      redemption: PraiseRedemption;
      remainingBadges: number;
    }> = {
      success: true,
      message: `"${rewardItem.name}"을(를) 선택했습니다! 🎉`,
      data: {
        redemption,
        remainingBadges: userBadge.completedBadges,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Redeem praise badge API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 처리 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET /api/praise-badges/redeem
 * 소진 히스토리 조회
 */
export async function GET(request: NextRequest) {
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

    const redemptions = await readCSV<PraiseRedemption>("praise-redemptions.csv");

    // 일반 사용자는 자신의 소진 히스토리만 조회
    if (decoded.role === "user") {
      const userRedemptions = redemptions
        .filter((r) => r.userId === decoded.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const response: ApiResponse<PraiseRedemption[]> = {
        success: true,
        message: "소진 히스토리를 조회했습니다.",
        data: userRedemptions,
      };
      return NextResponse.json(response);
    }

    // 관리자는 모든 소진 히스토리 조회
    const sortedRedemptions = redemptions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const response: ApiResponse<PraiseRedemption[]> = {
      success: true,
      message: "소진 히스토리를 조회했습니다.",
      data: sortedRedemptions,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get redemption history API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "소진 히스토리 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/praise-badges/redeem
 * 관리자가 소진 요청 승인/완료 처리
 */
export async function PUT(request: NextRequest) {
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { id, status, comment } = body;

    if (!id || !status) {
      const response: ApiResponse = {
        success: false,
        message: "필수 항목을 입력해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const redemptions = await readCSV<PraiseRedemption>("praise-redemptions.csv");
    const redemptionIndex = redemptions.findIndex((r) => r.id === id);

    if (redemptionIndex === -1) {
      const response: ApiResponse = {
        success: false,
        message: "소진 요청을 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 상태 업데이트
    redemptions[redemptionIndex].status = status;
    redemptions[redemptionIndex].approvedBy = decoded.id;
    redemptions[redemptionIndex].approvedAt = new Date().toISOString();
    if (comment) {
      redemptions[redemptionIndex].comment = comment;
    }

    await writeCSV("praise-redemptions.csv", redemptions);

    const response: ApiResponse<PraiseRedemption> = {
      success: true,
      message: "소진 요청을 처리했습니다.",
      data: redemptions[redemptionIndex],
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Update redemption status API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "소진 요청 처리 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
