# 관리자 앱 관리 기능 가이드

## 📋 개요

관리자는 전체 사용자를 대상으로 앱을 활성화하거나 비활성화할 수 있는 권한을 가지고 있습니다. 이 기능은 설정 페이지의 "📱 앱 관리" 탭에서 사용할 수 있습니다.

## 🎯 주요 기능

### 1. 전역 앱 활성화/비활성화 (관리자 전용)

관리자는 각 앱에 대해 두 가지 토글을 볼 수 있습니다:

- **빨간색 토글 (전체)**: 전체 사용자에 대한 앱 활성화/비활성화
- **파란색 토글 (개인)**: 관리자 본인의 대시보드에서 표시/숨김

### 2. 개인 앱 표시/숨김 (모든 사용자)

일반 사용자는 파란색 토글만 볼 수 있으며, 본인의 대시보드에서 앱을 표시하거나 숨길 수 있습니다.

## 🔧 기술 구조

### 데이터베이스 스키마

**apps.csv**

```csv
id,name,description,icon,href,require_auth,category,order,is_active
1,계산기,간단한 계산기 앱,🧮,/samples/calculator,false,public,1,true
2,메모장,간단한 메모 작성 도구,📝,/samples/notepad,false,public,2,true
```

- `is_active`: 전역 활성화 상태 (관리자만 변경 가능)
  - `true`: 모든 사용자에게 표시
  - `false`: 모든 사용자에게 숨김 (관리자만 설정 페이지에서 볼 수 있음)

**user-app-settings.csv**

```csv
id,user_id,app_id,is_visible,custom_order,category
1,1,1,true,1,public
```

- `is_visible`: 개인 표시 설정 (각 사용자가 변경 가능)
  - `true`: 사용자의 대시보드에 표시
  - `false`: 사용자의 대시보드에서 숨김

### 우선순위

앱이 사용자에게 표시되려면:

1. **필수**: `apps.csv`의 `is_active`가 `true`여야 함
2. **필수**: `user-app-settings.csv`의 `is_visible`이 `true`여야 함

즉, 관리자가 앱을 비활성화하면 개인 설정과 관계없이 모든 사용자에게 보이지 않습니다.

## 📡 API 엔드포인트

### 1. 전역 앱 상태 변경 (관리자 전용)

**PUT /api/apps/[id]**

```typescript
// Request
{
  "isActive": false  // true: 활성화, false: 비활성화
}

// Response
{
  "success": true,
  "message": "앱이 비활성화되었습니다."
}
```

**권한**:

- 관리자 (`role === "admin"`)만 접근 가능
- 일반 사용자는 403 에러

### 2. 앱 목록 조회 (includeInactive 파라미터)

**GET /api/apps?category={category}&includeInactive=true**

```typescript
// 관리자만 includeInactive=true로 요청하면 비활성화된 앱도 조회
// 일반 사용자는 includeInactive를 전달해도 활성화된 앱만 조회

// Response
{
  "success": true,
  "message": "앱 목록을 가져왔습니다.",
  "data": [
    {
      "id": "1",
      "name": "계산기",
      "isActive": true,
      ...
    },
    {
      "id": "2",
      "name": "메모장",
      "isActive": false,  // 관리자만 볼 수 있음
      ...
    }
  ]
}
```

### 3. 개인 앱 표시 설정 (모든 사용자)

**PUT /api/user-apps**

```typescript
// Request
{
  "appId": "1",
  "isVisible": false
}

// Response
{
  "success": true,
  "message": "앱 표시 설정이 변경되었습니다."
}
```

## 🎨 UI 컴포넌트

### 관리자 뷰

```tsx
// 설정 > 앱 관리 탭

[앱 카드 - 비활성화된 경우 빨간색 배경]
┌────────────────────────────────────────────────┐
│ 🧮 계산기 [전체 비활성] 배지                    │
│ 간단한 계산기 앱                                │
│                              #1  [전체] [개인]  │
│                                   ⭕    ⭕     │
└────────────────────────────────────────────────┘

👑 관리자: 빨간색 토글로 전체 사용자 대상 활성화/비활성화 가능

- 전체 (빨간색 토글): 모든 사용자 대상
- 개인 (파란색 토글): 관리자 본인만
```

