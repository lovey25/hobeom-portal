import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { ApiResponse } from "@/types";
import fs from "fs";
import path from "path";
import * as Papa from "papaparse";

/**
 * GET /api/csv-editor/[filename]
 * 특정 CSV 파일 읽기
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
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

    const { filename } = await params;

    // 파일명 검증 (보안: 경로 탐색 방지)
    if (!filename || filename.includes("..") || filename.includes("/") || !filename.endsWith(".csv")) {
      const response: ApiResponse = {
        success: false,
        message: "잘못된 파일명입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", filename);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      const response: ApiResponse = {
        success: false,
        message: "파일을 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // CSV 파일 읽기
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // CSV 파싱
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error("CSV 파싱 오류:", parsed.errors);
    }

    const response: ApiResponse = {
      success: true,
      message: "CSV 파일을 읽었습니다.",
      data: {
        filename,
        headers: parsed.meta.fields || [],
        rows: parsed.data,
        raw: fileContent,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("CSV 파일 읽기 오류:", error);
    const response: ApiResponse = {
      success: false,
      message: "CSV 파일 읽기 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/csv-editor/[filename]
 * 특정 CSV 파일 수정
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
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

    const { filename } = await params;

    // 파일명 검증 (보안: 경로 탐색 방지)
    if (!filename || filename.includes("..") || filename.includes("/") || !filename.endsWith(".csv")) {
      const response: ApiResponse = {
        success: false,
        message: "잘못된 파일명입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const { headers, rows } = body;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: "헤더 정보가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!rows || !Array.isArray(rows)) {
      const response: ApiResponse = {
        success: false,
        message: "행 데이터가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // CSV 생성
    const csv = Papa.unparse({
      fields: headers,
      data: rows,
    });

    const filePath = path.join(process.cwd(), "data", filename);

    // 기존 파일 백업 (선택적)
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + ".backup";
      fs.copyFileSync(filePath, backupPath);
    }

    // 파일 쓰기
    fs.writeFileSync(filePath, csv, "utf-8");

    const response: ApiResponse = {
      success: true,
      message: "CSV 파일이 저장되었습니다.",
      data: {
        filename,
        rowCount: rows.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("CSV 파일 저장 오류:", error);
    const response: ApiResponse = {
      success: false,
      message: "CSV 파일 저장 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
