# 📢 푸시알림테스트 앱 (Push Notification Test)

관리자가 구독된 디바이스에 푸시 알림을 전송하여 테스트할 수 있는 도구입니다.

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [API 엔드포인트](#api-엔드포인트)
- [UI 구조](#ui-구조)
- [사용 방법](#사용-방법)
- [전송 모드](#전송-모드)

## 개요

### 목적

푸시 알림 시스템을 테스트하고 관리하기 위한 관리자 전용 도구입니다.

### 접근 권한

- **관리자 전용**: `role === "admin"` 필수
- 일반 사용자 접근 시 403 Forbidden 반환

### 기술 스택

- **프론트엔드**: React 19 + TypeScript
- **백엔드**: Next.js 15 API Routes
- **푸시 전송**: web-push 라이브러리
- **인증**: JWT 토큰 기반

## 주요 기능

### 1️⃣ 구독 사용자 관리

- 전체 구독 사용자 목록 조회
- 사용자별 구독 디바이스 수 표시
- 디바이스 상세 정보 (이름, 타입, 브라우저, OS)

### 2️⃣ 다양한 전송 모드

**브로드캐스트**

- 모든 구독자에게 일괄 전송
- 전체 디바이스 수 표시

**특정 사용자**

- 사용자 선택 → 해당 사용자의 모든 디바이스에 전송
- 사용자 클릭 시 디바이스 목록 펼치기/접기

**특정 디바이스**

- 개별 디바이스 선택하여 1개만 전송
- 디바이스 아이콘 및 상세 정보 표시

### 3️⃣ 메시지 작성

- **제목**: 알림 제목 (필수)
- **내용**: 알림 본문 (필수)
- **URL**: 클릭 시 이동할 URL (선택)
- **실시간 미리보기**: 입력 내용을 카드 형태로 미리보기

### 4️⃣ 전송 결과 리포트

- 성공 개수 / 실패 개수
- 디바이스별 전송 결과 상세
- 실패 사유 표시

### 5️⃣ 통계 대시보드

- 총 구독 사용자 수
- 총 디바이스 수
- 데스크톱 디바이스 수
- 모바일 디바이스 수

## API 엔드포인트

### GET /api/admin/push/users

구독 사용자 목록 조회

**요청 헤더:**

```
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

**응답:**

```json
{
  "success": true,
  "message": "구독 사용자 목록을 불러왔습니다",
  "data": {
    "users": [
      {
        "userId": "1",
        "username": "admin",
        "name": "관리자",
        "subscriptionCount": 2,
        "devices": [
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
    ]
  }
}
```

### POST /api/admin/push/send

푸시 알림 전송

**요청 헤더:**

```
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

**요청 본문 (브로드캐스트):**

```json
{
  "broadcast": true,
  "title": "전체 공지",
  "body": "모든 사용자에게 전송되는 메시지입니다",
  "url": "https://example.com"
}
```

**요청 본문 (특정 사용자):**

```json
{
  "userId": "1",
  "title": "개인 알림",
  "body": "특정 사용자에게만 전송됩니다",
  "url": "/dashboard"
}
```

**요청 본문 (특정 디바이스):**

```json
{
  "userId": "1",
  "endpoint": "https://fcm.googleapis.com/...",
  "title": "디바이스 테스트",
  "body": "특정 디바이스에만 전송됩니다"
}
```

**응답:**

```json
{
  "success": true,
  "message": "푸시 알림이 전송되었습니다",
  "data": {
    "sent": 5,
    "failed": 1,
    "results": [
      {
        "endpoint": "https://fcm.googleapis.com/...",
        "deviceName": "Chrome on Windows",
        "success": true
      },
      {
        "endpoint": "https://fcm.googleapis.com/...",
        "deviceName": "Safari on iPhone",
        "success": false,
        "error": "Subscription has expired or is no longer valid"
      }
    ]
  }
}
```

## UI 구조

### 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ 관리자 헤더 (DashboardHeader)                              │
├─────────────────────────────────────────────────────────┤
│ 제목: 📢 푸시알림테스트                                    │
├─────────────────┬───────────────────────────────────────┤
│                 │                                       │
│  수신 대상 선택  │    메시지 작성                          │
│  (좌측 패널)     │    (우측 패널)                         │
│                 │                                       │
│  ○ 전체         │  제목: [입력]                          │
│  ○ 사용자1 ▼    │  내용: [입력]                          │
│    ○ 디바이스1   │  URL:  [입력]                          │
│    ○ 디바이스2   │                                       │
│  ○ 사용자2      │  [미리보기 카드]                        │
│                 │                                       │
│                 │  [전송 버튼]                           │
│                 │  [전송 결과]                           │
├─────────────────┴───────────────────────────────────────┤
│ 통계 대시보드                                             │
│ [사용자: 5명]  [디바이스: 12개]  [데스크톱: 8]  [모바일: 4] │
└─────────────────────────────────────────────────────────┘
```

### 좌측 패널: 수신 대상 선택

- **전체 브로드캐스트** 라디오 버튼
- **사용자 목록** 라디오 버튼 그룹
  - 사용자명 + 구독 수 표시
  - 클릭 시 디바이스 목록 펼치기/접기
- **디바이스 목록** 라디오 버튼 (들여쓰기)
  - 디바이스 아이콘 (💻/📱/📋)
  - 디바이스 이름
  - 브라우저 + OS 정보

### 우측 패널: 메시지 작성

- **제목 입력** (필수)
- **내용 입력** (필수)
- **URL 입력** (선택)
- **미리보기 카드**
  - 제목, 내용, URL 실시간 표시
  - 실제 알림과 동일한 스타일
- **전송 버튼**
  - 선택된 대상 표시
  - 비활성화 조건: 제목/내용 미입력, 대상 미선택
- **전송 결과**
  - 성공/실패 개수
  - 디바이스별 상세 결과

### 하단: 통계 대시보드

4개의 통계 카드:

- 구독 사용자 수
- 전체 디바이스 수
- 데스크톱 디바이스 수
- 모바일 디바이스 수

## 사용 방법

### 1. 접근

1. 관리자 계정으로 로그인 (`admin/password`)
2. 대시보드에서 **📢 푸시알림테스트** 앱 클릭
3. 또는 직접 URL 접속: `/dashboard/admin/push-test`

### 2. 브로드캐스트 전송

1. 좌측에서 **"전체 브로드캐스트"** 라디오 버튼 선택
2. 우측에서 제목, 내용 입력
3. (선택) URL 입력
4. **"전송"** 버튼 클릭
5. 전송 결과 확인

### 3. 특정 사용자에게 전송

1. 좌측에서 사용자 선택 (라디오 버튼)
2. 우측에서 메시지 작성
3. **"전송"** 버튼 클릭
4. 해당 사용자의 모든 디바이스에 전송됨

### 4. 특정 디바이스에만 전송

1. 좌측에서 사용자 클릭 (디바이스 목록 펼치기)
2. 원하는 디바이스 라디오 버튼 선택
3. 우측에서 메시지 작성
4. **"전송"** 버튼 클릭
5. 선택한 디바이스 1개에만 전송됨

### 5. 전송 결과 확인

전송 후 다음 정보를 확인할 수 있습니다:

- ✅ 성공 개수
- ❌ 실패 개수
- 디바이스별 상세 결과 (디바이스 이름, 성공/실패, 실패 사유)

## 전송 모드

### 브로드캐스트 (Broadcast)

**조건**: `broadcast: true`

**동작**:

- 모든 사용자의 모든 구독 디바이스에 전송
- 전체 알림, 긴급 공지 등에 사용

**예시 시나리오**:

- 시스템 점검 공지
- 새로운 기능 출시 알림
- 긴급 공지사항

### 특정 사용자 (User)

**조건**: `userId: "1"` (endpoint 없음)

**동작**:

- 지정된 사용자의 모든 구독 디바이스에 전송
- 사용자가 데스크톱, 모바일 등 여러 디바이스를 사용 중이면 모두 수신

**예시 시나리오**:

- 개인 맞춤 알림
- 특정 사용자 대상 테스트
- 관리자 → 특정 사용자 메시지

### 특정 디바이스 (Device)

**조건**: `userId: "1"`, `endpoint: "https://..."`

**동작**:

- 지정된 디바이스 1개에만 전송
- 가장 정밀한 제어

**예시 시나리오**:

- 디바이스별 알림 테스트
- 특정 디바이스 문제 디버깅
- 모바일 전용 알림

## 에러 처리

### 권한 없음 (403)

```json
{
  "success": false,
  "message": "관리자 권한이 필요합니다"
}
```

**해결**: 관리자 계정으로 로그인

### 인증 실패 (401)

```json
{
  "success": false,
  "message": "인증 필요"
}
```

**해결**: 토큰 만료 시 재로그인

### 구독자 없음

```json
{
  "success": false,
  "message": "구독된 사용자가 없습니다"
}
```

**해결**: 최소 1명의 사용자가 푸시 알림을 구독해야 함

### 전송 실패

전송 실패 시 결과에 포함됩니다:

```json
{
  "endpoint": "https://...",
  "deviceName": "Safari on iPhone",
  "success": false,
  "error": "Subscription has expired or is no longer valid"
}
```

**일반적인 실패 사유**:

- 구독 만료 (사용자가 브라우저 데이터 삭제)
- 잘못된 endpoint
- 푸시 서비스 응답 없음

## 보안

### 관리자 권한 검증

모든 API 엔드포인트에서 2단계 검증:

1. **JWT 토큰 검증**: 유효한 토큰인지 확인
2. **Role 체크**: `decoded.role === "admin"` 확인

```typescript
const decoded = verifyToken(token);
if (!decoded) {
  return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
}

if (decoded.role !== "admin") {
  return NextResponse.json({ success: false, message: "관리자 권한이 필요합니다" }, { status: 403 });
}
```

### VAPID 인증

푸시 전송 시 VAPID 키를 사용한 서버 인증:

```typescript
webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
```

## 데이터 흐름

### 페이지 로드

```
[페이지 마운트] → [GET /api/admin/push/users] → [사용자 목록 표시]
```

### 푸시 전송

```
[전송 버튼 클릭] → [POST /api/admin/push/send] → [web-push 전송] → [결과 표시]
```

## 관련 파일

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── push/
│   │           ├── users/
│   │           │   └── route.ts       # 구독 사용자 조회
│   │           └── send/
│   │               └── route.ts       # 푸시 전송
│   └── dashboard/
│       └── admin/
│           └── push-test/
│               └── page.tsx           # UI (523 lines)
├── components/
│   └── ProtectedRoute.tsx             # 권한 검증 HOC
├── lib/
│   ├── auth.ts                        # JWT 검증
│   └── data.ts                        # 구독 데이터 조회
└── types/
    └── index.ts                       # 타입 정의

data/
├── apps.csv                           # 앱 메타데이터 (id=15)
└── subscriptions.csv                  # 구독 데이터
```

## 라이선스

이 프로젝트는 Hobeom Portal의 일부입니다.
