# 칭찬뱃지 앱 - 개인 도구로 변경 완료

## 변경 사항

### 1. 앱 카테고리 변경

- **이전**: `public` 카테고리 (공용 도구)
- **이후**: `dashboard` 카테고리 (개인 도구)
- **위치**: `/dashboard/praise-badge` (로그인 필수)

### 2. 파일 이동

```
이전: src/app/samples/praise-badge/
이후: src/app/dashboard/praise-badge/
```

### 3. apps.csv 업데이트

```csv
# 이전
5,칭찬뱃지,칭찬을 모아 보상받기,🏆,/samples/praise-badge,true,public,5,true

# 이후
7,칭찬뱃지,칭찬을 모아 보상받기,🏆,/dashboard/praise-badge,true,dashboard,3,true
```

### 4. 접근 제어

- ✅ 로그인 필수 (`require_auth=true`)
- ✅ 대시보드 카테고리로 분류
- ✅ ProtectedRoute 적용으로 인증되지 않은 사용자 차단

## 사용 방법

### 일반 사용자

1. **로그인** 필수
2. 대시보드에서 **"칭찬뱃지"** 앱 클릭
3. `/dashboard/praise-badge` 접속
4. 본인의 칭찬 현황 및 보상 선택

### 관리자

1. **로그인** 필수
2. 대시보드에서 **"칭찬뱃지관리"** 앱 클릭
3. `/dashboard/admin/praise-badges` 접속
4. 칭찬 주기, 보상 관리, 소진 승인

## 접근 권한

| 역할                    | 칭찬뱃지 (/dashboard/praise-badge) | 칭찬뱃지관리 (/dashboard/admin/praise-badges) |
| ----------------------- | ---------------------------------- | --------------------------------------------- |
| 비로그인                | ❌ 차단 (로그인 페이지로 리디렉션) | ❌ 차단                                       |
| 일반 사용자 (role=user) | ✅ 접근 가능 (본인 뱃지만)         | ❌ 차단 (권한 없음)                           |
| 관리자 (role=admin)     | ✅ 접근 가능 (본인 뱃지만)         | ✅ 접근 가능 (모든 관리 기능)                 |

## 확인 사항

- [x] 앱 경로 변경: `/samples/praise-badge` → `/dashboard/praise-badge`
- [x] 카테고리 변경: `public` → `dashboard`
- [x] 순서 조정: dashboard 카테고리 내 3번째
- [x] 기존 samples 폴더 삭제
- [x] README 업데이트 (로그인 필수 명시)
- [x] ProtectedRoute 수정 (requireAdmin → requiredRole="admin")
- [x] 에러 없음 확인

## 테스트 시나리오

### 1. 비로그인 상태

```
1. /dashboard/praise-badge 접속 시도
2. → 자동으로 / (로그인 페이지)로 리디렉션
```

### 2. 일반 사용자 로그인

```
1. 대시보드에서 "칭찬뱃지" 앱이 보임
2. 클릭 시 /dashboard/praise-badge 접속 성공
3. 본인의 뱃지 현황만 표시
4. "칭찬뱃지관리" 앱은 보이지 않음 (관리자 전용)
```

### 3. 관리자 로그인

```
1. 대시보드에서 "칭찬뱃지" + "칭찬뱃지관리" 모두 보임
2. "칭찬뱃지" 클릭 시 본인 뱃지 확인 가능
3. "칭찬뱃지관리" 클릭 시 전체 관리 화면 접속
4. 모든 사용자에게 칭찬 주기 가능
```

## 다음 단계

1. 개발 서버 재시작

   ```bash
   npm run dev
   ```

2. CSV 초기화 (필요시)

   ```bash
   bash scripts/init-dev.sh
   ```

3. 테스트
   - 로그인하지 않은 상태에서 직접 URL 접근 시도
   - 일반 사용자로 로그인 후 대시보드 확인
   - 관리자로 로그인 후 두 앱 모두 확인

모든 변경이 완료되었습니다! 🎉