### 일반 사용자 뷰

```tsx
[앱 카드]
┌────────────────────────────────────────────────┐
│ 🧮 계산기                                       │
│ 간단한 계산기 앱                                │
│                              #1        [개인]  │
│                                          ⭕     │
└────────────────────────────────────────────────┘

- 개인 (파란색 토글)만 표시됨
- 비활성화된 앱은 아예 보이지 않음
```

## 📝 사용 예시

### 시나리오 1: 유지보수를 위한 앱 임시 비활성화

```bash
# 상황: "날씨" 앱에 버그가 발견되어 수정이 필요함

1. 관리자 로그인
2. 설정 > 앱 관리 이동
3. "날씨" 앱의 빨간색 토글 OFF
4. → 모든 사용자의 대시보드에서 "날씨" 앱이 사라짐
5. 버그 수정 후 다시 빨간색 토글 ON
6. → 모든 사용자에게 다시 표시됨
```

### 시나리오 2: 베타 테스트 앱 관리

```bash
# 상황: 새로운 "AI 챗봇" 앱을 일부 사용자에게만 공개

1. apps.csv에 "AI 챗봇" 앱 추가 (is_active=false)
2. 관리자가 설정에서 확인 (빨간색 배경으로 표시됨)
3. 베타 테스터 사용자의 user-app-settings.csv를 수정
4. 준비되면 관리자가 빨간색 토글 ON
5. → 모든 사용자에게 공개됨
```

### 시나리오 3: 역할 기반 앱 제한

```bash
# 상황: "사용자 관리" 앱은 관리자만 사용 가능

1. apps.csv에서 category를 "admin"으로 설정
2. is_active는 true로 유지
3. → 일반 사용자는 API 레벨에서 차단됨
4. 관리자만 앱을 볼 수 있음
```

## 🔐 보안

### 권한 검증

모든 전역 앱 관리 API는 **3단계 검증**을 거칩니다:

```typescript
// 1. 토큰 검증
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const decoded = verifyToken(token || "");

if (!decoded) {
  return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 });
}

// 2. 관리자 권한 검증
if (decoded.role !== "admin") {
  return NextResponse.json({ success: false, message: "관리자 권한이 필요합니다." }, { status: 403 });
}

// 3. 비즈니스 로직 실행
await updateAppGlobalStatus(appId, isActive);
```

### 데이터 격리

- 일반 사용자는 `is_active=true`인 앱만 조회 가능
- 관리자는 `includeInactive=true` 파라미터로 모든 앱 조회
- API 레벨에서 역할 검증으로 2중 보호

## 🚀 배포 시 주의사항

### 1. 기존 앱 데이터 마이그레이션

```bash
# apps.csv의 모든 앱에 is_active 필드가 있는지 확인
cat data/apps.csv | head -1
# → id,name,description,icon,href,require_auth,category,order,is_active

# 없다면 추가 (모든 앱을 활성화 상태로)
# 각 행 끝에 ",true" 추가
```

### 2. 환경 변수 확인

```bash
# JWT_SECRET이 프로덕션 환경에서 제대로 설정되어 있는지 확인
echo $JWT_SECRET
```

### 3. 관리자 계정 확인

```bash
# 최소 1명의 관리자 계정이 있는지 확인
cat data/users.csv | grep ",admin,"
# → 1,admin,admin@example.com,관리자,admin,...
```

## 📊 모니터링

### 활동 로그

앱 상태 변경은 자동으로 활동 로그에 기록할 수 있습니다 (선택 사항):

```typescript
// API에서 호출
await addActivityLog(
  decoded.id,
  "app_management",
  `앱 "${appName}"을 ${isActive ? "활성화" : "비활성화"}했습니다`,
  appId
);
```

### 통계 조회

