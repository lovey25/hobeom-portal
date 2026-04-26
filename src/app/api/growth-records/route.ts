import { NextRequest } from "next/server";
import { requireAuth, successResponse, errorResponse, withErrorHandler } from "@/lib/apiHelpers";
import { listRecords, appendRecord } from "@/lib/sheets/growthAdapter";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (auth.response) return auth.response;

  const records = await listRecords();
  return successResponse("성장 기록 조회 성공", records);
});

interface CreateBody {
  date?: string;
  heightCm?: number;
  weightKg?: number;
  memo?: string;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = requireAuth(req);
  if (auth.response) return auth.response;

  const body = (await req.json()) as CreateBody;
  if (!body.date) return errorResponse("측정일이 필요합니다.", 400);
  if (typeof body.heightCm !== "number" || body.heightCm <= 0) {
    return errorResponse("키(cm)가 올바르지 않습니다.", 400);
  }
  if (typeof body.weightKg !== "number" || body.weightKg <= 0) {
    return errorResponse("몸무게(kg)가 올바르지 않습니다.", 400);
  }

  const username = (auth.decoded?.username as string | undefined) ?? "";
  await appendRecord({
    date: body.date,
    heightCm: body.heightCm,
    weightKg: body.weightKg,
    memo: body.memo ?? "",
    createdBy: username,
  });

  return successResponse("성장 기록이 추가되었습니다.");
});
