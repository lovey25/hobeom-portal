"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Area,
  ResponsiveContainer,
} from "recharts";
import { ChildProfile, GrowthRecord } from "@/types";
import { getPercentilesFor, PercentilePoint } from "@/lib/sheets/percentile-data";
import { cn } from "@/styles/design-system";

interface GrowthChartProps {
  profile: ChildProfile | null;
  records: GrowthRecord[];
}

type ViewMode = "all" | "height" | "weight";

interface ChartRow {
  ageMonths: number;
  heightP50?: number;
  weightP50?: number;
  heightBand?: [number, number];
  weightBand?: [number, number];
  heightActual?: number;
  weightActual?: number;
}

function interpolatePercentile(curves: PercentilePoint[], age: number): PercentilePoint | null {
  if (curves.length === 0) return null;
  if (age <= curves[0].ageMonths) return curves[0];
  const last = curves[curves.length - 1];
  if (age >= last.ageMonths) return last;
  for (let i = 0; i < curves.length - 1; i++) {
    const a = curves[i];
    const b = curves[i + 1];
    if (age >= a.ageMonths && age <= b.ageMonths) {
      const t = (age - a.ageMonths) / (b.ageMonths - a.ageMonths);
      return {
        ageMonths: age,
        p3: a.p3 + (b.p3 - a.p3) * t,
        p50: a.p50 + (b.p50 - a.p50) * t,
        p97: a.p97 + (b.p97 - a.p97) * t,
      };
    }
  }
  return null;
}

function mergeByAge(
  heightCurves: PercentilePoint[],
  weightCurves: PercentilePoint[],
  records: GrowthRecord[]
): ChartRow[] {
  const map = new Map<number, ChartRow>();

  const ensure = (age: number): ChartRow => {
    let row = map.get(age);
    if (!row) {
      row = { ageMonths: age };
      map.set(age, row);
    }
    return row;
  };

  for (const p of heightCurves) {
    const row = ensure(p.ageMonths);
    row.heightP50 = p.p50;
    row.heightBand = [p.p3, p.p97];
  }
  for (const p of weightCurves) {
    const row = ensure(p.ageMonths);
    row.weightP50 = p.p50;
    row.weightBand = [p.p3, p.p97];
  }
  for (const r of records) {
    if (!Number.isFinite(r.ageMonths) || r.ageMonths < 0) continue;
    const row = ensure(r.ageMonths);
    if (r.heightCm > 0) row.heightActual = r.heightCm;
    if (r.weightKg > 0) row.weightActual = r.weightKg;
  }

  // 측정 기록으로 새로 추가된 row 등 백분위가 비어 있는 지점은
  // 표준 곡선에서 선형 보간해 채워서 Area/평균선이 끊기지 않도록 한다.
  for (const row of map.values()) {
    if (row.heightP50 === undefined) {
      const h = interpolatePercentile(heightCurves, row.ageMonths);
      if (h) {
        row.heightP50 = h.p50;
        row.heightBand = [h.p3, h.p97];
      }
    }
    if (row.weightP50 === undefined) {
      const w = interpolatePercentile(weightCurves, row.ageMonths);
      if (w) {
        row.weightP50 = w.p50;
        row.weightBand = [w.p3, w.p97];
      }
    }
  }

  return [...map.values()].sort((a, b) => a.ageMonths - b.ageMonths);
}

const TOGGLES: { value: ViewMode; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "height", label: "키" },
  { value: "weight", label: "몸무게" },
];

// 디자인 시스템의 stat 카드 톤(blue-50 / red-50 베이스)에 맞춘 옅은 표준범위 영역
const HEIGHT_BAND_COLOR = "#dbeafe"; // blue-100
const WEIGHT_BAND_COLOR = "#fee2e2"; // red-100
const AXIS_TICK_COLOR = "#374151"; // gray-700
const AXIS_LABEL_COLOR = "#111827"; // gray-900
const LEGEND_TEXT_COLOR = "#374151"; // gray-700

export function GrowthChart({ profile, records }: GrowthChartProps) {
  const [mode, setMode] = useState<ViewMode>("all");

  const data = useMemo(() => {
    const set = getPercentilesFor(profile?.gender ?? "M");
    return mergeByAge(set.height, set.weight, records);
  }, [profile, records]);

  const showHeight = mode === "all" || mode === "height";
  const showWeight = mode === "all" || mode === "weight";

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {TOGGLES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setMode(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
              mode === t.value
                ? "bg-blue-600 text-white focus:ring-blue-500"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-110 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 24, bottom: 40, left: 0 }}>
            <defs>
              <linearGradient id="heightBandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={HEIGHT_BAND_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={HEIGHT_BAND_COLOR} stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="weightBandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={WEIGHT_BAND_COLOR} stopOpacity={0.45} />
                <stop offset="100%" stopColor={WEIGHT_BAND_COLOR} stopOpacity={0.25} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="ageMonths"
              type="number"
              domain={[0, 144]}
              ticks={[0, 24, 48, 72, 96, 120, 144]}
              tick={{ fill: AXIS_TICK_COLOR, fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: "나이(개월)",
                position: "insideBottom",
                offset: -16,
                fill: AXIS_LABEL_COLOR,
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="height"
              orientation="left"
              domain={[40, 170]}
              tick={{ fill: AXIS_TICK_COLOR, fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: "키 (cm)",
                angle: -90,
                position: "insideLeft",
                fill: AXIS_LABEL_COLOR,
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="weight"
              orientation="right"
              domain={[0, 60]}
              tick={{ fill: AXIS_TICK_COLOR, fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: "몸무게 (kg)",
                angle: 90,
                position: "insideRight",
                fill: AXIS_LABEL_COLOR,
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                color: AXIS_LABEL_COLOR,
                fontSize: 12,
              }}
              labelStyle={{ color: AXIS_LABEL_COLOR, fontWeight: 600 }}
              itemStyle={{ color: AXIS_TICK_COLOR }}
              formatter={(value, name) => {
                if (Array.isArray(value)) {
                  const [lo, hi] = value as [number, number];
                  return [`${lo.toFixed(1)} ~ ${hi.toFixed(1)}`, name];
                }
                const num = typeof value === "number" ? value : Number(value);
                return [Number.isFinite(num) ? num.toFixed(1) : String(value), name];
              }}
              labelFormatter={(age) => `${age}개월`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: 8, color: LEGEND_TEXT_COLOR, fontSize: 12 }}
            />

            {showHeight && (
              <Area
                yAxisId="height"
                type="monotone"
                dataKey="heightBand"
                name="키 표준범위 (3~97%)"
                stroke="none"
                fill="url(#heightBandFill)"
                isAnimationActive={false}
                activeDot={false}
              />
            )}
            {showWeight && (
              <Area
                yAxisId="weight"
                type="monotone"
                dataKey="weightBand"
                name="몸무게 표준범위 (3~97%)"
                stroke="none"
                fill="url(#weightBandFill)"
                isAnimationActive={false}
                activeDot={false}
              />
            )}

            {showHeight && (
              <Line
                yAxisId="height"
                type="monotone"
                dataKey="heightP50"
                name="키 평균 (50%)"
                stroke="#3b82f6"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                dot={false}
              />
            )}
            {showWeight && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weightP50"
                name="몸무게 평균 (50%)"
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                dot={false}
              />
            )}

            {showHeight && (
              <Line
                yAxisId="height"
                type="monotone"
                dataKey="heightActual"
                name="키 (cm)"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1d4ed8" }}
                connectNulls
              />
            )}
            {showWeight && (
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weightActual"
                name="몸무게 (kg)"
                stroke="#b91c1c"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#b91c1c" }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
