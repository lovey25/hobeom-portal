import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { updateUserAppOrder } from "@/lib/data";

/**
 * POST /api/user-apps/reorder - 앱 순서 변경
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { category, appOrders } = await request.json();

    if (!category || !appOrders || !Array.isArray(appOrders)) {
      return NextResponse.json({ success: false, message: "category와 appOrders가 필요합니다" }, { status: 400 });
    }

    await updateUserAppOrder(decoded.id, category, appOrders);

    return NextResponse.json({
      success: true,
      message: "앱 순서가 변경되었습니다",
    });
  } catch (error) {
    console.error("POST /api/user-apps/reorder error:", error);
    return NextResponse.json({ success: false, message: "앱 순서 변경 실패" }, { status: 500 });
  }
}
