# 🏠 호범 포털 (Hobeom Portal)

Next.js 15와 React 19로 구축한 모던 웹 포털 플랫폼

## ✨ 주요 기능

### 🌐 퍼블릭 앱

- **계산기**: 기본 사칙연산
- **메모장**: 로컬 스토리지 기반 메모 관리
- **날씨**: 날씨 정보 조회

### � 대시보드 앱 (로그인 필요)

**사용자 앱:**

- **여행 준비**: 여행별 준비물 체크리스트 (가방 배정, 그룹화)
- **설정**: 프로필, 표시, 알림, 푸시 구독 관리
- **할일 현황**: 할일 통계 대시보드

**관리자 전용:**

- **사용자 관리**: 전체 사용자 CRUD 및 권한 관리
- **CSV 편집기**: 엑셀 스타일 데이터 편집 도구
- **푸시알림테스트**: 구독 디바이스에 푸시 전송 테스트

### 🔔 백그라운드 푸시 알림

- **Web Push API**: 탭이 닫혀있어도 알림 수신
- **다중 디바이스 지원**: 여러 디바이스에서 동시 구독
- **자동 디바이스 감지**: 브라우저, OS, 디바이스 타입 자동 인식
- **알림 종류**: 할일 리마인더, 여행 준비 알림
- **관리자 도구**: 브로드캐스트, 특정 사용자/디바이스 전송

### 📱 PWA (Progressive Web App)

- **앱처럼 설치**: 데스크톱/모바일에 설치 가능
- **오프라인 지원**: 기본 기능 오프라인 사용
- **백그라운드 알림**: 브라우저 꺼져도 알림 수신 (모바일)
- **빠른 실행**: 앱 아이콘 클릭으로 즉시 실행
- **날씨**: 샘플 날씨 정보

[→ 샘플 앱 상세 문서](src/app/samples/README.md)

### 🔐 대시보드 앱 (로그인 필요)

- **여행 준비**: 체크리스트, 가방 패킹, 무게/부피 자동 계산, 아코디언 그룹화 [→ 상세](src/app/dashboard/travel-prep/README.md)
- **사용자 관리**: 사용자 및 권한 관리 [→ 상세](src/app/dashboard/users/README.md)

### 👑 관리자 앱 (Admin Only)

- **CSV 편집기**: 데이터 파일 직접 편집 (엑셀 스타일 스프레드시트)
  - 클릭/더블클릭 모드 (선택/편집)
  - 키보드 네비게이션 (방향키, Tab, Enter)
  - 컬럼 정렬 및 리사이징
  - 자동 백업 기능

## � 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (Turbopack)
npm run dev

# http://localhost:3000 접속
```

**테스트 계정:**

- 관리자: `admin` / `password`
- 일반 사용자: `user1` / `password`
- 데모 사용자: `demo` / `password`

📖 **상세 가이드:** [시작하기](docs/getting-started.md)

## �🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: JWT with bcrypt
- **Data Storage**: CSV files (확장 가능)
- **Build Tool**: Turbopack

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/              # REST API 엔드포인트
│   ├── dashboard/        # 대시보드 앱들
│   │   ├── travel-prep/  # 여행 준비 앱 (+ README.md)
│   │   └── users/        # 사용자 관리 (+ README.md)
│   ├── samples/          # 퍼블릭 샘플 앱들 (+ README.md)
│   └── page.tsx          # 랜딩 페이지
├── components/           # 재사용 컴포넌트
│   ├── common/           # 공통 컴포넌트 (ProtectedRoute, LoadingSpinner 등)
│   └── ui/               # UI 컴포넌트
├── contexts/             # React 컨텍스트
├── styles/               # 🎨 디자인 시스템
│   └── design-system.ts  # 중앙 집중식 스타일 관리
├── lib/                  # 유틸리티 함수
│   ├── apiHelpers.ts     # API 헬퍼 함수
│   └── data.ts           # 데이터 처리 함수
└── types/                # TypeScript 타입 정의

data/                     # CSV 데이터 파일
docs/                     # 공통 문서
```

[→ 아키텍처 상세](docs/architecture.md)

## 📚 문서

### 공통 문서 (`docs/`)

- [시작하기](docs/getting-started.md) - 설치, 실행, 환경 설정
- [아키텍처](docs/architecture.md) - 프로젝트 구조 및 설계
- [배포](docs/deployment.md) - 프로덕션 배포 가이드
- [앱 관리](docs/app-management.md) - 앱 표시/숨김 및 전역 활성화
- [푸시 알림 & PWA](docs/push-pwa-user-guide.md) - 백그라운드 알림 및 앱 설치 가이드

