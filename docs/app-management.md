# 앱 관리 기능# 앱 관리 및 활동 로그 기능

사용자별 앱 표시/숨김 및 순서 변경, 관리자의 전역 앱 활성화 기능을 제공합니다.## 개요

## 주요 기능사용자별 앱 표시/숨김, 순서 변경, 활동 로그 추적 기능을 제공합니다.

### 사용자 (모든 역할)## 🎯 주요 기능

- **개인 앱 표시/숨김**: 파란색 토글로 본인의 대시보드에서 앱 보이기/숨기기### 1. 사용자별 앱 관리

- **앱 순서 변경**: 드래그 앤 드롭으로 앱 순서 커스터마이징

- **카테고리별 관리**: 공용/개인/관리자 앱 분리- ✅ 앱 보이기/숨기기 토글

- ✅ 드래그 앤 드롭으로 앱 순서 변경

### 관리자 전용- ✅ 카테고리별 관리 (공용/개인/관리자)

- ✅ 대시보드에 실시간 반영

- **전역 앱 활성화/비활성화**: 빨간색 토글로 모든 사용자에 대한 앱 활성화 상태 관리

- **비활성화된 앱**: 관리자만 설정 페이지에서 볼 수 있음### 2. 활동 로그

## 데이터 구조- ✅ 사용자 활동 자동 기록

- ✅ 최근 활동 5개 표시

### apps.csv- ✅ 시간 표시 (방금 전, N분 전, N시간 전, N일 전)

- ✅ 활동 유형별 색상 구분

```csv

id,name,description,icon,href,require_auth,category,order,is_active### 3. 자동 초기화

```

- ✅ 신규 회원가입 시 모든 앱 자동 활성화

- `is_active`: 전역 활성화 상태 (관리자만 변경)- ✅ 기본 순서로 설정

### user-app-settings.csv## 📁 데이터 구조

````csv### user-app-settings.csv

id,user_id,app_id,is_visible,custom_order,category

```사용자별 앱 설정 저장



- `is_visible`: 개인 표시 설정 (각 사용자가 변경)```csv

id,user_id,app_id,is_visible,custom_order,category

## 우선순위1,1,1,true,1,public

2,1,5,true,1,dashboard

앱 표시 조건:3,1,6,false,2,dashboard

1. `apps.csv`의 `is_active === true` (관리자가 전역 활성화)```

2. AND `user-app-settings.csv`의 `is_visible === true` (사용자가 개인 활성화)

**필드 설명:**

## 활동 로그

- `id`: 고유 ID

사용자 활동을 자동으로 기록하여 추적합니다.- `user_id`: 사용자 ID

- `app_id`: 앱 ID

### activity-logs.csv- `is_visible`: 표시 여부 (true/false)

- `custom_order`: 사용자 지정 순서

```csv- `category`: 앱 카테고리 (public/dashboard/admin)

id,user_id,app_id,app_name,action,timestamp

```### activity-logs.csv



- 최근 활동 5개 표시사용자 활동 로그 저장

- 시간 표시: 방금 전, N분 전, N시간 전, N일 전

```csv

## 사용 방법id,user_id,action_type,action_description,created_at,app_id

1,1,task_complete,할일 3개를 완료했습니다,2024-10-12T06:00:00.000Z,5

1. 설정 → 📱 앱 관리 탭2,1,file_upload,새로운 파일을 업로드했습니다,2024-10-12T08:00:00.000Z,8

2. 토글 스위치로 앱 표시/숨김```

3. (관리자) 빨간색 토글로 전역 설정

4. 드래그로 앱 순서 변경**필드 설명:**



## 상세 문서- `id`: 고유 ID

- `user_id`: 사용자 ID

- `/src/app/dashboard/settings/README.md` - 설정 앱 기술 문서- `action_type`: 활동 유형 (task_complete, file_upload, data_analysis, travel_prep, profile_update 등)

- `action_description`: 활동 설명
- `created_at`: 활동 시간 (ISO 8601)
- `app_id`: 관련 앱 ID (선택)

## 🔧 API 엔드포인트

### 앱 설정 API

#### GET /api/user-apps

사용자별 앱 설정 조회

**응답:**

```json
{
  "success": true,
  "message": "앱 설정을 불러왔습니다",
  "data": [
    {
      "id": "1",
      "user_id": "1",
      "app_id": "1",
      "is_visible": "true",
      "custom_order": "1",
      "category": "public"
    }
  ]
}
````

#### PUT /api/user-apps

앱 표시 여부 업데이트

**요청:**

```json
{
  "appId": "5",
  "isVisible": false
}
```

**응답:**

```json
{
  "success": true,
  "message": "앱 표시 설정이 업데이트되었습니다"
}
```

#### POST /api/user-apps/reorder

앱 순서 변경

**요청:**

