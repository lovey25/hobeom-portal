import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV } from "@/lib/data";
import { PraiseRedemption, PraiseMapping, User, ApiResponse } from "@/types";

/**
 * GET /api/praise-badges/receiver-redemptions
 * 칭찬을 주는 사람이 자신의 receiver들의 보상 신청 내역 조회
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

    // 내가 칭찬을 주는 사람(receiver)들의 ID 가져오기
    const mappings = await readCSV<PraiseMapping>("praise-mappings.csv");
    const myReceiverIds = mappings
      .filter((m) => m.isActive && m.giverUserId === decoded.id)
      .map((m) => m.receiverUserId);

    // 해당 receiver들의 보상 신청 내역 조회
    const redemptions = await readCSV<PraiseRedemption>("praise-redemptions.csv");
    const receiverRedemptions = redemptions.filter((r) => myReceiverIds.includes(r.userId));

    // 사용자 정보를 가져와서 이름 매핑
    const users = await readCSV<User>("users.csv");
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedRedemptions = receiverRedemptions.map((r) => {
      const receiver = userMap.get(r.userId);
      return {
        ...r,
        receiverName: receiver?.name || "알 수 없음",
        receiverUsername: receiver?.username || "",
      };
    });

    // 최신순 정렬
    enrichedRedemptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response: ApiResponse = {
      success: true,
      message: "보상 신청 내역을 조회했습니다.",
      data: enrichedRedemptions,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get receiver redemptions API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 신청 내역 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
