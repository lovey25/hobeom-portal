# 🏗️ 아키텍처

호범 포털의 프로젝트 구조 및 설계 원칙

## 📁 프로젝트 구조

```
hobeom-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # REST API 엔드포인트
│   │   │   ├── auth/          # 인증 API
│   │   │   ├── apps/          # 앱 목록 API
│   │   │   ├── users/         # 사용자 관리 API
│   │   │   ├── settings/      # 설정 API
│   │   │   ├── push/          # 푸시 구독 API
│   │   │   ├── admin/         # 관리자 전용 API
│   │   │   │   └── push/      # 관리자 푸시 API
│   │   │   └── travel-prep/   # 여행 준비 API
│   │   ├── dashboard/         # 대시보드 앱들
│   │   │   ├── settings/      # 설정 앱 (+ README.md)
│   │   │   ├── travel-prep/   # 여행 준비 앱 (+ README.md)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── bags/
│   │   │   │   ├── items/
│   │   │   │   └── components/
│   │   │   ├── users/         # 사용자 관리 (+ README.md)
│   │   │   ├── csv-editor/    # CSV 편집기 (+ README.md)
│   │   │   ├── daily-tasks/   # 할일 현황 (+ README.md)
│   │   │   ├── praise-badge/  # 칭찬뱃지 (+ README.md)
│   │   │   ├── growth-records/ # 성장기록 (Google Sheets 기반, + README.md)
│   │   │   └── admin/         # 관리자 전용 앱
│   │   │       └── push-test/ # 푸시알림테스트 (+ README.md)
│   │   ├── samples/           # 퍼블릭 샘플 앱들 (+ README.md)
│   │   │   ├── calculator/
│   │   │   ├── notepad/
│   │   │   └── weather/
│   │   ├── login/             # 로그인 페이지
│   │   ├── signup/            # 회원가입 페이지
│   │   ├── layout.tsx         # 루트 레이아웃 (AuthProvider)
│   │   ├── page.tsx           # 랜딩 페이지
│   │   └── globals.css        # 글로벌 스타일
│   ├── components/            # 재사용 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── AppIconGrid.tsx    # 앱 아이콘 그리드
│   │   ├── DashboardHeader.tsx # 대시보드 헤더
│   │   ├── LoginForm.tsx      # 로그인 폼
│   │   ├── ProtectedRoute.tsx # 인증 라우트 보호
│   │   └── PWAInstallButton.tsx # PWA 설치 버튼
│   ├── contexts/              # React 컨텍스트
│   │   └── AuthContext.tsx    # 인증 상태 관리
│   ├── lib/                   # 유틸리티 라이브러리
│   │   ├── auth.ts           # JWT 인증 유틸
│   │   ├── cookies.ts        # 쿠키 관리 유틸
│   │   ├── data.ts           # CSV 데이터 액세스 레이어
│   │   ├── db.ts             # SQLite (카페 게시판)
│   │   ├── sheets/           # Google Sheets 어댑터 (성장기록)
│   │   │   ├── client.ts             # Service Account 인증
│   │   │   ├── growthAdapter.ts      # 시트 read/append/update/delete
│   │   │   └── percentile-data.ts    # 표준 성장도표 백분위 (정적)
│   │   └── device.ts         # 디바이스 감지 유틸
│   └── types/                 # TypeScript 타입 정의
│       └── index.ts           # 공통 타입
├── data/                      # CSV 데이터 저장소
│   ├── *.csv                 # 실제 데이터 (Git 제외)
│   └── *.sample.csv          # 샘플 데이터 (Git 포함)
├── docs/                      # 프로젝트 문서
│   ├── getting-started.md
│   ├── architecture.md
│   ├── deployment.md
│   ├── app-management.md
│   └── push-pwa-user-guide.md
├── public/                    # 정적 파일
│   ├── manifest.json         # PWA 매니페스트
│   ├── sw.js                 # Service Worker
│   └── icon-*.png            # PWA 아이콘
├── scripts/                   # 유틸리티 스크립트
│   ├── init-dev.sh           # 개발 환경 초기화
│   ├── generate-vapid-keys.js # VAPID 키 생성
│   └── push-scheduler.js     # 백그라운드 푸시 스케줄러
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## 🎯 설계 원칙

### 1. 모듈형 앱 구조

각 앱은 독립적인 모듈로 설계되어 있습니다:

- **라우트**: `src/app/dashboard/[app-name]/`
- **API**: `src/app/api/[app-name]/`
- **문서**: `src/app/dashboard/[app-name]/README.md`

새 앱 추가 시:

1. `data/apps.csv`에 앱 정보 추가
2. 라우트 및 API 생성
3. README 작성

### 2. 3계층 아키텍처

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (React Components, UI)           │
│  src/app/, src/components/          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│          Business Layer             │
│    (API Routes, Logic)              │
│  src/app/api/, src/lib/             │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│          Data Layer                 │
│    (CSV Files, Data Access)         │
│  data/, src/lib/data.ts             │
└─────────────────────────────────────┘
```