```json
{
  "category": "dashboard",
  "appOrders": [
    { "appId": "6", "order": 1 },
    { "appId": "5", "order": 2 },
    { "appId": "7", "order": 3 }
  ]
}
```

**응답:**

```json
{
  "success": true,
  "message": "앱 순서가 변경되었습니다"
}
```

### 활동 로그 API

#### GET /api/activity-logs?limit=10

사용자 활동 로그 조회

**응답:**

```json
{
  "success": true,
  "message": "활동 로그를 불러왔습니다",
  "data": [
    {
      "id": "1",
      "userId": "1",
      "actionType": "task_complete",
      "actionDescription": "할일 3개를 완료했습니다",
      "createdAt": "2024-10-12T06:00:00.000Z",
      "appId": "5"
    }
  ]
}
```

#### POST /api/activity-logs

활동 로그 추가

**요청:**

```json
{
  "actionType": "file_upload",
  "actionDescription": "새로운 파일을 업로드했습니다",
  "appId": "8"
}
```

**응답:**

```json
{
  "success": true,
  "message": "활동 로그가 추가되었습니다"
}
```

## 💻 데이터 함수

### 앱 설정 관련

#### getUserAppSettings(userId)

사용자별 앱 설정 조회

```typescript
const settings = await getUserAppSettings("1");
// 반환: 사용자의 모든 앱 설정 배열
```

#### updateUserAppVisibility(userId, appId, isVisible)

앱 표시 여부 업데이트

```typescript
await updateUserAppVisibility("1", "5", false);
// 앱 ID 5를 숨김
```

#### updateUserAppOrder(userId, category, appOrders)

앱 순서 변경

```typescript
await updateUserAppOrder("1", "dashboard", [
  { appId: "6", order: 1 },
  { appId: "5", order: 2 },
]);
```

#### initializeUserAppSettings(userId)

신규 사용자 앱 설정 초기화

```typescript
await initializeUserAppSettings("3");
// 새 사용자에게 모든 앱을 기본 순서로 활성화
```

### 활동 로그 관련

#### addActivityLog(userId, actionType, actionDescription, appId?)

활동 로그 추가

```typescript
await addActivityLog("1", "task_complete", "할일 3개를 완료했습니다", "5");
```

#### getActivityLogs(userId, limit)

사용자 활동 로그 조회

```typescript
const logs = await getActivityLogs("1", 10);
// 최근 10개 활동 로그 반환
```

## 🎨 사용 방법

### 1. 설정 페이지에서 앱 관리

1. **설정 페이지 접속**: 대시보드 → ⚙️ 설정
2. **앱 관리 탭 클릭**: 📱 앱 관리 탭 선택
3. **앱 보이기/숨기기**:
   - 토글 스위치로 앱 표시 여부 변경
   - 숨긴 앱은 대시보드에서 보이지 않음
