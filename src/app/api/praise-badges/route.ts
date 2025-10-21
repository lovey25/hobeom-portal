import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV } from "@/lib/data";
import { PraiseBadge, PraiseHistory, ApiResponse } from "@/types";

/**
 * GET /api/praise-badges
 * 칭찬뱃지 현황 조회
 * ?history=true - 히스토리 조회
 * ?all=true - 모든 뱃지 조회 (관리자용)
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

    const { searchParams } = new URL(request.url);
    const historyQuery = searchParams.get("history");
    const allQuery = searchParams.get("all");

    // 히스토리 조회
    if (historyQuery === "true") {
      const history = await readCSV<PraiseHistory>("praise-history.csv");
      const userHistory = history.filter((h) => h.userId === decoded.id);

      const response: ApiResponse<PraiseHistory[]> = {
        success: true,
        message: "칭찬 히스토리를 조회했습니다.",
        data: userHistory,
      };
      return NextResponse.json(response);
    }

    const badges = await readCSV<PraiseBadge>("praise-badges.csv");

    // 모든 뱃지 조회 (관리자/giver용)
    if (allQuery === "true") {
      const response: ApiResponse<PraiseBadge[]> = {
        success: true,
        message: "칭찬뱃지 현황을 조회했습니다.",
        data: badges,
      };
      return NextResponse.json(response);
    }

    // 일반 사용자는 자신의 뱃지만 조회
    if (decoded.role === "user") {
      let userBadge = badges.find((b) => b.userId === decoded.id);

      if (!userBadge) {
        // 뱃지가 없으면 초기 생성
        userBadge = {
          id: `badge-${decoded.id}-${Date.now()}`,
          userId: decoded.id,
          currentPoints: 0,
          completedBadges: 0,
          lastUpdated: new Date().toISOString(),
        };
        badges.push(userBadge);
        await writeCSV("praise-badges.csv", badges);
      }

      const response: ApiResponse<PraiseBadge> = {
        success: true,
        message: "칭찬뱃지 현황을 조회했습니다.",
        data: userBadge,
      };
      return NextResponse.json(response);
    }

    // 관리자는 모든 뱃지 조회
    const response: ApiResponse<PraiseBadge[]> = {
      success: true,
      message: "칭찬뱃지 현황을 조회했습니다.",
      data: badges,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get praise badges API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "칭찬뱃지 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
