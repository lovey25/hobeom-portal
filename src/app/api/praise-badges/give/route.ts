import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV } from "@/lib/data";
import { PraiseBadge, PraiseHistory, ApiResponse } from "@/types";

/**
 * POST /api/praise-badges/give
 * 관리자가 사용자에게 칭찬 주기
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
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
