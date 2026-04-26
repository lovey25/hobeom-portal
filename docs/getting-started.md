# 🚀 시작하기

호범 포털 설치 및 실행 가이드

## 📋 사전 요구사항

- **Node.js**: v22 이상 (`.nvmrc` 참고, `package.json` engines 명시)
- **npm**: v10 이상
- **Git**: 최신 버전

## 🛠️ 설치

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/hobeom-portal.git
cd hobeom-portal
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정 (선택)

`.env.example` 을 복사해 `.env.local` 을 만들고 필요한 변수만 채웁니다. 사용하는 기능에 따라 항목별로 선택적으로 설정하면 됩니다.

```bash
# 인증 (프로덕션 필수, 개발은 미설정 시 기본값)
JWT_SECRET=your-secure-jwt-secret-key-here

# 웹 푸시 (푸시 알림 사용 시)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Google Sheets — 성장기록 앱 사용 시
GOOGLE_SHEETS_ID=your-spreadsheet-id-here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

- `JWT_SECRET`: 프로덕션 배포 전에는 반드시 강력한 랜덤 키로 설정 (`openssl rand -base64 32`).
- `VAPID_*`: `node scripts/generate-vapid-keys.js` 로 발급. 푸시 스케줄러도 이 변수를 사용.
- `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`: [성장기록 README](../src/app/dashboard/growth-records/README.md) 의 Service Account 발급·공유 절차를 따름. JSON은 한 줄로.

### 4. 데이터 초기화

첫 실행 시 CSV 파일이 자동으로 생성되지만, 수동으로 초기화하려면:

```bash
bash scripts/init.sh
# 또는
npm run init
```

이 스크립트는 `data/*.sample.csv` 파일을 `data/*.csv`로 복사합니다.

## 🏃 실행

### 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

**Turbopack 사용:** 개발 서버는 자동으로 Turbopack을 사용합니다 (`package.json` 설정).

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 실행
npm start
```

### 린트

```bash
npm run lint
```

## 🔑 테스트 계정

개발 환경에서 사용 가능한 테스트 계정:

| 사용자명 | 비밀번호   | 역할        | 설명                  |
| -------- | ---------- | ----------- | --------------------- |
| `admin`  | `password` | 관리자      | 모든 기능 접근 가능   |
| `user1`  | `password` | 일반 사용자 | 대시보드 앱 접근 가능 |
| `demo`   | `password` | 일반 사용자 | 데모 계정             |

## 📂 데이터 저장소

도메인별로 세 가지 저장소가 있습니다 (자세한 내용은 [아키텍처 문서](architecture.md) 의 "데이터 관리" 섹션 참고).

### 1) CSV (`data/*.csv`)

대부분의 도메인 — 사용자, 앱, 설정, 여행 준비, 오늘할일, 칭찬뱃지, 푸시 구독, 활동 로그 등.

```text
data/
├── users.csv / users.sample.csv
├── apps.csv / apps.sample.csv
├── user-app-settings.csv / user-app-settings.sample.csv
├── daily-tasks.csv / daily-tasks.sample.csv
├── daily-task-logs.csv, daily-stats.csv
├── travel-types.csv, travel-items.csv, bags.csv, trip-lists.csv, trip-items.csv
├── praise-badges.csv, praise-mappings.csv, praise-history.csv,
│   praise-redemptions.csv, praise-reward-items.csv
├── subscriptions.csv (웹 푸시 디바이스 구독)
└── activity-logs.csv
```

- **`*.csv`**: 실제 운영 데이터 (`.gitignore` 에 포함되어 Git에서 제외)
- **`*.sample.csv`**: 초기 데이터 템플릿 (Git 포함). `*.csv` 가 없으면 자동 복사.

### 2) SQLite (`data/cafe.db`)

카페 게시판(posts·comments) 한정. `src/lib/db.ts` import 시 자동 초기화.

### 3) Google Sheets (성장기록)

자녀의 키·몸무게 측정 데이터. CSV 미러 없이 Sheets가 SoT. `.env.local` 의 `GOOGLE_SHEETS_ID` / `GOOGLE_SERVICE_ACCOUNT_KEY` 가 비어 있으면 페이지 진입 시 안내 메시지가 표시됩니다.

첫 실행 시 `*.csv` 파일이 없으면 자동으로 `*.sample.csv`에서 복사됩니다.

## 🧪 개발 팁

### Hot Reload

Turbopack을 사용하므로 파일 변경 시 즉시 반영됩니다.

### 디버깅

- **서버 로그**: 터미널에서 API 요청 로그 확인
- **브라우저 DevTools**: React DevTools, Network 탭 활용
- **인증 문제**: 브라우저 쿠키 확인 (`hobeom-portal-token`)

### CSV 데이터 리셋

개발 중 데이터를 초기화하려면:

```bash
rm data/*.csv
bash scripts/init.sh
```

또는 서버 재시작 시 자동으로 샘플 데이터에서 복사됩니다.

## ⚠️ 주의사항

1. **JWT_SECRET**: 프로덕션에서는 반드시 안전한 시크릿 키 사용
2. **CSV 파일**: `data/*.csv`는 민감 정보를 포함하므로 Git에 커밋하지 않음
3. **Turbopack**: `npm run dev`는 반드시 `--turbopack` 플래그 사용 (package.json에 설정됨)

## 🔗 다음 단계

- [아키텍처](architecture.md) - 프로젝트 구조 이해
- [여행 준비 앱](../src/app/dashboard/travel-prep/README.md) - 주요 앱 사용법
- [배포](deployment.md) - 프로덕션 배포 가이드

## 🆘 문제 해결

### 포트가 이미 사용 중

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### CSV 파일 오류

```bash
# 데이터 파일 초기화
rm data/*.csv
bash scripts/init.sh
```
