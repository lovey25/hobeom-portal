import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";
import fs from "fs";
import path from "path";

/**
 * GET /api/csv-editor
 * data 폴더의 CSV 파일 목록 조회
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

    // 관리자 권한 체크
    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const dataDir = path.join(process.cwd(), "data");

    // data 폴더가 없으면 생성
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // CSV 파일 목록 조회 (.sample.csv 제외)
    const files = fs.readdirSync(dataDir);
    const csvFiles = files
      .filter((file) => file.endsWith(".csv") && !file.endsWith(".sample.csv"))
      .map((file) => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const response: ApiResponse = {
      success: true,
      message: "CSV 파일 목록을 조회했습니다.",
      data: csvFiles,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("CSV 파일 목록 조회 오류:", error);
    const response: ApiResponse = {
      success: false,
      message: "CSV 파일 목록 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