```bash
# 비활성화된 앱 개수
cat data/apps.csv | grep ",false$" | wc -l

# 전체 앱 개수
cat data/apps.csv | tail -n +2 | wc -l
```

## 🐛 문제 해결

### 문제 1: 관리자가 전역 토글을 볼 수 없음

**원인**:

- 사용자 역할이 "admin"이 아님
- 세션이 만료됨

**해결**:

```bash
# users.csv에서 역할 확인
cat data/users.csv | grep "username"

# 재로그인
```

### 문제 2: 앱을 비활성화했는데 여전히 보임

**원인**:

- 브라우저 캐시
- 대시보드를 새로고침하지 않음

**해결**:

```bash
# 하드 리프레시
Ctrl + Shift + R (또는 Cmd + Shift + R)
```

### 문제 3: 일반 사용자가 비활성화된 앱을 보고 있음

**원인**:

- API가 `is_active` 필터를 적용하지 않음
- 구버전 코드

**해결**:

```typescript
// src/lib/data.ts의 getAppsByCategory 확인
return apps.filter((app) => app.category === category && app.isActive);
//                                                      ^^^^^^^^^ 확인
```

## 📚 관련 파일

```
src/
├── lib/
│   └── data.ts                          # updateAppGlobalStatus, getAllApps
├── app/
│   ├── api/
│   │   └── apps/
│   │       ├── route.ts                 # GET with includeInactive
│   │       └── [id]/
│   │           └── route.ts             # PUT (관리자 전용)
│   └── dashboard/
│       └── settings/
│           └── page.tsx                 # 관리자 UI

data/
└── apps.csv                             # is_active 필드
```

## ✅ 테스트 체크리스트

### 관리자 테스트

- [ ] 설정 > 앱 관리에서 빨간색 토글이 보이는가?
- [ ] 빨간색 토글로 앱을 비활성화하면 배경이 빨간색으로 변하는가?
- [ ] 비활성화된 앱에 "전체 비활성" 배지가 표시되는가?
- [ ] 앱을 비활성화한 후 대시보드에서 사라지는가?
- [ ] 일반 사용자 계정으로 로그인하면 비활성화된 앱이 보이지 않는가?
- [ ] 앱을 다시 활성화하면 모든 사용자에게 표시되는가?

### 일반 사용자 테스트

- [ ] 설정 > 앱 관리에서 빨간색 토글이 보이지 않는가?
- [ ] 파란색 토글(개인)만 보이는가?
- [ ] 관리자가 비활성화한 앱이 목록에 없는가?
- [ ] 개인 토글로 앱을 숨기면 대시보드에서 사라지는가?
- [ ] 다시 표시하면 대시보드에 나타나는가?

### API 테스트

```bash
# 1. 관리자 로그인
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.token')

# 2. 앱 비활성화
curl -X PUT http://localhost:3000/api/apps/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isActive":false}'

# 3. 일반 사용자로 앱 목록 조회 (비활성화된 앱 안 보임)
USER_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"password"}' \
  | jq -r '.token')

curl "http://localhost:3000/api/apps?category=public" \
  -H "Authorization: Bearer $USER_TOKEN"

# 4. 관리자로 앱 목록 조회 (비활성화된 앱 포함)
curl "http://localhost:3000/api/apps?category=public&includeInactive=true" \
  -H "Authorization: Bearer $TOKEN"
```

## 🎓 베스트 프랙티스

1. **점진적 배포**: 새 앱은 `is_active=false`로 시작하여 테스트 후 활성화
2. **공지**: 앱을 비활성화하기 전에 사용자에게 공지
3. **백업**: 중요한 앱 설정 변경 전 `data/apps.csv` 백업
4. **로그 기록**: 앱 상태 변경 시 활동 로그에 기록
5. **문서화**: 각 앱의 비활성화 이유를 내부 문서에 기록

## 📞 지원

질문이나 문제가 있으면 관리자 매뉴얼을 참조하거나 개발팀에 문의하세요.
