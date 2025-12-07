# 환경별 포트 분리 설정 가이드

## 📋 개요

Hobeom Portal은 **개발(Development)**과 **운영(Production)** 2가지 환경을 **동시에 실행**할 수 있습니다.

- 📊 **데이터**: 모든 환경에서 동일한 `./data` 디렉토리의 CSV 파일 사용
- 🔌 **포트**: 환경별로 다른 포트 사용 (3000: 개발, 3001: 운영)
- 🔗 **API URL**: 각 환경에 맞는 API 엔드포인트 사용

## 🚀 환경별 설정

### 환경 파일 구조

| 환경     | 파일               | 포트   | API URL                         | 데이터   |
| -------- | ------------------ | ------ | ------------------------------- | -------- |
| **개발** | `.env.development` | `3000` | `http://localhost:3000`         | `./data` |
| **운영** | `.env.production`  | `3001` | `https://api.hobeom-portal.com` | `./data` |

## 🛠️ 실행 방법

### 초기 설정

```bash
# 데이터 파일 초기화 (최초 1회)
npm run init
```

### 개발 환경 실행

```bash
# 개발 서버 + Push Scheduler 동시 실행 (포트 3000)
npm run dev
```

**특징**:

- Turbopack 사용으로 파일 수정 시 즉시 반영 (핫 리로드)
- 개발 중 실시간 테스트

### 운영 환경 실행

```bash
# 운영 서버 빌드
npm run prod:build

# 운영 서버 + Push Scheduler 동시 실행 (포트 3001)
npm run prod
```

**특징**:

- 프로덕션 빌드 (최적화됨)
- 배포 전 실제 환경과 유사한 상태로 테스트

## 🌐 브라우저 접근

| 환경 | URL                     |
| ---- | ----------------------- |
| 개발 | `http://localhost:3000` |
| 운영 | `http://localhost:3002` |

## 📊 동시 실행 예시

터미널을 2개 열어서 동시에 실행할 수 있습니다:

```bash
# 터미널 1 - 개발 환경
npm run dev

# 터미널 2 - 운영 환경
npm run prod:build && npm run prod
```

**결과:**

- 포트 3000 - 개발 (핫 리로드 지원, 즉시 반영)
- 포트 3002 - 운영 (프로덕션 빌드, 배포 전 테스트)

모두 **동일한 데이터**를 공유합니다.

## 🔧 환경 변수 수정

### 개발 환경 (.env.development)

```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=hobeom-portal-jwt-secret-key-change-in-production-2025
```

### 운영 환경 (.env.production)

```env
PORT=3002
NEXT_PUBLIC_API_URL=https://portal.everyx.net
JWT_SECRET=운영용-강력한-시크릿-키 # ⚠️ 배포 전 반드시 변경!
```

## 💾 데이터 관리

모든 환경은 **동일한 `./data/` 디렉토리**의 CSV 파일을 사용합니다.

```
data/
├── users.csv
├── apps.csv
├── bags.csv
├── praise-badges.csv
├── daily-tasks.csv
└── ... (다른 CSV 파일들)
```

### 데이터 파일 초기화

CSV 파일이 없는 경우 자동으로 `.sample.csv` 파일에서 초기화됩니다:

```bash
# 수동으로 초기화 하려면
npm run init
```

## 🔐 보안 고려사항

### 중요: 운영 환경 배포 전 체크리스트

운영 서버 배포 전에 **반드시** 다음을 수정하세요:

```env
# .env.production
JWT_SECRET=<강력한 랜덤 키로 변경>  # openssl rand -base64 32 로 생성
NEXT_PUBLIC_API_URL=https://your-domain.com  # 실제 도메인
VAPID_PUBLIC_KEY=<운영 키>
VAPID_PRIVATE_KEY=<운영 키>
```

### 클라이언트 API 호출

클라이언트는 상대 경로로 API를 호출하면 자동으로 현재 포트를 사용합니다:

```typescript
// src/contexts/AuthContext.tsx
const response = await fetch("/api/auth/verify", {
  method: "POST",
});

// 자동으로 현재 포트 사용:
// 개발: http://localhost:3000/api/auth/verify
// 운영: http://localhost:3002/api/auth/verify
```

## ✅ 체크리스트

환경 설정 완료 후 확인사항:

- [ ] `npm run init` 실행 (최초 1회)
- [ ] `npm run dev` 실행 - 포트 3000에서 정상 작동 확인
- [ ] `npm run build && npm run start` 실행 - 포트 3002 확인
- [ ] 2개 환경에서 동일한 데이터 확인

## 🐛 트러블슈팅

### 포트가 이미 사용 중일 때

```bash
# 프로세스 확인 및 종료 (예: 3000 포트)
kill -9 $(lsof -t -i :3000)
```

### 환경 변수가 적용되지 않을 때

1. `.env` 파일 이름 확인 (`.env.development` 또는 `.env.production`)
2. Next.js 개발 서버 재시작
3. 브라우저 캐시 초기화 (Ctrl+Shift+Del)

## 📚 참고 자료

- [프로젝트 아키텍처](./architecture.md)
- [배포 가이드](./deployment.md)
