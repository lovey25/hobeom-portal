# 기능 테스트 체크리스트 ✅

## 📋 전체 기능 확인

### 1️⃣ 앱 순서 변경 (드래그 앤 드롭)

**테스트 절차:**

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 로그인
- URL: http://localhost:3000/login
- 계정: admin / password

# 3. 설정 페이지 이동
- 대시보드 → ⚙️ 설정 클릭
- "📱 앱 관리" 탭 클릭

# 4. 드래그 테스트
- "오늘할일" 앱을 클릭하여 드래그
- "여행준비물" 위치로 드롭
- 콘솔에서 로그 확인:
  * "Drop: { draggingAppId: '5', targetAppId: '6', category: 'dashboard' }"
  * "Category apps: [...]"
  * "Indexes: { dragIndex: 0, dropIndex: 1 }"
  * "New order: [...]"
  * "Reorder result: { success: true, ... }"
- 알림 확인: "앱 순서가 변경되었습니다"

# 5. 대시보드에서 확인
- 대시보드 페이지로 이동
- F5로 새로고침
- "오늘할일" 앱이 두 번째 위치에 있는지 확인
```

**예상 결과:**

- ✅ 드래그 시 파란색 테두리 + 배경
- ✅ 드롭 시 순서 변경
- ✅ 순서 번호 (#1, #2, ...) 업데이트
- ✅ 대시보드에 새 순서 반영

**문제 해결:**

```bash
# 드래그가 안 되는 경우
1. 브라우저 콘솔 확인 (F12)
2. "Drop:" 로그가 나오는지 확인
3. 드래그 중인 요소가 파란색으로 변하는지 확인
4. 마우스를 완전히 떼었는지 확인

# API 오류 발생 시
- 콘솔에서 "Reorder result:" 확인
- 401 오류: 토큰 만료 → 재로그인
- 500 오류: 서버 로그 확인
```

### 2️⃣ 앱 보이기/숨기기

**테스트 절차:**

```bash
# 1. 설정 > 앱 관리 탭

# 2. 토글 스위치 테스트
- "날씨" 앱의 토글을 OFF로 변경
- 알림 확인: "앱 표시 설정이 변경되었습니다"
- 토글이 회색으로 변경되는지 확인
- 앱 카드가 흐려지는지 확인 (opacity-50)

# 3. 대시보드에서 확인
- 대시보드로 이동
- F5 새로고침
- "날씨" 앱이 보이지 않는지 확인

# 4. 다시 표시
- 설정 페이지로 돌아가기
- "날씨" 토글을 ON으로 변경
- 대시보드 새로고침
- "날씨" 앱이 다시 보이는지 확인
```

**CSV 확인:**

```bash
# 설정이 저장되었는지 확인
cat data/user-app-settings.csv | grep "날씨"

# 예상 출력:
# 3,1,3,false,3,public  (is_visible가 false로 변경됨)
```

**예상 결과:**

- ✅ 토글 ON: 파란색, 앱 표시
- ✅ 토글 OFF: 회색, 앱 숨김
- ✅ 대시보드에서 숨긴 앱 안 보임
- ✅ CSV 파일에 is_visible 값 저장됨

### 3️⃣ 최근 활동 로그

**테스트 절차:**

```bash
# 1. 활동 로그 데이터 확인
cat data/activity-logs.csv

# 2. 대시보드에서 확인
- 대시보드 페이지 하단
- "📋 최근 활동" 카드 찾기
- 최근 5개 활동이 표시되는지 확인

# 3. 새 활동 생성
- "오늘할일" 위젯에서 할일 체크
- 3개를 완료하면 자동으로 로그 추가됨
- 대시보드 새로고침
- 최근 활동에 "할일 3개를 완료했습니다" 표시 확인

# 4. 시간 표시 확인
- "방금 전" 또는 "N분 전" 형식인지 확인
- 색상 점이 활동 유형에 맞는지 확인:
  * 🟢 초록: task_complete
  * 🔵 파랑: file_upload
  * 🟣 보라: data_analysis
  * 🟡 노랑: travel_prep
  * ⚪ 회색: 기타
```

**API 테스트:**

```bash
# 활동 로그 조회
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity-logs?limit=5

