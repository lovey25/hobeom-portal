"use client";

import { ChildProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/styles/design-system";

interface GrowthHeaderProps {
  profile: ChildProfile | null;
  onAddRecord: () => void;
}

function formatBirthDateLabel(birthDate: string): string {
  if (!birthDate) return "";
  const [y, m, d] = birthDate.split("-");
  if (!y || !m || !d) return birthDate;
  return `${y}.${m}.${d}.`;
}

function calcAgeLabel(birthDate: string): string {
  if (!birthDate) return "";
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years}세 ${months}개월`;
}

function genderLabel(gender: "M" | "F"): string {
  return gender === "F" ? "여아" : "남아";
}

export function GrowthHeader({ profile, onAddRecord }: GrowthHeaderProps) {
  const name = profile?.name ?? "(자녀 정보 없음)";
  const meta = profile
    ? `${genderLabel(profile.gender)} · ${calcAgeLabel(profile.birthDate)} · 생일 ${formatBirthDateLabel(profile.birthDate)}`
    : "Google Sheets '설정' 탭에 자녀 정보를 입력해주세요.";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-lg border border-pink-200 bg-pink-50 px-6 py-6 text-center shadow-sm"
        )}
      >
        <h2 className="text-xl font-bold text-pink-900">
          <span className="mr-1.5" aria-hidden>
            🌱
          </span>
          {name}의 성장 기록
        </h2>
        <p className="mt-1.5 text-sm text-pink-800">{meta}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onAddRecord}>+ 기록하기</Button>
        <Button variant="secondary" disabled title="준비 중">
          🤖 AI 자문받기
        </Button>
        <Button variant="secondary" disabled title="준비 중">
          ⚙️ 설정
        </Button>
      </div>
    </div>
  );
}