4. **앱 순서 변경**:
   - 앱 카드를 드래그하여 원하는 위치로 이동
   - 순서 번호 (#1, #2, ...)가 표시됨
5. **대시보드 새로고침**: F5 키로 변경사항 반영

### 2. 대시보드에서 앱 목록 확인

대시보드 페이지는 자동으로:

- 사용자별 앱 설정 적용
- 숨긴 앱 제외
- 사용자 지정 순서로 정렬
- 카테고리별 그룹화

### 3. 최근 활동 확인

대시보드 하단의 "📋 최근 활동" 카드에서:

- 최근 5개 활동 표시
- 시간 표시 (자동 계산)
- 활동 유형별 색상 구분:
  - 🟢 할일 완료 (초록)
  - 🔵 파일 업로드 (파랑)
  - 🟣 데이터 분석 (보라)
  - 🟡 여행 준비 (노랑)
  - ⚪ 기타 (회색)

## 🔄 자동 활동 로그 기록

### 할일 완료 시

할일을 3개, 6개, 9개... 완료할 때마다 자동으로 로그 추가

```typescript
// src/app/api/daily-tasks/today/route.ts
if (completedTasks > 0 && completedTasks % 3 === 0) {
  await addActivityLog(decoded.id, "task_complete", `할일 ${completedTasks}개를 완료했습니다`, "5");
}
```

### 다른 앱에서 로그 추가

원하는 곳에서 `addActivityLog` 함수 호출

```typescript
// 예: 파일 업로드 후
await addActivityLog(userId, "file_upload", "새로운 파일을 업로드했습니다", "8");

// 예: 프로필 업데이트 후
await addActivityLog(userId, "profile_update", "프로필 정보를 업데이트했습니다", "10");
```

## 📊 대시보드 통합

### applyUserAppSettings 함수

대시보드에서 사용자 설정을 앱 목록에 적용

```typescript
const applyUserAppSettings = (apps, userSettings, category) => {
  return apps
    .map((app) => {
      const setting = userSettings.find((s) => s.app_id === app.id && s.category === category);
      if (setting) {
        return {
          ...app,
          isVisible: setting.is_visible === "true",
          customOrder: parseInt(setting.custom_order) || app.order,
        };
      }
      return { ...app, isVisible: true, customOrder: app.order };
    })
    .filter((app) => app.isVisible) // 숨긴 앱 제외
    .sort((a, b) => a.customOrder - b.customOrder); // 순서대로 정렬
};
```

### getTimeAgo 함수

활동 시간을 사람이 읽기 쉬운 형태로 변환

```typescript
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR");
};
```

## 🎯 UI 특징

### 앱 관리 탭

- **드래그 앤 드롭**: 직관적인 순서 변경
- **토글 스위치**: 쉬운 표시/숨김 설정
- **실시간 피드백**: 드래그 중 시각적 표시
- **순서 번호**: 현재 순서 표시 (#1, #2, ...)
- **카테고리 분리**: 공용/개인/관리자 도구 별도 관리
- **사용 팁**: 기능 안내 패널

### 최근 활동 카드

- **시간 표시**: 자동 계산된 상대 시간
- **색상 구분**: 활동 유형별 색상 점
- **깔끔한 레이아웃**: 간결한 정보 표시
- **실시간 업데이트**: 새로고침 시 최신 활동 반영

## 🔒 보안

### 인증

- 모든 API는 JWT 토큰 필요
- 사용자는 자신의 설정만 조회/수정 가능

### 권한

- 관리자 앱은 관리자만 표시
- 다른 사용자의 설정 접근 불가

## 🐛 문제 해결

### 앱 순서가 변경되지 않음

1. 드래그 앤 드롭을 정확히 수행했는지 확인
2. 대시보드 새로고침 (F5)
3. 브라우저 캐시 삭제

### 활동 로그가 표시되지 않음

1. 최근에 활동한 내역이 있는지 확인
2. API 호출이 성공했는지 브라우저 콘솔 확인
3. `activity-logs.csv` 파일 존재 여부 확인

### 숨긴 앱이 여전히 보임

1. 토글 스위치가 제대로 변경되었는지 확인
2. 대시보드 새로고침
3. 설정 페이지에서 다시 확인

## 📝 예제 코드

### 앱 순서 변경 전체 플로우

```typescript
// 1. 사용자가 앱을 드래그
<div
  draggable
  onDragStart={() => handleDragStart(app.id)}
  onDragOver={handleDragOver}
  onDrop={() => handleDrop(app.id, category)}
>
  {app.name}
</div>;

// 2. handleDrop에서 새로운 순서 계산
const newApps = [...categoryApps];
const [draggedApp] = newApps.splice(dragIndex, 1);
newApps.splice(dropIndex, 0, draggedApp);

const appOrders = newApps.map((app, index) => ({
  appId: app.id,
  order: index + 1,
}));

// 3. API 호출
await fetch("/api/user-apps/reorder", {
  method: "POST",
  body: JSON.stringify({ category, appOrders }),
});

// 4. 대시보드에서 자동 반영
const apps = applyUserAppSettings(allApps, userSettings, category);
```

### 활동 로그 추가 예제

```typescript
// 할일 완료 시
await addActivityLog(userId, "task_complete", "할일 3개를 완료했습니다", "5");

// 파일 업로드 시
await addActivityLog(userId, "file_upload", "report.pdf를 업로드했습니다", "8");

// 데이터 분석 시
await addActivityLog(userId, "data_analysis", "매출 데이터를 분석했습니다", "9");

// 여행 준비 시
await addActivityLog(userId, "travel_prep", "제주도 여행 준비물을 작성했습니다", "6");

// 프로필 업데이트 시
await addActivityLog(userId, "profile_update", "이메일 주소를 변경했습니다", "10");
```

## 🚀 향후 개선 계획

- [ ] 앱 그룹화 (폴더) 기능
- [ ] 앱 즐겨찾기 기능
- [ ] 활동 로그 필터링 (날짜, 유형)
- [ ] 활동 통계 대시보드
- [ ] 활동 로그 내보내기
- [ ] 실시간 알림 (웹소켓)
- [ ] 앱 검색 기능

## 📄 관련 파일

```
data/
├── user-app-settings.csv       # 사용자별 앱 설정
├── user-app-settings.sample.csv
├── activity-logs.csv           # 활동 로그
└── activity-logs.sample.csv

src/
├── app/
│   ├── api/
│   │   ├── user-apps/
│   │   │   ├── route.ts        # 앱 설정 조회/수정
│   │   │   └── reorder/
│   │   │       └── route.ts    # 앱 순서 변경
│   │   └── activity-logs/
│   │       └── route.ts        # 활동 로그 조회/추가
│   └── dashboard/
│       ├── page.tsx            # 대시보드 (통합)
│       └── settings/
│           └── page.tsx        # 설정 페이지 (앱 관리 탭)
├── lib/
│   └── data.ts                 # 데이터 함수들
└── types/
    └── index.ts                # 타입 정의
```
