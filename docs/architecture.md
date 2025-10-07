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
│   │   │   └── travel-prep/   # 여행 준비 API
│   │   ├── dashboard/         # 대시보드 앱들
│   │   │   ├── travel-prep/   # 여행 준비 앱 (+ README.md)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── bags/
│   │   │   │   ├── items/
│   │   │   │   └── components/
│   │   │   └── users/         # 사용자 관리 (+ README.md)
│   │   ├── samples/           # 퍼블릭 샘플 앱들 (+ README.md)
│   │   │   ├── calculator/
│   │   │   ├── notepad/
│   │   │   └── weather/
│   │   ├── login/             # 로그인 페이지
│   │   ├── signup/            # 회원가입 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
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
│   │   └── ProtectedRoute.tsx # 인증 라우트 보호
│   ├── contexts/              # React 컨텍스트
│   │   └── AuthContext.tsx    # 인증 상태 관리
│   ├── lib/                   # 유틸리티 라이브러리
│   │   ├── auth.ts           # JWT 인증 유틸
│   │   ├── cookies.ts        # 쿠키 관리 유틸
│   │   └── data.ts           # CSV 데이터 액세스 레이어
│   └── types/                 # TypeScript 타입 정의
│       └── index.ts           # 공통 타입
├── data/                      # CSV 데이터 저장소
│   ├── *.csv                 # 실제 데이터 (Git 제외)
│   └── *.sample.csv          # 샘플 데이터 (Git 포함)
├── docs/                      # 프로젝트 문서
├── public/                    # 정적 파일
├── scripts/                   # 유틸리티 스크립트
│   └── init-dev.sh           # 개발 환경 초기화
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

### CSV 기반 저장소

**장점:**

- 설정 불필요 (DB 서버 없음)
- 버전 관리 용이 (샘플 데이터)
- 개발/테스트 간편

**제한사항:**

- 동시 쓰기 제한 (배치 API로 해결)
- 대용량 데이터 비효율
- 관계형 쿼리 제한

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

- [시작하기](getting-started.md)
- [배포](deployment.md)
- [여행 준비 앱](../src/app/dashboard/travel-prep/README.md)
