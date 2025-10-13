# ⚙️ 설정 앱 (Settings App)

사용자별 맞춤 설정을 관리하는 포괄적인 설정 시스템입니다.

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [데이터 구조](#데이터-구조)
- [API 엔드포인트](#api-엔드포인트)
- [설정 카테고리](#설정-카테고리)
- [사용 방법](#사용-방법)

## 개요

설정 앱은 사용자가 포털의 다양한 기능을 자신의 취향에 맞게 조정할 수 있도록 합니다. 모든 설정은 CSV 파일에 저장되며, 실시간으로 반영됩니다.

### 기술 스택

- **프론트엔드**: React 19 + TypeScript
- **상태 관리**: React Hooks (useState, useEffect)
- **데이터 저장**: CSV 파일 (`data/user-settings.csv`)
- **인증**: JWT 토큰 기반
- **UI**: Tailwind CSS v4 + 커스텀 컴포넌트

## 주요 기능

### 1️⃣ 프로필 관리

- **이름 변경**: 사용자 표시 이름 수정
- **이메일 변경**: 중복 체크 포함
- **비밀번호 변경**:
  - 현재 비밀번호 확인 필수
  - 6자 이상 요구
  - bcrypt 해싱

### 2️⃣ 표시 설정

- **대시보드 열 개수**: 3/4/5/6열 선택
- **카드 크기**: 작게/보통/크게
- **미리보기**: 실시간 설정 미리보기

### 3️⃣ 할일 설정

- **초기화 시간**: 매일 할일 초기화 시간 설정 (기본: 00:00)
- **주말 제외**: 주말 자동 초기화 제외 옵션
- **통계 기간**: 7-90일 범위 설정
- **목표 완료율**: 50-100% 범위 설정

### 4️⃣ 백그라운드 푸시 알림 (Web Push API)

브라우저 탭이 닫혀있어도 백그라운드에서 알림을 받을 수 있습니다.

#### 푸시 알림 구독 관리

- **푸시 알림 구독**: 브라우저에 디바이스 등록
- **다중 디바이스 지원**: 여러 디바이스에서 동시 구독 가능
- **디바이스 관리**: 개별 디바이스 구독 해제
- **테스트 푸시**: 즉시 테스트 알림 전송

#### 디바이스 정보 자동 감지

구독 시 자동으로 감지되는 정보:

- 디바이스 타입: desktop/mobile/tablet
- 브라우저: Chrome, Safari, Edge, Firefox, Samsung Internet
- OS: Windows, macOS, iOS, Android, Linux
- 디바이스 이름: "Chrome on Windows"

#### 알림 종류

1. **할일 리마인더** - 설정한 시간에 오늘의 할일 확인 유도 (09:00, 12:00, 18:00, 21:00 등)
2. **여행 준비 알림** - 여행 D-day 기준 N일 전부터 준비물 확인 알림

### 5️⃣ PWA 설치 (앱으로 설치)

Progressive Web App으로 설치하면 더 나은 경험을 제공합니다.

#### PWA 설치 장점

- ✅ 브라우저가 완전히 꺼져도 백그라운드 알림 수신 가능
- ✅ 앱 아이콘 클릭으로 바로 실행
- ✅ 독립된 창에서 실행 (앱처럼)
- ✅ 오프라인에서도 기본 기능 사용 가능
- ✅ 더 빠른 로딩 속도

#### 플랫폼별 설치

**Android (Chrome/Edge)**

1. 설정 페이지에서 "🚀 앱으로 설치하기" 버튼 클릭
2. "설치" 확인

**iOS/iPadOS (Safari)**

1. Safari에서 공유 버튼(↑) → "홈 화면에 추가"
2. "추가" 확인

**Windows (Chrome/Edge)**

1. 주소창 오른쪽 설치 아이콘(⊕) 클릭
2. "설치" 확인

**macOS (Chrome/Safari/Edge)**

1. Chrome/Edge: 주소창 설치 아이콘 클릭
2. Safari: Dock에 추가 옵션 사용

## 데이터 구조

### CSV 스키마

#### `data/user-settings.csv`

```csv
id,user_id,category,key,value,updated_at
1,1,display,dashboardColumns,4,2024-01-15T10:00:00.000Z
2,1,display,cardSize,medium,2024-01-15T10:00:00.000Z
3,1,daily_tasks,resetTime,00:00,2024-01-15T10:00:00.000Z
```

#### `data/subscriptions.csv` (푸시 구독)

```csv
user_id,endpoint,p256dh_key,auth_key,device_name,device_type,browser,os,created_at,last_used
1,https://fcm.googleapis.com/...,BN7w...,k8Yz...,Chrome on Windows,desktop,Chrome,Windows,2024-01-15T10:00:00.000Z,2024-01-15T10:30:00.000Z
1,https://fcm.googleapis.com/...,Xy9P...,m3Qr...,Safari on iPhone,mobile,Safari,iOS,2024-01-15T11:00:00.000Z,2024-01-15T11:15:00.000Z
```

**복합키**: `user_id` + `endpoint` (한 사용자가 여러 디바이스에서 구독 가능)

### TypeScript 인터페이스

```typescript
interface UserSetting {
  id: string;
  userId: string;
  category: string;
  key: string;
  value: string;
  updatedAt: string;
}

interface SettingsConfig {
  display: {
    dashboardColumns: number;
    cardSize: "small" | "medium" | "large";
    language: string;
  };
  dailyTasks: {
    resetTime: string;
    excludeWeekends: boolean;
    statsPeriod: number;
    completionGoal: number;
  };
  notifications: {
    dailyTasksEnabled: boolean;
    travelPrepEnabled: boolean;
    emailEnabled: boolean;
  };
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  createdAt: string;
  lastUsed: string;
}
```

## API 엔드포인트

### 설정 관련 API

### GET /api/settings

사용자 설정 조회

**요청 헤더:**

```
Authorization: Bearer {JWT_TOKEN}
```

**응답:**

```json
{
  "success": true,
  "message": "설정을 불러왔습니다",
  "data": {
    "display": {
      "dashboardColumns": 4,
      "cardSize": "medium",
      "language": "ko"
    },
    "dailyTasks": {
      "resetTime": "00:00",
      "excludeWeekends": false,
      "statsPeriod": 30,
      "completionGoal": 80
    },
    "notifications": {
      "dailyTasksEnabled": true,
      "travelPrepEnabled": true,
      "emailEnabled": false
    }
  }
}
```

### POST /api/settings

사용자 설정 일괄 업데이트

**요청:**

```json
{
  "display": {
    "dashboardColumns": 5,
    "cardSize": "large"
  },
  "dailyTasks": {
    "completionGoal": 90
  }
}
```

**응답:**

```json
{
  "success": true,
  "message": "설정이 저장되었습니다"
}
```

### PUT /api/settings/profile

프로필 정보 업데이트 (이름, 이메일)

**요청:**

```json
{
  "name": "홍길동",
  "email": "hong@example.com"
}
```

**응답:**

```json
{
  "success": true,
  "message": "프로필이 업데이트되었습니다",
  "data": {
    "id": "1",
    "username": "hong",
    "email": "hong@example.com",
    "name": "홍길동",
    "role": "user"
  }
}
```

### PUT /api/settings/password

비밀번호 변경

**요청:**

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**응답:**

```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다"
}
```

### 푸시 알림 관련 API

#### POST /api/push/subscribe

푸시 알림 구독 (디바이스 등록)

**요청:**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BN7w...",
      "auth": "k8Yz..."
    }
  }
}
```

**응답:**

```json
{
  "success": true,
  "message": "푸시 알림 구독이 완료되었습니다"
}
```

**참고**: User-Agent 헤더에서 디바이스 정보를 자동으로 감지하여 저장합니다.

#### GET /api/push/subscription

현재 사용자의 모든 구독 조회

**응답:**

```json
{
  "success": true,
  "message": "구독 정보를 불러왔습니다",
  "data": {
    "subscriptions": [
      {
        "endpoint": "https://fcm.googleapis.com/...",
        "deviceName": "Chrome on Windows",
        "deviceType": "desktop",
        "browser": "Chrome",
        "os": "Windows",
        "createdAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "endpoint": "https://fcm.googleapis.com/...",
        "deviceName": "Safari on iPhone",
        "deviceType": "mobile",
        "browser": "Safari",
        "os": "iOS",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

#### POST /api/push/unsubscribe

푸시 알림 구독 해제 (특정 디바이스)

**요청:**

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**응답:**

```json
{
  "success": true,
  "message": "푸시 알림 구독이 해제되었습니다"
}
```

#### POST /api/push/test

테스트 푸시 알림 전송 (모든 디바이스)

**응답:**

```json
{
  "success": true,
  "message": "테스트 푸시가 전송되었습니다"
}
```

## 설정 카테고리

### display (표시 설정)

| Key              | Type   | Default  | Description                       |
| ---------------- | ------ | -------- | --------------------------------- |
| dashboardColumns | number | 4        | 대시보드 그리드 열 개수 (3-6)     |
| cardSize         | string | "medium" | 앱 카드 크기 (small/medium/large) |
| language         | string | "ko"     | 언어 설정                         |

### daily_tasks (할일 설정)

| Key             | Type    | Default | Description              |
| --------------- | ------- | ------- | ------------------------ |
| resetTime       | string  | "00:00" | 할일 초기화 시간 (HH:mm) |
| excludeWeekends | boolean | false   | 주말 초기화 제외 여부    |
| statsPeriod     | number  | 30      | 통계 기간 (7-90일)       |
| completionGoal  | number  | 80      | 목표 완료율 (50-100%)    |

### notifications (알림 설정)

| Key               | Type    | Default | Description           |
| ----------------- | ------- | ------- | --------------------- |
| dailyTasksEnabled | boolean | true    | 할일 알림 활성화      |
| travelPrepEnabled | boolean | true    | 여행 준비 알림 활성화 |
| emailEnabled      | boolean | false   | 이메일 알림 활성화    |

### push_subscriptions (푸시 구독 - subscriptions.csv)

| Key         | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| user_id     | string | 사용자 ID                                |
| endpoint    | string | 푸시 서비스 엔드포인트 URL (고유 식별자) |
| p256dh_key  | string | 공개키 (암호화)                          |
| auth_key    | string | 인증 키 (암호화)                         |
| device_name | string | 디바이스 이름 (예: "Chrome on Windows")  |
| device_type | string | desktop/mobile/tablet                    |
| browser     | string | 브라우저 이름                            |
| os          | string | 운영체제 이름                            |
| created_at  | string | 구독 생성 시간 (ISO)                     |
| last_used   | string | 마지막 사용 시간 (ISO)                   |

## 사용 방법

### 1. 설정 페이지 접근

대시보드에서 "⚙️ 설정" 아이콘 클릭

### 2. 탭 선택

- **프로필**: 개인 정보 및 비밀번호 관리
- **표시**: UI 레이아웃 커스터마이징
- **할일**: 할일 관리 옵션
- **알림**: 알림 수신 설정

### 3. 설정 변경

원하는 값으로 변경 후 "설정 저장" 버튼 클릭

### 4. 설정 반영

- **표시 설정**: 대시보드 페이지 새로고침 후 반영
- **할일 설정**: 다음 할일 조회 시 반영
- **알림 설정**: 즉시 반영

## 데이터 함수

### getUserSettings(userId)

사용자의 모든 설정을 조회하여 SettingsConfig 구조로 반환

```typescript
const settings = await getUserSettings("1");
console.log(settings.display.dashboardColumns); // 4
```

### updateUserSetting(userId, category, key, value)

단일 설정 항목 업데이트

```typescript
await updateUserSetting("1", "display", "dashboardColumns", 5);
```

### updateUserSettings(userId, settings)

여러 설정 항목 일괄 업데이트

```typescript
await updateUserSettings("1", {
  display: {
    dashboardColumns: 5,
    cardSize: "large",
  },
});
```

## 보안

### 인증

- 모든 API 엔드포인트는 JWT 인증 필요
- 토큰이 없거나 유효하지 않으면 401 Unauthorized 반환

### 권한

- 사용자는 자신의 설정만 조회/수정 가능
- 프로필 업데이트 시 이메일 중복 체크
- 비밀번호 변경 시 현재 비밀번호 확인 필수

### 데이터 검증

- 대시보드 열 개수: 3-6 범위
- 통계 기간: 7-90일 범위
- 목표 완료율: 50-100% 범위
- 비밀번호: 최소 6자

## 통합 기능

### 대시보드 연동

`src/app/dashboard/page.tsx`에서 설정을 불러와 적용:

```typescript
const [dashboardColumns, setDashboardColumns] = useState(4);
const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");

// 설정 불러오기
const loadSettings = async () => {
  const response = await fetch("/api/settings", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (result.success && result.data) {
    setDashboardColumns(result.data.display?.dashboardColumns || 4);
    setCardSize(result.data.display?.cardSize || "medium");
  }
};

// AppIconGrid에 적용
<AppIconGrid apps={apps} columns={dashboardColumns} cardSize={cardSize} />;
```

### AppIconGrid 컴포넌트

카드 크기 설정을 반영하도록 확장:

```typescript
interface AppIconGridProps {
  apps: AppIcon[];
  title?: string;
  columns?: number;
  cardSize?: "small" | "medium" | "large"; // 추가
}
```

## Web Push 아키텍처

### 작동 방식

```
[Node.js Scheduler] → [Push Service (FCM)] → [Service Worker] → [알림 표시]
  (매 분마다 체크)        (Google/Mozilla)         (브라우저)          (사용자)
```

1. **백그라운드 스케줄러** (`scripts/push-scheduler.js`)

   - Node.js + node-cron 사용
   - 매 분마다 알림 조건 체크
   - 조건 충족 시 web-push 라이브러리로 전송

2. **Push Service** (FCM/Mozilla Push Service)

   - 브라우저 벤더가 운영하는 푸시 서비스
   - VAPID 인증을 통한 보안 통신

3. **Service Worker** (`public/sw.js`)

   - 백그라운드에서 실행되는 브라우저 스크립트
   - 푸시 이벤트 수신 및 알림 표시

4. **사용자 디바이스**
   - 브라우저가 실행 중이면 알림 수신 가능
   - PWA 설치 시 브라우저 꺼져도 수신 가능 (모바일)

### 다중 디바이스 지원

- 한 사용자가 여러 디바이스에서 구독 가능
- 복합키 (user_id + endpoint)로 디바이스 구분
- 알림 발송 시 모든 구독 디바이스에 전송
- 개별 디바이스 구독 해제 가능

### VAPID 인증

```bash
# .env.local
VAPID_PUBLIC_KEY=BPm...
VAPID_PRIVATE_KEY=x8k...
VAPID_SUBJECT=mailto:admin@example.com
```

VAPID 키는 서버가 푸시 서비스에 자신을 인증하는 데 사용됩니다.

## 개발 가이드

### 푸시 알림 개발 서버 실행

```bash
# 터미널 1: Next.js 개발 서버
npm run dev

# 터미널 2: 푸시 스케줄러 (백그라운드)
npm run push-scheduler
```

### VAPID 키 생성 (최초 1회)

```bash
node scripts/generate-vapid-keys.js
```

이 명령은 `.env.local` 파일에 자동으로 VAPID 키를 추가합니다.

### 테스트 시나리오

1. **푸시 구독 테스트**

   - 설정 페이지 → 알림 탭
   - 브라우저 알림 권한 허용
   - "푸시 알림 구독하기" 클릭
   - 구독 상태 확인 (녹색 박스)

2. **테스트 푸시 전송**

   - "테스트 푸시 보내기" 버튼 클릭
   - 즉시 알림 수신 확인

3. **다중 디바이스 테스트**

   - 다른 브라우저/디바이스에서 로그인
   - 푸시 구독
   - "다른 디바이스" 섹션에서 디바이스 목록 확인
   - 테스트 푸시 시 모든 디바이스에서 수신 확인

4. **백그라운드 알림 테스트**
   - 브라우저 탭 닫기
   - 스케줄러가 알림 조건 체크 (매 분)
   - 조건 충족 시 알림 수신

### 디바이스 감지 유틸리티

`src/lib/device.ts`:

```typescript
interface DeviceInfo {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
}

export function detectDeviceInfo(userAgent: string): DeviceInfo;
```

User-Agent 문자열을 파싱하여 디바이스 정보를 자동으로 감지합니다.

### 데이터 함수

`src/lib/data.ts`:

```typescript
// 구독 조회
getPushSubscriptions(userId: string): Promise<PushSubscription[]>
getPushSubscriptionByEndpoint(userId: string, endpoint: string): Promise<PushSubscription | null>

// 구독 관리
savePushSubscription(userId, endpoint, p256dhKey, authKey, deviceName, deviceType, browser, os): Promise<void>
deletePushSubscription(userId: string, endpoint: string): Promise<void>
deleteAllUserPushSubscriptions(userId: string): Promise<void>
```

## 향후 개선 계획

- [ ] 테마 설정 (라이트/다크 모드)
- [ ] 언어 선택 (한국어/영어)
- [ ] 알림 시간 설정 (특정 시간에 알림)
- [ ] 할일 초기화 시간 실제 적용 (스케줄러)
- [ ] 주말 제외 옵션 실제 적용
- [ ] 설정 내보내기/가져오기
- [ ] 설정 초기화 기능
- [ ] 푸시 알림 히스토리 (전송 기록)

## 문제 해결

### 설정이 반영되지 않음

1. 브라우저 새로고침 (Ctrl+F5)
2. 쿠키 확인 (토큰 만료 시 재로그인)
3. 개발자 도구 콘솔에서 에러 확인

### 프로필 업데이트 실패

- 이메일 중복: 다른 사용자가 이미 사용 중인 이메일
- 토큰 만료: 재로그인 필요

### 비밀번호 변경 실패

- 현재 비밀번호 불일치
- 새 비밀번호 6자 미만
- 새 비밀번호 확인 불일치

## 관련 파일

```
src/
├── app/
│   ├── api/
│   │   ├── settings/
│   │   │   ├── route.ts           # GET/POST 설정 조회/저장
│   │   │   ├── profile/
│   │   │   │   └── route.ts       # PUT 프로필 업데이트
│   │   │   └── password/
│   │   │       └── route.ts       # PUT 비밀번호 변경
│   │   └── push/
│   │       ├── subscribe/
│   │       │   └── route.ts       # POST 푸시 구독
│   │       ├── subscription/
│   │       │   └── route.ts       # GET 구독 목록 조회
│   │       ├── unsubscribe/
│   │       │   └── route.ts       # POST 구독 해제
│   │       └── test/
│   │           └── route.ts       # POST 테스트 푸시
│   └── dashboard/
│       └── settings/
│           └── page.tsx           # 설정 페이지 UI
├── components/
│   └── PWAInstallButton.tsx      # PWA 설치 버튼 컴포넌트
├── lib/
│   ├── auth.ts                    # JWT 인증
│   ├── cookies.ts                 # 쿠키 관리
│   ├── data.ts                    # 데이터 함수 (설정, 구독)
│   └── device.ts                  # 디바이스 감지 유틸리티
└── types/
    └── index.ts                   # 타입 정의

public/
├── manifest.json                  # PWA 매니페스트
└── sw.js                          # Service Worker

scripts/
├── generate-vapid-keys.js         # VAPID 키 생성 스크립트
└── push-scheduler.js              # 백그라운드 푸시 스케줄러

data/
├── user-settings.csv              # 실제 설정 데이터
├── user-settings.sample.csv       # 샘플 템플릿
├── subscriptions.csv              # 푸시 구독 데이터
└── subscriptions.sample.csv       # 샘플 템플릿
```

## 라이선스

이 프로젝트는 Hobeom Portal의 일부입니다.