# 예상 응답:
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

**예상 결과:**

- ✅ 최근 5개 활동 표시
- ✅ 시간 자동 계산
- ✅ 활동 유형별 색상 구분
- ✅ 할일 완료 시 자동 로그 추가

### 4️⃣ 통합 테스트

**시나리오 1: 신규 사용자**

```bash
# 1. 회원가입
- /signup 페이지
- username: testuser
- email: test@example.com
- password: test123

# 2. 자동 초기화 확인
cat data/user-app-settings.csv | grep "testuser_id"
# 모든 앱이 활성화되어 있어야 함

# 3. 로그인 후 대시보드 확인
- 모든 앱이 표시되는지 확인
- 기본 순서대로 정렬되는지 확인
```

**시나리오 2: 앱 커스터마이징**

```bash
# 1. 설정 페이지에서:
- "계산기" 숨기기
- "오늘할일"을 맨 아래로 드래그
- "여행준비물"을 맨 위로 드래그

# 2. 대시보드 확인:
- F5 새로고침
- "계산기" 안 보임
- "여행준비물"이 첫 번째
- "오늘할일"이 마지막

# 3. CSV 확인:
cat data/user-app-settings.csv | grep "user_id"
# custom_order 값이 변경되어 있어야 함
```

**시나리오 3: 다중 사용자 격리**

```bash
# 1. admin 계정 설정:
- "날씨" 숨기기
- 로그아웃

# 2. user1 계정 로그인:
- "날씨" 앱이 보이는지 확인 (보여야 함)
- 각 사용자의 설정이 독립적인지 확인
```

## 🐛 알려진 이슈 및 해결

### 문제 1: 드래그가 작동하지 않음

**증상:**

- 앱을 드래그해도 순서가 변경되지 않음
- 파란색 하이라이트가 나타나지 않음

**해결:**

```bash
# 1. 브라우저 콘솔 확인 (F12)
- "Drop:" 로그가 나오는지 확인
- 오류 메시지가 있는지 확인

# 2. draggable 속성 확인
- 개발자 도구에서 앱 카드 요소 확인
- draggable="true" 속성이 있는지 확인

# 3. 이벤트 핸들러 확인
- onDragStart, onDragOver, onDrop이 모두 설정되어 있는지 확인
- 콘솔에 "Drop:" 로그가 출력되는지 확인

# 4. 캐시 클리어
- Ctrl+Shift+R (하드 리프레시)
- 브라우저 캐시 삭제
```

### 문제 2: 대시보드에 변경사항이 반영되지 않음

**증상:**

- 설정에서 변경했는데 대시보드에 반영 안 됨

**해결:**

```bash
# 1. 대시보드 새로고침
- F5 또는 Ctrl+R
- 하드 리프레시: Ctrl+Shift+R

# 2. CSV 파일 확인
cat data/user-app-settings.csv
# 변경사항이 저장되어 있는지 확인

# 3. API 응답 확인
# 브라우저 개발자 도구 > Network 탭
# /api/user-apps 요청 확인
# is_visible, custom_order 값 확인

# 4. 로그아웃 후 재로그인
```

### 문제 3: 활동 로그가 표시되지 않음

**증상:**

- 최근 활동 카드가 비어있음

**해결:**

```bash
# 1. CSV 파일 확인
cat data/activity-logs.csv
# 데이터가 있는지 확인

# 2. API 테스트
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity-logs?limit=5
# 응답이 정상인지 확인

# 3. 할일 완료 테스트
- 할일 3개를 완료
- 콘솔에서 로그 추가 확인
- activity-logs.csv에 새 항목 추가되었는지 확인

# 4. 데이터 초기화
cp data/activity-logs.sample.csv data/activity-logs.csv
```

### 문제 4: 토글 스위치가 작동하지 않음

**증상:**

- 토글을 클릭해도 변경되지 않음

**해결:**

```bash
# 1. 콘솔 확인
- "Failed to toggle app visibility" 오류 확인
- API 응답 확인

# 2. 권한 확인
- 로그인 상태 확인
- 토큰이 유효한지 확인

# 3. CSV 파일 권한 확인
ls -la data/user-app-settings.csv
# 쓰기 권한이 있는지 확인

# 4. 수동으로 토글 테스트
# 브라우저 콘솔에서:
fetch("/api/user-apps", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN"
  },
  body: JSON.stringify({ appId: "3", isVisible: false })
}).then(r => r.json()).then(console.log);
```