### 3. 인증 흐름

```
┌──────────────┐
│    Client    │
│   (Browser)  │
└──────┬───────┘
       │ 1. Login Request
       ↓
┌──────────────────────────────────┐
│  /api/auth/login                 │
│  - Validate credentials          │
│  - Generate JWT token            │
└──────┬───────────────────────────┘
       │ 2. JWT Token (Cookie)
       ↓
┌──────────────┐
│  AuthContext │ ← 3. Store token & user
│  (Global)    │
└──────┬───────┘
       │ 4. Protected Route Access
       ↓
┌──────────────────────────────────┐
│  ProtectedRoute Component        │
│  - Check authentication          │
│  - Verify role (if needed)       │
└──────┬───────────────────────────┘
       │ 5. Render if authorized
       ↓
┌──────────────┐
│  Dashboard   │
│    Apps      │
└──────────────┘
```

## 🔐 인증 시스템

### JWT 기반 인증

- **토큰 생성**: `src/lib/auth.ts` - `generateToken()`
- **토큰 검증**: `src/lib/auth.ts` - `verifyToken()`
- **쿠키 저장**: `src/lib/cookies.ts` - `cookieUtils`
- **전역 상태**: `src/contexts/AuthContext.tsx`

### 보호된 라우트

```tsx
// src/components/ProtectedRoute.tsx
<ProtectedRoute requiredRole="admin">
  <AdminContent />
</ProtectedRoute>
```

### API 인증

```typescript
// API 라우트에서 토큰 검증
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const decoded = verifyToken(token);

if (!decoded) {
  return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
}
```

## 📊 데이터 관리

도메인별로 의도적으로 **세 가지 저장소**를 분리해 사용합니다. 새 기능을 추가할 땐 도메인 성격에 맞는 레이어를 선택하고, 명시적 사유 없이 데이터를 다른 레이어로 옮기지 않습니다.

| 레이어 | 위치 | 사용처 |
| ------ | ---- | ------ |
| **CSV** | `data/*.csv` + `src/lib/data.ts` | 사용자, 앱, 설정, 여행 준비, 오늘할일, 칭찬뱃지, 푸시 구독, 활동 로그 등 대부분 도메인 |
| **SQLite** | `data/cafe.db` + `src/lib/db.ts` | 카페 게시판(posts·comments) 한정 |
| **Google Sheets** | `src/lib/sheets/` (Service Account) | 성장기록 한정 — 시트가 SoT, 마이그레이션 없음 |

### CSV 기반 저장소

**장점:**

- 설정 불필요 (DB 서버 없음)
- 버전 관리 용이 (샘플 데이터)
- 개발/테스트 간편

**제한사항:**

- 동시 쓰기 제한 (배치 API로 해결)
- 대용량 데이터 비효율
- 관계형 쿼리 제한

### SQLite (카페)

- `better-sqlite3` + WAL 모드.
- `src/lib/db.ts` import 시 자동으로 테이블 생성.
- 게시글·댓글처럼 관계형 무결성과 트랜잭션이 필요한 도메인에만 사용.

### Google Sheets (성장기록)

- 인증: Google Cloud Service Account JSON (`GOOGLE_SERVICE_ACCOUNT_KEY`) + 대상 스프레드시트 공유(편집자).
- 어댑터: [src/lib/sheets/growthAdapter.ts](../src/lib/sheets/growthAdapter.ts) 가 1행 헤더를 읽어 컬럼을 동적으로 매핑하므로, 시트의 컬럼 순서 변경에 강함.
- 식별자는 시트 행 번호(1-based). 수정·삭제 모두 행 번호 키로 동작.
- 자녀 프로필은 `설정` 탭, 측정 기록은 `기록` 탭. 자세한 내용은 [성장기록 README](../src/app/dashboard/growth-records/README.md) 참고.

### 데이터 액세스 레이어

`src/lib/data.ts`에서 모든 CSV 작업 처리:

