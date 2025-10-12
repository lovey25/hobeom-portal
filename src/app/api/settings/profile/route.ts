import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUsers, writeCSV } from "@/lib/data";

/**
 * PUT /api/settings/profile - 프로필 업데이트 (이름, 이메일)
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");

    if (!decoded) {
      return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "이름과 이메일을 입력해주세요" }, { status: 400 });
    }

    // 이메일 중복 체크 (자신 제외)
    const users = await getUsers();
    const existingUser = users.find((u) => u.email === email && u.id !== decoded.id);

    if (existingUser) {
      return NextResponse.json({ success: false, message: "이미 사용 중인 이메일입니다" }, { status: 400 });
    }

    // 사용자 업데이트
    const userIndex = users.findIndex((u) => u.id === decoded.id);
    if (userIndex === -1) {
      return NextResponse.json({ success: false, message: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    users[userIndex].name = name;
    users[userIndex].email = email;

    await writeCSV("users.csv", users);

    return NextResponse.json({
      success: true,
      message: "프로필이 업데이트되었습니다",
      data: {
        id: users[userIndex].id,
        username: users[userIndex].username,
        email: users[userIndex].email,
        name: users[userIndex].name,
        role: users[userIndex].role,
      },
    });
  } catch (error) {
    console.error("PUT /api/settings/profile error:", error);
    return NextResponse.json({ success: false, message: "프로필 업데이트 실패" }, { status: 500 });
  }
}
