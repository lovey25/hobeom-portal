# 🚀 시작하기

호범 포털 설치 및 실행 가이드

## 📋 사전 요구사항

- **Node.js**: v18 이상
- **npm**: v9 이상 (또는 yarn, pnpm)
- **Git**: 최신 버전

## 🛠️ 설치

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/hobeom-portal.git
cd hobeom-portal
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정 (선택)

`.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```bash
# JWT 시크릿 (프로덕션에서는 필수)
JWT_SECRET=your-secure-jwt-secret-key-here

# 노드 환경
NODE_ENV=development
```

**참고:** `JWT_SECRET`을 설정하지 않으면 기본값이 사용됩니다. 프로덕션 환경에서는 반드시 안전한 시크릿을 설정하세요.

### 4. 데이터 초기화

첫 실행 시 CSV 파일이 자동으로 생성되지만, 수동으로 초기화하려면:

```bash
bash scripts/init-dev.sh
```

이 스크립트는 `data/*.sample.csv` 파일을 `data/*.csv`로 복사합니다.

## 🏃 실행

### 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

**Turbopack 사용:** 개발 서버는 자동으로 Turbopack을 사용합니다 (`package.json` 설정).

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 실행
npm start
```

### 린트

```bash
npm run lint
```

## 🔑 테스트 계정

개발 환경에서 사용 가능한 테스트 계정:

| 사용자명 | 비밀번호   | 역할        | 설명                  |
| -------- | ---------- | ----------- | --------------------- |
| `admin`  | `password` | 관리자      | 모든 기능 접근 가능   |
| `user1`  | `password` | 일반 사용자 | 대시보드 앱 접근 가능 |
| `demo`   | `password` | 일반 사용자 | 데모 계정             |

## 📂 데이터 파일 구조

### CSV 파일 위치

```
data/
├── users.csv              # 사용자 데이터 (실제)
├── users.sample.csv       # 사용자 샘플 (Git 포함)
├── apps.csv               # 앱 설정 (실제)
├── apps.sample.csv        # 앱 설정 샘플 (Git 포함)
├── travel-items.csv       # 여행 아이템 (실제)
├── travel-items.sample.csv
├── travel-types.csv       # 여행 유형 (실제)
├── travel-types.sample.csv
├── bags.csv               # 가방 정보 (실제)
├── bags.sample.csv
├── trip-lists.csv         # 여행 목록 (실제)
├── trip-lists.sample.csv
├── trip-items.csv         # 여행 아이템 (실제)
└── trip-items.sample.csv
```

### CSV 파일 관리

- **`*.csv`**: 실제 운영 데이터 (`.gitignore`에 포함되어 Git에서 제외)
- **`*.sample.csv`**: 초기 데이터 템플릿 (Git에 포함)

첫 실행 시 `*.csv` 파일이 없으면 자동으로 `*.sample.csv`에서 복사됩니다.

## 🧪 개발 팁

### Hot Reload

Turbopack을 사용하므로 파일 변경 시 즉시 반영됩니다.

### 디버깅

- **서버 로그**: 터미널에서 API 요청 로그 확인
- **브라우저 DevTools**: React DevTools, Network 탭 활용
- **인증 문제**: 브라우저 쿠키 확인 (`hobeom-portal-token`)

### CSV 데이터 리셋

개발 중 데이터를 초기화하려면:

```bash
rm data/*.csv
bash scripts/init-dev.sh
```

또는 서버 재시작 시 자동으로 샘플 데이터에서 복사됩니다.

## ⚠️ 주의사항

1. **JWT_SECRET**: 프로덕션에서는 반드시 안전한 시크릿 키 사용
2. **CSV 파일**: `data/*.csv`는 민감 정보를 포함하므로 Git에 커밋하지 않음
3. **Turbopack**: `npm run dev`는 반드시 `--turbopack` 플래그 사용 (package.json에 설정됨)

## 🔗 다음 단계

- [아키텍처](architecture.md) - 프로젝트 구조 이해
- [여행 준비 앱](../src/app/dashboard/travel-prep/README.md) - 주요 앱 사용법
- [배포](deployment.md) - 프로덕션 배포 가이드

## 🆘 문제 해결

### 포트가 이미 사용 중

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### CSV 파일 오류

```bash
# 데이터 파일 초기화
rm data/*.csv
bash scripts/init-dev.sh
```
