# 🏠 호범 포털 (Hobeom Portal)

Next.js 15와 React 19로 구축한 모던 웹 포털 플랫폼

## ✨ 주요 기능

### 🌐 퍼블릭 앱## 🔧 확장하기

새로운 앱 추가는 간단합니다:

1. `data/apps.csv`에 앱 정보 추가
2. `src/app/` 하위에 새 라우트 생성
3. 필요 시 API 엔드포인트 추가
4. 앱 폴더에 README.md 작성

## 📝 최근 업데이트

### v0.3.0 - 2024년 12월 (현재)

**신규 기능:**

- ✨ **CSV 편집기 앱** (관리자 전용)

  - 엑셀 스타일 스프레드시트 인터페이스
  - 클릭/더블클릭 모드 (선택/편집)
  - 키보드 네비게이션 (Tab/Enter/방향키)
  - 컬럼 정렬 및 리사이징
  - 자동 백업 기능

- 🎯 **여행 준비 앱 UX 개선**

  - 아코디언 그룹화 시스템 (분류별/중요도별)
  - 전체 접기/펴기 기능
  - 그룹별 일괄 선택
  - 미배정 아이템 전용 카드

- 🐛 **버그 수정**
  - 가방 삭제 시 데이터 무결성 보장
  - 배정된 아이템의 bagId 자동 초기화
  - 대시보드 앱 로딩 문제 해결

**기술 개선:**

- 배치 작업 패턴 강화 (CSV race condition 방지)
- API 검증 로직 개선 (빈 문자열 허용)
- Set 기반 collapse 상태 관리

상세한 변경 내역은 [CHANGELOG.md](CHANGELOG.md) 참고- **계산기**: 기본 사칙연산

- **메모장**: 로컬 스토리지 기반 메모 관리
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
├── contexts/             # React 컨텍스트
├── lib/                  # 유틸리티 함수
└── types/                # TypeScript 타입 정의

data/                     # CSV 데이터 파일
docs/                     # 공통 문서
```

[→ 아키텍처 상세](docs/architecture.md)

## 📚 문서

### 공통 가이드

- [시작하기](docs/getting-started.md) - 설치, 실행, 환경 설정
- [아키텍처](docs/architecture.md) - 프로젝트 구조 및 설계
- [배포](docs/deployment.md) - 프로덕션 배포 가이드

### 앱별 문서

- [여행 준비 앱](src/app/dashboard/travel-prep/README.md) - 기능, API, 데이터 구조
- [사용자 관리](src/app/dashboard/users/README.md) - 권한 관리, API
- [샘플 앱들](src/app/samples/README.md) - 계산기, 메모장, 날씨

## 🔧 확장하기

새로운 앱 추가는 간단합니다:

1. `data/apps.csv`에 앱 정보 추가
2. `src/app/` 하위에 새 라우트 생성
3. 필요 시 API 엔드포인트 추가
4. 앱 폴더에 README.md 작성

## � 최근 업데이트

[CHANGELOG.md](CHANGELOG.md) 참고

## 🤝 기여

새로운 앱이나 기능 개선을 환영합니다!

## 🔒 보안

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해싱
- 역할 기반 접근 제어 (admin/user)
- 보호된 라우트 미들웨어

## � 라이센스

MIT License
