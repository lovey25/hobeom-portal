import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV } from "@/lib/data";
import { PraiseHistory, ApiResponse, User } from "@/types";

/**
 * GET /api/praise-badges/giver-history
 * 칭찬을 준 내역 조회 (giver용)
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

    // 내가 준 칭찬 내역 조회
    const history = await readCSV<PraiseHistory>("praise-history.csv");
    const myGivenHistory = history.filter((h) => h.givenBy === decoded.id);

    // 사용자 정보를 가져와서 이름 매핑
    const users = await readCSV<User>("users.csv");
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedHistory = myGivenHistory.map((h) => {
      const receiver = userMap.get(h.userId);
      return {
        ...h,
        receiverName: receiver?.name || "알 수 없음",
        receiverUsername: receiver?.username || "",
      };
    });

    // 최신순 정렬
    enrichedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response: ApiResponse = {
      success: true,
      message: "칭찬 내역을 조회했습니다.",
      data: enrichedHistory,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get giver history API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "칭찬 내역 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