### 기능별 개발자 문서 (각 폴더의 `README.md`)

**대시보드 앱:**

- [설정](src/app/dashboard/settings/README.md) - 프로필, 표시, 알림, Web Push, PWA
- [여행 준비](src/app/dashboard/travel-prep/README.md) - 준비물 관리, 아코디언 그룹화
- [사용자 관리](src/app/dashboard/users/README.md) - 권한 관리, CRUD API
- [CSV 편집기](src/app/dashboard/csv-editor/README.md) - 스프레드시트 인터페이스
- [할일 현황](src/app/dashboard/daily-tasks/README.md) - 통계 및 현황 대시보드

**관리자 전용:**

- [푸시알림테스트](src/app/dashboard/admin/push-test/README.md) - 관리자 푸시 전송 도구

**퍼블릭 앱:**

- [샘플 앱들](src/app/samples/README.md) - 계산기, 메모장, 날씨

## � 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 데이터 초기화
bash scripts/init-dev.sh

# 3. (선택) VAPID 키 생성 (푸시 알림 사용 시)
node scripts/generate-vapid-keys.js

# 4. 개발 서버 실행
npm run dev

# 5. (선택) 푸시 스케줄러 실행 (백그라운드 알림 사용 시)
npm run push-scheduler
```

**테스트 계정:**

- 관리자: `admin / password`
- 일반 사용자: `user1 / password`, `demo / password`

## 배포 가이드 (PM2)

### PM2 설치

```bash
# 글로벌 설치
npm install -g pm2

# PM2+ 가입 (선택사항)
pm2 link
```

### 프로덕션 빌드

```bash
# 필요한 환경변수 설정
export JWT_SECRET="your-production-secret-key"
export NODE_ENV=production

# 빌드 실행
npm run build
```

### 서비스 시작

```bash
# PM2로 서비스 시작
pm2 start npm --name "hobeom-portal" -- start

# 또는 특정 포트 지정
pm2 start npm --name "hobeom-portal" -- start -- -p 3000
```

### 서비스 관리 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs hobeom-portal

# 실시간 모니터링
pm2 monit

# 서비스 중지
pm2 stop hobeom-portal

# 서비스 재시작
pm2 restart hobeom-portal

# 서비스 재로드 (무중단 배포)
pm2 reload hobeom-portal

# 서비스 삭제
pm2 delete hobeom-portal
```

### 시스템 부팅 시 자동 시작

```bash
# PM2 시작 스크립트 생성
pm2 startup

# 현재 PM2 프로세스 저장
pm2 save

# 저장된 프로세스 복원
pm2 resurrect
```

### 환경변수 관리

PM2 에코시스템 파일(`ecosystem.config.js`)을 사용한 정식 배포:

```bash
# 에코시스템 파일로 시작
pm2 start ecosystem.config.js --env production

# 수정 후 재시작
pm2 restart ecosystem.config.js --env production
```

### 배포 워크플로우

```bash
# 1. 코드 업데이트 후 빌드
git pull
npm install
npm run build

# 2. PM2로 재로드 (무중단 배포)
pm2 reload hobeom-portal

# 3. 상태 확인
pm2 status
pm2 logs hobeom-portal
```

📖 **상세 가이드:** [배포 문서](docs/deployment.md)

## �🔧 확장하기

### 새로운 앱 추가 5단계

1. `data/apps.csv`에 앱 메타데이터 추가
2. `src/app/{samples|dashboard}/[app-name]/page.tsx` 생성
3. (필요 시) `src/app/api/[api-name]/route.ts` API 엔드포인트 추가
4. 앱 폴더에 `README.md` 개발자 문서 작성
5. 데이터 저장이 필요하면 `data/[table].csv` + `data.ts` 함수 추가

### 🎨 디자인 시스템 사용

모든 스타일을 중앙에서 관리하는 디자인 시스템이 적용되어 있습니다:

```typescript
import { layout, text, card, table, cn } from "@/styles/design-system";

<div className={layout.page}>
  <main className={layout.container}>
    <h1 className={text.pageTitle}>제목</h1>
    <div className={cn(card.statBlue, "custom-class")}>통계</div>
  </main>
</div>;
```

📖 **상세 가이드:** [디자인 시스템 문서](docs/design-system.md)

## 📝 최근 업데이트

[CHANGELOG.md](CHANGELOG.md) 참고

## 🔒 보안

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해싱
- 역할 기반 접근 제어 (admin/user)
- 보호된 라우트 미들웨어

## 개선예정

- CSV 읽기 캐싱 및 쓰기 큐잉으로 성능 최적화

## � 라이센스

MIT License
