import { NextRequest } from "next/server";
import { requireAuth, successResponse, errorResponse, withErrorHandler } from "@/lib/apiHelpers";
import { updateRecord, deleteRecord } from "@/lib/sheets/growthAdapter";

interface UpdateBody {
  date?: string;
  heightCm?: number;
  weightKg?: number;
  memo?: string;
}

function parseRowIndex(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n >= 2 ? n : null;
}

export const PUT = withErrorHandler(
  async (req: NextRequest, context?: { params: Promise<{ rowIndex: string }> }) => {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;

    const params = await context?.params;
    const rowIndex = parseRowIndex(params?.rowIndex ?? "");
    if (rowIndex === null) return errorResponse("올바르지 않은 행 번호입니다.", 400);

    const body = (await req.json()) as UpdateBody;
    if (!body.date) return errorResponse("측정일이 필요합니다.", 400);
    if (typeof body.heightCm !== "number" || body.heightCm <= 0) {
      return errorResponse("키(cm)가 올바르지 않습니다.", 400);
    }
    if (typeof body.weightKg !== "number" || body.weightKg <= 0) {
      return errorResponse("몸무게(kg)가 올바르지 않습니다.", 400);
    }

    const username = (auth.decoded?.username as string | undefined) ?? "";
    await updateRecord(rowIndex, {
      date: body.date,
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      memo: body.memo ?? "",
      createdBy: username,
    });

    return successResponse("성장 기록이 수정되었습니다.");
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Promise<{ rowIndex: string }> }) => {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;

    const params = await context?.params;
    const rowIndex = parseRowIndex(params?.rowIndex ?? "");
    if (rowIndex === null) return errorResponse("올바르지 않은 행 번호입니다.", 400);

    await deleteRecord(rowIndex);
    return successResponse("성장 기록이 삭제되었습니다.");
  }
);
