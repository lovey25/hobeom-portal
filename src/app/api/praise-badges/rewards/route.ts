import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { readCSV, writeCSV } from "@/lib/data";
import { PraiseRewardItem, ApiResponse } from "@/types";

/**
 * GET /api/praise-badges/rewards
 * 보상 아이템 목록 조회
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

    const rewards = await readCSV<PraiseRewardItem>("praise-reward-items.csv");

    // 일반 사용자는 활성화된 아이템만 조회
    if (decoded.role === "user") {
      const activeRewards = rewards
        .filter((r) => {
          const isActive = typeof r.isActive === "string" ? r.isActive === "true" : r.isActive;
          return isActive;
        })
        .sort((a, b) => a.badgeLevel - b.badgeLevel || a.order - b.order);

      const response: ApiResponse<PraiseRewardItem[]> = {
        success: true,
        message: "보상 아이템을 조회했습니다.",
        data: activeRewards,
      };
      return NextResponse.json(response);
    }

    // 관리자는 모든 아이템 조회
    const sortedRewards = rewards.sort((a, b) => a.badgeLevel - b.badgeLevel || a.order - b.order);

    const response: ApiResponse<PraiseRewardItem[]> = {
      success: true,
      message: "보상 아이템을 조회했습니다.",
      data: sortedRewards,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Get reward items API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 아이템 조회 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/praise-badges/rewards
 * 보상 아이템 추가 (관리자 전용)
 */
export async function POST(request: NextRequest) {
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { badgeLevel, name, description } = body;

    if (!badgeLevel || !name) {
      const response: ApiResponse = {
        success: false,
        message: "필수 항목을 입력해주세요.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (badgeLevel < 1 || badgeLevel > 4) {
      const response: ApiResponse = {
        success: false,
        message: "뱃지 레벨은 1~4 사이여야 합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rewards = await readCSV<PraiseRewardItem>("praise-reward-items.csv");

    // 같은 레벨의 아이템 개수 확인
    const sameLevel = rewards.filter((r) => r.badgeLevel === badgeLevel);
    const order = sameLevel.length + 1;

    const newReward: PraiseRewardItem = {
      id: `reward-${Date.now()}`,
      badgeLevel: Number(badgeLevel),
      name,
      description: description || "",
      isActive: true,
      order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    rewards.push(newReward);
    await writeCSV("praise-reward-items.csv", rewards);

    const response: ApiResponse<PraiseRewardItem> = {
      success: true,
      message: "보상 아이템을 추가했습니다.",
      data: newReward,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Add reward item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 아이템 추가 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/praise-badges/rewards
 * 보상 아이템 수정 (관리자 전용)
 */
export async function PUT(request: NextRequest) {
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rewards = await readCSV<PraiseRewardItem>("praise-reward-items.csv");
    const rewardIndex = rewards.findIndex((r) => r.id === id);

    if (rewardIndex === -1) {
      const response: ApiResponse = {
        success: false,
        message: "보상 아이템을 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 수정
    if (name !== undefined) rewards[rewardIndex].name = name;
    if (description !== undefined) rewards[rewardIndex].description = description;
    if (isActive !== undefined) rewards[rewardIndex].isActive = isActive;
    rewards[rewardIndex].updatedAt = new Date().toISOString();

    await writeCSV("praise-reward-items.csv", rewards);

    const response: ApiResponse<PraiseRewardItem> = {
      success: true,
      message: "보상 아이템을 수정했습니다.",
      data: rewards[rewardIndex],
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Update reward item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 아이템 수정 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/praise-badges/rewards
 * 보상 아이템 삭제 (관리자 전용)
 */
export async function DELETE(request: NextRequest) {
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

    if (decoded.role !== "admin") {
      const response: ApiResponse = {
        success: false,
        message: "관리자 권한이 필요합니다.",
      };
      return NextResponse.json(response, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: "아이템 ID가 필요합니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rewards = await readCSV<PraiseRewardItem>("praise-reward-items.csv");
    const filteredRewards = rewards.filter((r) => r.id !== id);

    if (filteredRewards.length === rewards.length) {
      const response: ApiResponse = {
        success: false,
        message: "보상 아이템을 찾을 수 없습니다.",
      };
      return NextResponse.json(response, { status: 404 });
    }

    await writeCSV("praise-reward-items.csv", filteredRewards);

    const response: ApiResponse = {
      success: true,
      message: "보상 아이템을 삭제했습니다.",
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete reward item API error:", error);
    const response: ApiResponse = {
      success: false,
      message: "보상 아이템 삭제 중 오류가 발생했습니다.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
