"use client";

import { GrowthRecord } from "@/types";
import { table } from "@/styles/design-system";

interface RecordsTableProps {
  records: GrowthRecord[];
  onEdit: (record: GrowthRecord) => void;
}

function formatDate(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  return `${y}${m}${d}.`;
}

function formatAge(months: number): string {
  if (!months || months < 0) return "-";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y}세 ${m}개월`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function RecordsTable({ records, onEdit }: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-600">아직 등록된 기록이 없습니다.</p>
    );
  }

  // 최신순 표시
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className={table.container}>
      <table className={table.base}>
        <thead className={table.thead}>
          <tr>
            <th className={table.th}>측정일</th>
            <th className={table.th}>키(cm)</th>
            <th className={table.th}>몸무게(kg)</th>
            <th className={table.th}>나이</th>
            <th className={table.th}>메모</th>
          </tr>
        </thead>
        <tbody className={table.tbody}>
          {sorted.map((r) => (
            <tr
              key={r.rowIndex}
              className={`${table.tr} cursor-pointer`}
              onClick={() => onEdit(r)}
            >
              <td className={table.tdPrimary}>{formatDate(r.date)}</td>
              <td className={table.td}>{formatNumber(r.heightCm)}</td>
              <td className={table.td}>{formatNumber(r.weightKg)}</td>
              <td className={table.td}>{formatAge(r.ageMonths)}</td>
              <td className={table.td}>{r.memo || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
