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

### 4️⃣ 알림 설정

- **할일 알림**: 할일 관련 알림 토글
- **여행 준비 알림**: 여행 준비 관련 알림 토글
- **이메일 알림**: 이메일 알림 토글

## 데이터 구조

### CSV 스키마 (`data/user-settings.csv`)

```csv
id,user_id,category,key,value,updated_at
1,1,display,dashboardColumns,4,2024-01-15T10:00:00.000Z
2,1,display,cardSize,medium,2024-01-15T10:00:00.000Z
3,1,daily_tasks,resetTime,00:00,2024-01-15T10:00:00.000Z
```

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
```

## API 엔드포인트

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

## 향후 개선 계획

- [ ] 테마 설정 (라이트/다크 모드)
- [ ] 언어 선택 (한국어/영어)
- [ ] 알림 시간 설정 (특정 시간에 알림)
- [ ] 할일 초기화 시간 실제 적용 (스케줄러)
- [ ] 주말 제외 옵션 실제 적용
- [ ] 설정 내보내기/가져오기
- [ ] 설정 초기화 기능

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
│   │   └── settings/
│   │       ├── route.ts           # GET/POST 설정 조회/저장
│   │       ├── profile/
│   │       │   └── route.ts       # PUT 프로필 업데이트
│   │       └── password/
│   │           └── route.ts       # PUT 비밀번호 변경
│   └── dashboard/
│       └── settings/
│           └── page.tsx           # 설정 페이지 UI
├── lib/
│   └── data.ts                    # 설정 데이터 함수
└── types/
    └── index.ts                   # 설정 타입 정의

data/
├── user-settings.csv              # 실제 설정 데이터
└── user-settings.sample.csv       # 샘플 템플릿
```

## 라이선스

이 프로젝트는 Hobeom Portal의 일부입니다.
