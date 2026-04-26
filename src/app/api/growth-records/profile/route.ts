import { NextRequest } from "next/server";
import { requireAuth, successResponse, withErrorHandler } from "@/lib/apiHelpers";
import { getProfile } from "@/lib/sheets/growthAdapter";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (auth.response) return auth.response;

  const profile = await getProfile();
  return successResponse("자녀 프로필 조회 성공", profile);
});
