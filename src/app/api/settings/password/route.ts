import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUsers, writeCSV } from "@/lib/data";
import bcrypt from "bcryptjs";

/**
 * PUT /api/settings/password - 비밀번호 변경
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "현재 비밀번호와 새 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "새 비밀번호는 6자 이상이어야 합니다" }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === decoded.id);

    if (!user) {
      return NextResponse.json({ success: false, message: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash || "");

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "현재 비밀번호가 일치하지 않습니다" }, { status: 400 });
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 사용자 업데이트
    const userIndex = users.findIndex((u) => u.id === decoded.id);
    users[userIndex].passwordHash = hashedPassword;

    await writeCSV("users.csv", users);

    return NextResponse.json({
      success: true,
      message: "비밀번호가 변경되었습니다",
    });
  } catch (error) {
    console.error("PUT /api/settings/password error:", error);
    return NextResponse.json({ success: false, message: "비밀번호 변경 실패" }, { status: 500 });
  }
}
