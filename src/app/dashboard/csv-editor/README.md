# 📊 CSV 편집기

data 폴더의 CSV 파일을 직접 편집할 수 있는 관리자 전용 도구

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [사용 방법](#사용-방법)
- [키보드 단축키](#키보드-단축키)
- [API 엔드포인트](#api-엔드포인트)
- [보안](#보안)

## 개요

CSV 편집기는 관리자가 `data/` 폴더의 CSV 파일을 웹 인터페이스를 통해 직접 편집할 수 있는 도구입니다.

**접근 권한:** 관리자(admin) 역할만 접근 가능

**주요 용도:**

- CSV 데이터 직접 수정
- 행 추가/삭제
- 스프레드시트 형태의 직관적인 편집
- 실시간 변경사항 반영

## 주요 기능

### 1. CSV 파일 목록 조회

- `data/` 폴더의 모든 CSV 파일 표시 (`.sample.csv` 제외)
- 파일명, 크기, 최종 수정 시간 표시
- 파일별 편집 버튼

### 2. 스프레드시트 편집

**셀 편집:**

- 셀 클릭으로 편집 모드 진입
- 인라인 입력으로 값 수정
- Enter/Tab/ESC 키로 편집 제어

**행 관리:**

- 새 행 추가
- 선택한 행 삭제
- 행 번호 표시

**실시간 피드백:**

- 현재 선택된 셀 하이라이트
- 편집 중인 셀 테두리 표시
- 행 개수 및 헤더 정보 표시

### 3. 데이터 저장

- 변경사항 일괄 저장
- 저장 전 자동 백업 (`.backup` 파일)
- 저장 성공/실패 알림

### 4. 안전 장치

- 편집 취소 확인 대화상자
- 행 삭제 확인 대화상자
- 관리자 권한 이중 체크 (프론트엔드 + API)
- 파일 경로 탐색 방지

## 사용 방법

### CSV 파일 편집하기

1. **관리자 로그인**

   ```
   사용자명: admin
   비밀번호: password
   ```

2. **CSV 편집기 접속**

   ```
   대시보드 → CSV 편집기
   또는 직접 /dashboard/csv-editor 접근
   ```

3. **파일 선택**

   - 파일 목록에서 편집할 CSV 파일 선택
   - "편집" 버튼 클릭

4. **데이터 편집**

   - 셀 클릭으로 편집 시작
   - 키보드로 값 입력
   - Enter/Tab으로 다음 셀 이동

5. **변경사항 저장**
   - "저장" 버튼 클릭
   - 확인 메시지 대기
   - 파일 목록으로 돌아가기

### 행 추가하기

1. "+ 행 추가" 버튼 클릭
2. 새 행이 테이블 하단에 추가됨
3. 빈 값으로 초기화된 셀 편집
4. 저장 버튼으로 변경사항 저장

### 행 삭제하기

1. 삭제할 행의 아무 셀이나 클릭하여 선택
2. "- 선택 행 삭제" 버튼 클릭
3. 확인 대화상자에서 "확인"
4. 저장 버튼으로 변경사항 저장

## 키보드 단축키

| 키        | 동작                                  |
| --------- | ------------------------------------- |
| **Enter** | 현재 셀 편집 완료 후 아래 행으로 이동 |
| **Tab**   | 현재 셀 편집 완료 후 오른쪽 셀로 이동 |
| **ESC**   | 편집 취소 (변경사항 무시)             |
| **클릭**  | 셀 선택 및 편집 모드 진입             |

## API 엔드포인트

### 파일 목록 조회

```http
GET /api/csv-editor
Authorization: Bearer {token}
```

**응답:**

```json
{
  "success": true,
  "message": "CSV 파일 목록을 조회했습니다.",
  "data": [
    {
      "name": "users.csv",
      "size": 2048,
      "modified": "2025-10-08T12:34:56.789Z"
    }
  ]
}
```

### 파일 읽기

```http
GET /api/csv-editor/{filename}
Authorization: Bearer {token}
```

**응답:**

```json
{
  "success": true,
  "message": "CSV 파일을 읽었습니다.",
  "data": {
    "filename": "users.csv",
    "headers": ["id", "username", "email"],
    "rows": [{ "id": "1", "username": "admin", "email": "admin@example.com" }],
    "raw": "id,username,email\n1,admin,admin@example.com"
  }
}
```

### 파일 저장

```http
PUT /api/csv-editor/{filename}
Authorization: Bearer {token}
Content-Type: application/json

{
  "headers": ["id", "username", "email"],
  "rows": [
    {"id": "1", "username": "admin", "email": "admin@example.com"}
  ]
}
```

**응답:**

```json
{
  "success": true,
  "message": "CSV 파일이 저장되었습니다.",
  "data": {
    "filename": "users.csv",
    "rowCount": 1
  }
}
```

## 보안

### 권한 체크

1. **프론트엔드:** `<ProtectedRoute requiredRole="admin">`
2. **API:** `decoded.role === "admin"` 검증

### 파일 경로 보안

```typescript
// 경로 탐색 공격 방지
if (filename.includes("..") || filename.includes("/")) {
  return error;
}

// CSV 파일만 허용
if (!filename.endsWith(".csv")) {
  return error;
}
```

### 데이터 백업

파일 저장 시 자동으로 `.backup` 파일 생성:

```typescript
if (fs.existsSync(filePath)) {
  fs.copyFileSync(filePath, filePath + ".backup");
}
```

## 주의사항

⚠️ **중요:**

- CSV 파일 직접 편집은 데이터 손상 위험이 있습니다
- 중요한 파일은 편집 전 백업 권장
- 헤더 구조 변경 시 애플리케이션 오류 발생 가능
- `.sample.csv` 파일은 편집 대상에서 제외됨

## 개발 가이드

### 컴포넌트 구조

```
src/app/dashboard/csv-editor/
├── page.tsx                    # 메인 페이지
└── components/
    └── Spreadsheet.tsx         # 스프레드시트 컴포넌트

src/app/api/csv-editor/
├── route.ts                    # 파일 목록 API
└── [filename]/
    └── route.ts                # 파일 읽기/쓰기 API
```

### 확장 아이디어

- [ ] 열 추가/삭제 기능
- [ ] 정렬 및 필터링
- [ ] CSV 내보내기/가져오기
- [ ] 변경 이력 추적
- [ ] 실시간 협업 편집
- [ ] 셀 서식 지정
- [ ] 대용량 CSV 최적화 (가상 스크롤)

## 문제 해결

### 파일을 찾을 수 없음

```bash
# 데이터 파일 초기화
bash scripts/init-dev.sh
```

### 권한 오류

- 관리자 계정으로 로그인했는지 확인
- JWT 토큰이 유효한지 확인
- 브라우저 쿠키 삭제 후 재로그인

### 저장 실패

- 파일 권한 확인: `data/` 폴더 쓰기 권한
- CSV 형식 검증: 헤더와 데이터 일치 여부
- 서버 로그 확인: 상세 오류 메시지

## 코드 위치

- **페이지:** `src/app/dashboard/csv-editor/page.tsx`
- **컴포넌트:** `src/app/dashboard/csv-editor/components/Spreadsheet.tsx`
- **API:** `src/app/api/csv-editor/**/*.ts`
- **앱 정의:** `data/apps.csv` (id: 11)