```typescript
// 읽기
const users = await getUsers();
const user = await getUserByUsername("admin");

// 쓰기
await addUser(newUser);
await updateUser(userId, updates);
await deleteUser(userId);
```

### 자동 초기화

```typescript
// src/lib/data.ts - ensureDataFile()
// *.csv 파일이 없으면 *.sample.csv에서 자동 복사
```

## 🎨 UI/UX 패턴

### 컴포넌트 계층

```
App Layout (AuthProvider)
├── Landing Page
│   ├── AppIconGrid (Public Apps)
│   └── LoginForm
├── Dashboard
│   ├── DashboardHeader
│   ├── AppIconGrid (Dashboard Apps)
│   └── ProtectedRoute
│       └── Individual Apps
└── Sample Apps (No Auth)
```

### 재사용 가능한 UI 컴포넌트

- `Button`: 일관된 버튼 스타일
- `Card`: 컨테이너 레이아웃
- `Input`: 폼 입력 필드
- `Modal`: 모달 다이얼로그

### 스타일링

- **Tailwind CSS v4**: 유틸리티 우선 CSS
- **반응형 디자인**: 모바일 우선 접근
- **테마**: 확장 가능한 컬러 시스템

## 🔄 API 설계

### 표준 응답 형식

모든 API는 일관된 형식 사용:

```typescript
interface ApiResponse {
  success: boolean;
  message: string; // 항상 한국어
  data?: any;
}
```

### RESTful 엔드포인트

```
GET    /api/apps           # 앱 목록
POST   /api/auth/login     # 로그인
POST   /api/auth/verify    # 토큰 검증
GET    /api/users          # 사용자 목록
PUT    /api/users/[id]     # 사용자 수정
DELETE /api/users/[id]     # 사용자 삭제
```

### 배치 작업 패턴

성능 최적화를 위한 배치 API:

```
POST /api/travel-prep/trip-items/batch        # 일괄 추가
POST /api/travel-prep/trip-items/batch-delete # 일괄 삭제
POST /api/travel-prep/trip-items/batch-update-bag # 일괄 이동
```

## 🔔 Web Push 시스템 아키텍처

### 전체 구조

```
┌──────────────────────────────────────────────────────────────┐
│                    백그라운드 스케줄러                          │
│  scripts/push-scheduler.js (Node.js + node-cron)             │
│  - 매 분마다 알림 조건 체크                                    │
│  - 조건 충족 시 web-push 라이브러리로 전송                      │
└─────────────────────────┬────────────────────────────────────┘
                          │ webpush.sendNotification()
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    Push Service (FCM/Mozilla)                │
│  - 브라우저 벤더가 운영하는 푸시 서비스                         │
│  - VAPID 인증을 통한 보안 통신                                 │
└─────────────────────────┬────────────────────────────────────┘
                          │ Push Event
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    Service Worker (public/sw.js)             │
│  - 백그라운드에서 실행되는 브라우저 스크립트                     │
│  - 푸시 이벤트 수신 및 알림 표시                               │
└─────────────────────────┬────────────────────────────────────┘
                          │ self.registration.showNotification()
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    사용자 디바이스                             │
│  - 브라우저 실행 중이면 알림 수신                              │
│  - PWA 설치 시 브라우저 꺼져도 수신 (모바일)                    │
└──────────────────────────────────────────────────────────────┘
```

### 다중 디바이스 구독 시스템

**데이터 모델:**

```csv
# data/subscriptions.csv
user_id,endpoint,p256dh_key,auth_key,device_name,device_type,browser,os,created_at,last_used
1,https://fcm.googleapis.com/...,BN7w...,k8Yz...,Chrome on Windows,desktop,Chrome,Windows,...,...
1,https://fcm.googleapis.com/...,Xy9P...,m3Qr...,Safari on iPhone,mobile,Safari,iOS,...,...
```

**복합키**: `user_id` + `endpoint` (한 사용자 여러 디바이스 가능)

**디바이스 감지** (`src/lib/device.ts`):

- User-Agent 헤더 파싱
- 디바이스 타입: desktop/mobile/tablet
- 브라우저: Chrome, Safari, Edge, Firefox, Samsung Internet
- OS: Windows, macOS, iOS, Android, Linux
- 자동 device_name 생성: "Chrome on Windows"

### API 엔드포인트

