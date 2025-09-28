import { NextRequest, NextResponse } from "next/server";
import { getAppsByCategory } from "@/lib/data";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as "public" | "dashboard" | "admin";

    if (!category) {
      const response: ApiResponse = {
        success: false,
        message: "카테고리를 지정해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const apps = await getAppsByCategory(category);

    const response: ApiResponse = {
      success: true,
      message: "앱 목록을 가져왔습니다.",
      data: apps,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Apps API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "앱 목록을 가져오는 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
