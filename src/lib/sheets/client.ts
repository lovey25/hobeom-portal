import { google, sheets_v4 } from "googleapis";

let cachedClient: sheets_v4.Sheets | null = null;

function loadServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.");
  }

  let parsed: { client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 가 올바른 JSON 형식이 아닙니다.");
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY 에 client_email 또는 private_key 가 없습니다.");
  }

  return {
    client_email: parsed.client_email,
    // .env.local 에서 \n 이 리터럴 문자로 들어오는 경우 실제 개행으로 변환
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const creds = loadServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID 환경변수가 설정되지 않았습니다.");
  }
  return id;
}
