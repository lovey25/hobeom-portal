import { getSheetsClient, getSpreadsheetId } from "./client";
import { ChildProfile, GrowthRecord } from "@/types";

const RECORDS_TAB = "기록";
const PROFILE_TAB = "설정";

const RECORD_COLUMN_KEYS = {
  date: "측정일",
  heightCm: "키(cm)",
  weightKg: "몸무게(kg)",
  ageMonths: "나이(개월수)",
  createdBy: "기록자",
  memo: "메모",
  createdAt: "등록일시",
} as const;

const PROFILE_COLUMN_KEYS = {
  name: "아이이름",
  birthDate: "생년월일",
  gender: "성별",
  adminEmail: "관리자이메일",
  createdAt: "생성일",
} as const;

type RecordKey = keyof typeof RECORD_COLUMN_KEYS;
type ProfileKey = keyof typeof PROFILE_COLUMN_KEYS;

interface HeaderMap<K extends string> {
  rows: string[][];
  headers: string[];
  indexOf: (key: K) => number;
}

async function fetchTab<K extends string>(
  tabName: string,
  columnDictionary: Record<K, string>
): Promise<HeaderMap<K>> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A1:Z`,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const allRows = (res.data.values ?? []) as string[][];
  const headers = (allRows[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = allRows.slice(1);

  const indexOf = (key: K): number => {
    const expected = columnDictionary[key];
    const idx = headers.findIndex((h) => h === expected);
    if (idx === -1) {
      throw new Error(`'${tabName}' 탭에 '${expected}' 컬럼을 찾을 수 없습니다.`);
    }
    return idx;
  };

  return { rows, headers, indexOf };
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cellToNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(value: unknown): string {
  const raw = cellToString(value);
  if (!raw) return "";
  // 시트가 "2026.04.21." / "2026-04-21" / "2026/04/21" 등 다양한 포맷을 줄 수 있음
  const cleaned = raw.replace(/[.\s]+$/g, "");
  const parts = cleaned.split(/[-/.]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const [y, m, d] = parts;
    const yyyy = y.padStart(4, "0");
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return raw;
}

function calcAgeMonths(birthDate: string, measureDate: string): number {
  if (!birthDate || !measureDate) return 0;
  const b = new Date(birthDate);
  const m = new Date(measureDate);
  if (isNaN(b.getTime()) || isNaN(m.getTime())) return 0;
  let months = (m.getFullYear() - b.getFullYear()) * 12 + (m.getMonth() - b.getMonth());
  if (m.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

export async function getProfile(): Promise<ChildProfile | null> {
  const { rows, indexOf } = await fetchTab<ProfileKey>(PROFILE_TAB, PROFILE_COLUMN_KEYS);
  if (rows.length === 0) return null;

  const row = rows[0];
  const name = cellToString(row[indexOf("name")]);
  const birthDate = normalizeDate(row[indexOf("birthDate")]);
  const genderRaw = cellToString(row[indexOf("gender")]);
  const gender: "M" | "F" = /여|female|^f/i.test(genderRaw) ? "F" : "M";

  if (!name) return null;

  return { name, gender, birthDate };
}

export async function listRecords(): Promise<GrowthRecord[]> {
  const profile = await getProfile().catch(() => null);
  const birthDate = profile?.birthDate ?? "";

  const { rows, indexOf } = await fetchTab<RecordKey>(RECORDS_TAB, RECORD_COLUMN_KEYS);
  const dateIdx = indexOf("date");
  const heightIdx = indexOf("heightCm");
  const weightIdx = indexOf("weightKg");
  const ageIdx = indexOf("ageMonths");
  const createdByIdx = indexOf("createdBy");
  const memoIdx = indexOf("memo");
  const createdAtIdx = indexOf("createdAt");

  return rows
    .map((row, i) => {
      const date = normalizeDate(row[dateIdx]);
      if (!date) return null;
      const height = cellToNumber(row[heightIdx]);
      const weight = cellToNumber(row[weightIdx]);
      const ageMonthsCell = cellToNumber(row[ageIdx]);
      const ageMonths = ageMonthsCell || calcAgeMonths(birthDate, date);
      const record: GrowthRecord = {
        rowIndex: i + 2, // 시트 행 번호 (1행은 헤더)
        date,
        heightCm: height,
        weightKg: weight,
        ageMonths,
        createdBy: cellToString(row[createdByIdx]),
        memo: cellToString(row[memoIdx]),
        createdAt: cellToString(row[createdAtIdx]),
      };
      return record;
    })
    .filter((r): r is GrowthRecord => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface RecordInput {
  date: string;
  heightCm: number;
  weightKg: number;
  memo?: string;
  createdBy: string;
}

function buildRowValues(
  headers: string[],
  values: Record<string, string | number>
): (string | number)[] {
  return headers.map((header) => {
    const trimmed = header.trim();
    return Object.prototype.hasOwnProperty.call(values, trimmed) ? values[trimmed] : "";
  });
}

function nowKstIso(): string {
  // KST 기준 ISO 문자열 (시각 표시용)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("T", " ").substring(0, 19);
}

export async function appendRecord(input: RecordInput): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const profile = await getProfile().catch(() => null);
  const ageMonths = calcAgeMonths(profile?.birthDate ?? "", input.date);

  const { headers } = await fetchTab<RecordKey>(RECORDS_TAB, RECORD_COLUMN_KEYS);
  const rowValues = buildRowValues(headers, {
    [RECORD_COLUMN_KEYS.date]: input.date,
    [RECORD_COLUMN_KEYS.heightCm]: input.heightCm,
    [RECORD_COLUMN_KEYS.weightKg]: input.weightKg,
    [RECORD_COLUMN_KEYS.ageMonths]: ageMonths,
    [RECORD_COLUMN_KEYS.createdBy]: input.createdBy,
    [RECORD_COLUMN_KEYS.memo]: input.memo ?? "",
    [RECORD_COLUMN_KEYS.createdAt]: nowKstIso(),
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${RECORDS_TAB}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [rowValues] },
  });
}

export async function updateRecord(rowIndex: number, input: RecordInput): Promise<void> {
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    throw new Error("올바르지 않은 행 번호입니다.");
  }
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const profile = await getProfile().catch(() => null);
  const ageMonths = calcAgeMonths(profile?.birthDate ?? "", input.date);

  const { headers } = await fetchTab<RecordKey>(RECORDS_TAB, RECORD_COLUMN_KEYS);
  const rowValues = buildRowValues(headers, {
    [RECORD_COLUMN_KEYS.date]: input.date,
    [RECORD_COLUMN_KEYS.heightCm]: input.heightCm,
    [RECORD_COLUMN_KEYS.weightKg]: input.weightKg,
    [RECORD_COLUMN_KEYS.ageMonths]: ageMonths,
    [RECORD_COLUMN_KEYS.createdBy]: input.createdBy,
    [RECORD_COLUMN_KEYS.memo]: input.memo ?? "",
    [RECORD_COLUMN_KEYS.createdAt]: nowKstIso(),
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${RECORDS_TAB}!A${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [rowValues] },
  });
}

export async function deleteRecord(rowIndex: number): Promise<void> {
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    throw new Error("올바르지 않은 행 번호입니다.");
  }
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 시트 ID(gid)를 얻어 해당 행을 deleteDimension으로 제거
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === RECORDS_TAB);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`'${RECORDS_TAB}' 탭을 찾을 수 없습니다.`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1, // 0-based, 헤더 포함이므로 그대로
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}
