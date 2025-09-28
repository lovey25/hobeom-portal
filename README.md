# 호범 포털 (Hobeom Portal)

여러 기능을 통합한 현대적인 웹 포털 플랫폼입니다. Next.js 15, React 19, TypeScript로 구축되었습니다.

## 🚀 주요 기능

### 🌐 퍼블릭 앱 (로그인 불필요)

- **계산기**: 기본적인 사칙연산 계산기
- **메모장**: 로컬 스토리지를 활용한 메모 작성 및 관리
- **날씨**: 샘플 날씨 정보 표시

### 🔐 대시보드 앱 (로그인 필요)

- **할일관리**: 개인 할일 관리 시스템
- **파일관리**: 파일 업로드 및 관리
- **데이터분석**: CSV 데이터 분석 도구
- **설정**: 사용자 설정 및 프로필 관리

### 👑 관리자 도구 (관리자 권한 필요)

- **사용자관리**: 사용자 및 권한 관리
- **시스템로그**: 시스템 로그 모니터링

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: JWT with bcrypt
- **Data Storage**: CSV files (확장 가능)
- **Build Tool**: Turbopack

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # REST API endpoints
│   ├── dashboard/         # 대시보드 페이지
│   ├── samples/          # 샘플 앱들
│   └── page.tsx          # 랜딩 페이지
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트
│   └── ...
├── contexts/            # React 컨텍스트 (인증 등)
├── lib/                 # 유틸리티 함수들
├── types/               # TypeScript 타입 정의
└── ...
data/                    # CSV 데이터 파일
├── users.csv           # 사용자 데이터
└── apps.csv           # 앱 설정 데이터
```

## 🚀 시작하기

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

### 테스트 계정

- **관리자**: `admin` / `password`
- **일반사용자**: `user1` / `password`
- **데모사용자**: `demo` / `password`

## 🎯 사용자 흐름

1. **랜딩페이지**: 퍼블릭 앱 아이콘과 로그인 폼 표시
2. **로그인**: JWT 토큰 기반 인증
3. **대시보드**: 개인화된 앱 아이콘 그리드
4. **앱 이용**: 각 기능별 전용 페이지

## 🔧 확장성

이 포털은 모듈식으로 설계되어 새로운 앱을 쉽게 추가할 수 있습니다:

1. `data/apps.csv`에 새 앱 정보 추가
2. `src/app/` 하위에 새 라우트 생성
3. 필요시 API 엔드포인트 추가

## 🔒 보안

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해싱
- 역할 기반 접근 제어 (admin/user)
- 보호된 라우트 미들웨어

## 📊 데이터 관리

현재는 CSV 파일을 사용하지만, 다음으로 쉽게 확장 가능합니다:

- PostgreSQL, MySQL 등 관계형 DB
- MongoDB 등 NoSQL DB
- Prisma ORM 통합

## 🎨 커스터마이징

- Tailwind CSS v4로 스타일링
- 컴포넌트 기반 UI 설계
- 다크/라이트 테마 지원 준비
- 반응형 디자인

## 🌐 배포

Vercel, Netlify, 또는 기타 Node.js 호스팅 플랫폼에 배포 가능합니다.

환경 변수 설정:

```bash
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
```

## 🤝 기여

이 프로젝트는 확장 가능하도록 설계되었습니다. 새로운 기능이나 개선사항을 자유롭게 추가해보세요!

## 📝 라이센스

MIT License