## 🎯 성능 체크

### 로딩 시간

```bash
# 대시보드 로딩 시간 측정
1. 브라우저 개발자 도구 > Network 탭
2. 대시보드 페이지 로드
3. 확인:
   - /api/apps: < 200ms
   - /api/user-apps: < 200ms
   - /api/activity-logs: < 200ms
   - /api/settings: < 200ms
```

### 메모리 사용량

```bash
# 브라우저 개발자 도구 > Memory 탭
- 대시보드 로드 후: ~10-20MB
- 설정 페이지: ~10-15MB
```

### CSV 파일 크기

```bash
ls -lh data/*.csv

# 예상 크기:
# user-app-settings.csv: < 5KB
# activity-logs.csv: < 10KB
```

## ✅ 최종 체크리스트

### 기능 구현 확인

- [x] 1. 앱 순서 변경 (드래그 앤 드롭)

  - [x] 드래그 시작 시각 효과
  - [x] 드롭 시 순서 변경
  - [x] API 호출 및 저장
  - [x] 대시보드 반영

- [x] 2. 앱 보이기/숨기기

  - [x] 토글 스위치 UI
  - [x] 숨긴 앱 대시보드에서 제외
  - [x] 사용자별 독립적 설정
  - [x] 회원가입 시 자동 초기화

- [x] 3. 최근 활동 로그
  - [x] 활동 자동 기록
  - [x] 최근 5개 표시
  - [x] 시간 자동 계산
  - [x] 활동 유형별 색상

### API 엔드포인트 확인

- [x] GET /api/user-apps
- [x] PUT /api/user-apps
- [x] POST /api/user-apps/reorder
- [x] GET /api/activity-logs
- [x] POST /api/activity-logs

### 데이터 함수 확인

- [x] getUserAppSettings()
- [x] updateUserAppVisibility()
- [x] updateUserAppOrder()
- [x] initializeUserAppSettings()
- [x] addActivityLog()
- [x] getActivityLogs()

### UI/UX 확인

- [x] 설정 페이지 - 앱 관리 탭
- [x] 드래그 앤 드롭 시각 효과
- [x] 토글 스위치 애니메이션
- [x] 대시보드 - 최근 활동 카드
- [x] 시간 표시 포맷
- [x] 반응형 디자인

### 데이터 파일 확인

- [x] data/user-app-settings.csv
- [x] data/user-app-settings.sample.csv
- [x] data/activity-logs.csv
- [x] data/activity-logs.sample.csv

### 문서화 확인

- [x] docs/app-management.md
- [x] 코드 주석
- [x] API 문서
- [x] 사용 가이드

## 🚀 배포 전 최종 확인

```bash
# 1. 빌드 테스트
npm run build
# 에러 없이 빌드되는지 확인

# 2. 프로덕션 모드 테스트
npm run start
# 모든 기능이 정상 작동하는지 확인

# 3. 데이터 백업
cp -r data data.backup

# 4. 환경 변수 확인
echo $JWT_SECRET
# 프로덕션 환경에서 실제 시크릿 키 사용

# 5. 로그 확인
tail -f logs/app.log
# 오류 없이 실행되는지 확인
```

## 📝 테스트 결과 기록

```
테스트 날짜: ___________
테스트 환경:
  - OS: ___________
  - 브라우저: ___________
  - Node.js: ___________
  - Next.js: 15.5.4

기능 테스트:
  [✅/❌] 앱 순서 변경
  [✅/❌] 앱 보이기/숨기기
  [✅/❌] 최근 활동 로그
  [✅/❌] 다중 사용자 격리
  [✅/❌] 자동 초기화

성능 테스트:
  [ ] 로딩 시간 < 500ms
  [ ] 메모리 < 50MB
  [ ] 드래그 지연 없음

특이사항:
___________________________
___________________________
___________________________
```

## 🎉 완료!

모든 체크리스트 항목이 통과되면 기능 구현이 완료된 것입니다!
