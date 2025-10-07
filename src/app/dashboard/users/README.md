# 👤 사용자 관리

사용자 계정 및 권한을 관리하는 관리자 도구

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [사용 방법](#사용-방법)
- [데이터 구조](#데이터-구조)
- [API 엔드포인트](#api-엔드포인트)
- [개발 가이드](#개발-가이드)

## 개요

사용자 관리 앱은 관리자가 시스템의 모든 사용자 계정을 조회, 생성, 수정, 삭제할 수 있는 관리 도구입니다.

**접근 권한:** 관리자(admin) 역할만 접근 가능

**주요 용도:**

- 사용자 계정 생성 및 관리
- 사용자 역할 변경 (user ↔ admin)
- 로그인 이력 확인
- 계정 활성화/비활성화

## 주요 기능

### 1. 사용자 목록 조회

- 전체 사용자 목록 표시
- 사용자명, 이메일, 역할, 마지막 로그인 시간 표시
- 테이블 형식으로 정보 정리

### 2. 사용자 생성

새 사용자 계정 생성:

- 사용자명 (고유)
- 이메일 (선택)
- 비밀번호
- 역할 (user/admin)

### 3. 사용자 수정

기존 사용자 정보 수정:

- 이메일 변경
- 역할 변경
- 비밀번호 재설정
- 활성 상태 변경

### 4. 사용자 삭제

- 사용자 계정 삭제
- 확인 대화상자로 안전장치
- 관리자는 자기 자신을 삭제할 수 없음

### 5. 로그인 이력

- 마지막 로그인 시간 표시
- 활동 추적

## 사용 방법

### 사용자 목록 확인

```
대시보드 → 사용자 관리
```

관리자로 로그인 후 사용자 관리 앱에 접속하면 전체 사용자 목록이 표시됩니다.

### 새 사용자 생성

1. "사용자 추가" 버튼 클릭
2. 폼에 정보 입력:
   - 사용자명 (필수, 고유해야 함)
   - 이메일 (선택)
   - 비밀번호 (필수)
   - 역할 선택 (user/admin)
3. "생성" 버튼 클릭

### 사용자 정보 수정

1. 사용자 목록에서 "편집" 버튼 클릭
2. 수정할 정보 입력
3. "저장" 버튼 클릭

**수정 가능 항목:**

- 이메일
- 역할
- 비밀번호 (선택적)

### 사용자 삭제

1. 사용자 목록에서 "삭제" 버튼 클릭
2. 확인 대화상자에서 승인
3. 사용자 계정 삭제

**주의사항:**

- 삭제된 계정은 복구할 수 없습니다
- 자기 자신의 계정은 삭제할 수 없습니다

## 데이터 구조

### users.csv

```csv
id,username,password_hash,email,role,created_at,last_login,is_active
1,admin,$2a$10$...,admin@example.com,admin,2025-01-01T00:00:00Z,2025-10-08T10:30:00Z,true
2,user1,$2a$10$...,user1@example.com,user,2025-01-01T00:00:00Z,2025-10-07T15:20:00Z,true
3,demo,$2a$10$...,demo@example.com,user,2025-01-01T00:00:00Z,,true
```

**필드 설명:**

- `id`: 고유 식별자 (UUID)
- `username`: 사용자명 (고유, 로그인 ID)
- `password_hash`: bcrypt 해싱된 비밀번호
- `email`: 이메일 주소 (선택)
- `role`: 역할 (`user` 또는 `admin`)
- `created_at`: 계정 생성 시간 (ISO 8601)
- `last_login`: 마지막 로그인 시간 (ISO 8601, 비어있으면 로그인 안 함)
- `is_active`: 계정 활성 상태 (true/false)

## API 엔드포인트

### `GET /api/users`

모든 사용자 조회 (관리자 전용)

**인증:** 필요 (Bearer Token, admin 역할)

**응답:**

```json
{
  "success": true,
  "message": "사용자 목록 조회 성공",
  "data": [
    {
      "id": "1",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLogin": "2025-10-08T10:30:00Z",
      "isActive": true
    }
  ]
}
```

### `POST /api/users`

새 사용자 생성 (관리자 전용)

**인증:** 필요 (Bearer Token, admin 역할)

**요청 본문:**

```json
{
  "username": "newuser",
  "password": "securepassword",
  "email": "newuser@example.com",
  "role": "user"
}
```

**응답:**

```json
{
  "success": true,
  "message": "사용자가 생성되었습니다",
  "data": {
    "id": "uuid-here",
    "username": "newuser"
  }
}
```

### `PUT /api/users/[id]`

사용자 정보 수정 (관리자 전용)

**인증:** 필요 (Bearer Token, admin 역할)

**요청 본문:**

```json
{
  "email": "updated@example.com",
  "role": "admin",
  "password": "newpassword" // 선택적
}
```

**응답:**

```json
{
  "success": true,
  "message": "사용자 정보가 수정되었습니다"
}
```

### `DELETE /api/users/[id]`

사용자 삭제 (관리자 전용)

**인증:** 필요 (Bearer Token, admin 역할)

**응답:**

```json
{
  "success": true,
  "message": "사용자가 삭제되었습니다"
}
```

## 개발 가이드

### 컴포넌트 구조

```
src/app/dashboard/users/
├── page.tsx           # 사용자 관리 페이지
└── README.md          # 이 문서
```

### 권한 검증

페이지 레벨 보호:

```tsx
<ProtectedRoute requiredRole="admin">
  <UsersPage />
</ProtectedRoute>
```

API 레벨 보호:

```typescript
const decoded = verifyToken(token);
if (!decoded || decoded.role !== "admin") {
  return NextResponse.json({ success: false, message: "관리자 권한이 필요합니다" }, { status: 403 });
}
```

### 비밀번호 해싱

```typescript
import bcrypt from "bcryptjs";

// 비밀번호 해싱 (회원가입/비밀번호 변경)
const passwordHash = await bcrypt.hash(password, 10);

// 비밀번호 검증 (로그인)
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### 사용자 생성 플로우

```typescript
// 1. 중복 확인
const existingUser = await getUserByUsername(username);
if (existingUser) {
  return error("이미 존재하는 사용자명입니다");
}

// 2. 비밀번호 해싱
const passwordHash = await bcrypt.hash(password, 10);

// 3. 사용자 객체 생성
const newUser = {
  id: crypto.randomUUID(),
  username,
  passwordHash,
  email: email || "",
  role,
  createdAt: new Date().toISOString(),
  lastLogin: "",
  isActive: true,
};

// 4. CSV에 저장
await addUser(newUser);
```

### 로그인 시간 업데이트

```typescript
// src/app/api/auth/login/route.ts
await updateUser(user.id, {
  lastLogin: new Date().toISOString(),
});
```

### 주의사항

1. **비밀번호 저장**: 절대 평문으로 저장하지 않음 (bcrypt 사용)
2. **자기 자신 삭제 방지**: 로그인한 관리자는 자신의 계정을 삭제할 수 없음
3. **역할 검증**: 모든 API 요청에서 admin 역할 확인
4. **민감 정보 제외**: API 응답에서 `passwordHash` 제외

### 확장 아이디어

1. **사용자 검색**: 사용자명/이메일로 검색 기능
2. **정렬**: 이름, 역할, 마지막 로그인으로 정렬
3. **페이지네이션**: 대량 사용자 처리
4. **활동 로그**: 사용자별 활동 이력 추적
5. **일괄 작업**: 여러 사용자 동시 수정/삭제
6. **비밀번호 정책**: 복잡도 요구사항
7. **이메일 인증**: 이메일 확인 플로우
8. **2단계 인증**: TOTP 기반 2FA

## 🔗 관련 문서

- [인증 시스템](../../../docs/architecture.md#-인증-시스템)
- [API 설계](../../../docs/architecture.md#-api-설계)
- [보안](../../../docs/deployment.md#-보안-설정)
