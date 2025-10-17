import { NextRequest } from "next/server";
import { getAppsByCategory, getAllApps } from "@/lib/data";
import { extractUser, successResponse, errorResponse } from "@/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as "public" | "dashboard" | "admin";
    const includeInactive = searchParams.get("includeInactive") === "true";

    if (!category) {
      return errorResponse("카테고리를 지정해주세요.", 400);
    }

    let apps;

    // 관리자가 includeInactive=true로 요청한 경우 비활성화된 앱도 포함
    if (includeInactive) {
      const decoded = extractUser(request);

      if (decoded?.role === "admin") {
        const allApps = await getAllApps();
        apps = allApps.filter((app) => app.category === category);
      } else {
        // 일반 사용자는 활성화된 앱만
        apps = await getAppsByCategory(category);
      }
    } else {
      apps = await getAppsByCategory(category);
    }

    return successResponse("앱 목록을 가져왔습니다.", apps);
  } catch (error) {
    console.error("Apps API error:", error);
    return errorResponse("앱 목록을 가져오는 중 오류가 발생했습니다.");
  }
}