```
POST   /api/push/subscribe           # 푸시 구독 (디바이스 등록)
GET    /api/push/subscription        # 구독 목록 조회
POST   /api/push/unsubscribe         # 구독 해제 (특정 디바이스)
POST   /api/push/test                # 테스트 푸시 (모든 디바이스)

# 관리자 전용
GET    /api/admin/push/users         # 구독 사용자 + 디바이스 목록
POST   /api/admin/push/send          # 푸시 전송 (브로드캐스트/사용자/디바이스)
```

### 푸시 전송 모드

1. **브로드캐스트**: `broadcast: true` → 모든 구독자의 모든 디바이스
2. **특정 사용자**: `userId: "1"` → 해당 사용자의 모든 디바이스
3. **특정 디바이스**: `userId: "1", endpoint: "..."` → 1개 디바이스만

### VAPID 인증

```bash
# .env.local
VAPID_PUBLIC_KEY=BPm...
VAPID_PRIVATE_KEY=x8k...
VAPID_SUBJECT=mailto:admin@example.com
```

서버가 푸시 서비스에 자신을 인증하는 데 사용됩니다.

### Google Sheets 인증 (성장기록)

```bash
# .env.local
GOOGLE_SHEETS_ID=<스프레드시트 URL의 /d/{ID}/edit 부분>
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # JSON 전체 한 줄
```

Service Account 이메일을 대상 스프레드시트에 **편집자(Editor)** 권한으로 공유해야 동작합니다. 자세한 발급 절차는 [성장기록 README](../src/app/dashboard/growth-records/README.md) 참조.

### PWA (Progressive Web App)

```json
// public/manifest.json
{
  "name": "호범 포털",
  "short_name": "Hobeom",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**설치 조건:**

- HTTPS 연결 (localhost 예외)
- manifest.json 파일
- Service Worker 등록
- 아이콘 파일 (192x192, 512x512)

**설치 장점:**

- 브라우저 꺼져도 백그라운드 알림 수신 (모바일)
- 앱 아이콘으로 즉시 실행
- 독립된 창에서 실행
- 오프라인 지원

## 🚀 성능 최적화

### Turbopack

- 빠른 개발 서버 시작
- 빠른 HMR (Hot Module Replacement)
- `--turbopack` 플래그 필수 (package.json 설정)

### 클라이언트 사이드 캐싱

- 인증 상태: `AuthContext`
- 로컬 데이터: `localStorage` (샘플 앱)
- 쿠키: JWT 토큰 저장

### 배치 처리

- 여러 CSV 작업을 한 번의 읽기/쓰기로 처리
- N+1 문제 해결

## 🔧 확장 가이드

### 새 앱 추가하기

1. **앱 등록**

   ```csv
   # data/apps.csv
   id,name,description,icon,href,require_auth,category,order,is_active
   new-app,새 앱,설명,📱,/dashboard/new-app,true,dashboard,10,true
   ```

2. **라우트 생성**

   ```
   src/app/dashboard/new-app/
   ├── page.tsx        # 메인 페이지
   ├── README.md       # 앱 문서
   └── components/     # 앱 전용 컴포넌트
   ```

3. **API 생성** (필요 시)

   ```
   src/app/api/new-app/
   └── route.ts
   ```

4. **데이터 구조** (필요 시)
   ```
   data/
   ├── new-app-data.csv
   └── new-app-data.sample.csv
   ```

### DB로 마이그레이션

CSV를 데이터베이스로 교체하려면:

1. `src/lib/data.ts`의 함수들을 DB 쿼리로 교체
2. API 인터페이스는 동일하게 유지
3. Prisma ORM 또는 직접 DB 클라이언트 사용

```typescript
// 예: Prisma로 교체
// Before: const users = await getUsers();
// After:  const users = await prisma.user.findMany();
```

## 🔗 관련 문서

**공통 문서:**

- [시작하기](getting-started.md)
- [배포](deployment.md)
- [앱 관리](app-management.md)
- [푸시 알림 & PWA 사용자 가이드](push-pwa-user-guide.md)

**기능별 개발자 문서:**

- [설정 앱](../src/app/dashboard/settings/README.md) - Web Push, PWA, 프로필 관리
- [여행 준비 앱](../src/app/dashboard/travel-prep/README.md) - 준비물 관리, 그룹화
- [사용자 관리](../src/app/dashboard/users/README.md) - CRUD, 권한 관리
- [CSV 편집기](../src/app/dashboard/csv-editor/README.md) - 스프레드시트 인터페이스
- [성장기록](../src/app/dashboard/growth-records/README.md) - Google Sheets 기반 성장 곡선
- [푸시알림테스트](../src/app/dashboard/admin/push-test/README.md) - 관리자 푸시 도구
