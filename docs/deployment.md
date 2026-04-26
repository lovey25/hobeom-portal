# 🌐 배포

호범 포털을 프로덕션 환경에 배포하는 가이드

## 🎯 배포 전 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] JWT_SECRET 안전한 값으로 변경
- [ ] 프로덕션 빌드 테스트 완료
- [ ] 데이터 백업 계획 수립
- [ ] 에러 모니터링 설정

## 🚀 Vercel 배포 (추천)

Vercel은 Next.js의 개발사로, 가장 간단하고 최적화된 배포 방법입니다.

### 1. Vercel CLI 설치

```bash
npm install -g vercel
```

### 2. 배포

```bash
# 프로젝트 디렉토리에서
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 환경 변수 설정

Vercel 대시보드에서 또는 CLI로:

```bash
vercel env add JWT_SECRET
# 프롬프트에서 값 입력
```

### 4. 자동 배포 설정

GitHub 연동 시 자동 배포:

1. Vercel 대시보드에서 "Import Project"
2. GitHub 저장소 선택
3. 환경 변수 설정
4. Deploy 클릭

이후 `main` 브랜치에 푸시하면 자동 배포됩니다.

### ⚠️ Vercel에서 CSV 파일 주의사항

Vercel은 서버리스 환경이므로 파일 시스템 쓰기가 제한됩니다. **데이터베이스로 마이그레이션을 권장합니다.**

대안:

- Vercel Postgres
- Supabase
- PlanetScale
- MongoDB Atlas

## 🐳 Docker 배포

### Dockerfile 생성

```dockerfile
FROM node:18-alpine AS base

# 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 데이터 디렉토리 생성
RUN mkdir -p /app/data
COPY data/*.sample.csv /app/data/

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 실행

```bash
# 빌드
docker-compose build

# 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## ☁️ 클라우드 플랫폼 배포

### Netlify

```bash
# netlify.toml 생성
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

```bash
# 배포
npm install -g netlify-cli
netlify deploy --prod
```

### Railway

1. Railway 대시보드에서 "New Project"
2. GitHub 저장소 연결
3. 환경 변수 설정:
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. 자동 배포 시작

### Render

1. Render 대시보드에서 "New Web Service"
2. GitHub 저장소 연결
3. 설정:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node
4. 환경 변수 추가

## 🗄️ 데이터베이스 마이그레이션

프로덕션에서는 CSV 대신 DB 사용을 권장합니다.

### Prisma + PostgreSQL 예시

1. **Prisma 설치**

   ```bash
   npm install @prisma/client
   npm install -D prisma
   ```

2. **스키마 생성**

   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id           String   @id @default(uuid())
     username     String   @unique
     passwordHash String
     role         String
     email        String?
     createdAt    DateTime @default(now())
     lastLogin    DateTime?
   }
   ```

3. **마이그레이션**

   ```bash
   npx prisma migrate dev
   ```

4. **data.ts 수정**

   ```typescript
   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();

   export async function getUsers() {
     return await prisma.user.findMany();
   }

   export async function getUserByUsername(username: string) {
     return await prisma.user.findUnique({
       where: { username },
     });
   }
   // ... 나머지 함수들도 동일하게 교체
   ```

## 🔒 보안 설정

### 환경 변수

프로덕션 환경 변수:

```bash
# 필수
JWT_SECRET=your-very-secure-secret-key-at-least-32-characters
NODE_ENV=production

# 웹 푸시 (사용 시)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com

# 성장기록 — Google Sheets 연동 (사용 시)
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 데이터베이스 (CSV 대신 외부 DB 사용 시)
DATABASE_URL=postgresql://user:password@host:port/database

# 선택
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

⚠️ `GOOGLE_SERVICE_ACCOUNT_KEY` 는 매우 민감한 비밀이므로 PM2 ecosystem 파일이 아니라 호스트의 시크릿 매니저(또는 `.env.production` 의 별도 보호)로 관리하세요.

### CORS 설정

필요 시 API 라우트에서 CORS 헤더 추가:

```typescript
// src/app/api/[...]/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ ... });

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Access-Control-Allow-Origin', 'https://your-domain.com');
  }

  return response;
}
```

### 쿠키 보안

프로덕션에서는 secure 쿠키 사용:

```typescript
// src/lib/cookies.ts
// 이미 NODE_ENV에 따라 secure 플래그 설정됨
```

## 📊 모니터링

### 에러 추적

Sentry 통합 예시:

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 로그 관리

- **Vercel**: 자동 로그 수집
- **Docker**: stdout/stderr → 로그 수집 시스템
- **클라우드**: 플랫폼 제공 로그 뷰어

## 🔄 CI/CD

### GitHub Actions 예시

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

## 📈 성능 최적화

### Next.js 설정

```typescript
// next.config.ts
const nextConfig = {
  // 이미지 최적화
  images: {
    domains: ["your-cdn-domain.com"],
  },

  // 압축
  compress: true,

  // 프로덕션 소스맵 비활성화
  productionBrowserSourceMaps: false,
};
```

### CDN 설정

정적 파일을 CDN에서 제공:

- Vercel: 자동 CDN
- Cloudflare: DNS 설정
- AWS CloudFront: S3 + CloudFront

## 🆘 문제 해결

### 빌드 실패

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build
npm start
```

### 환경 변수 누락

배포 플랫폼에서 환경 변수 확인:

- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- Docker: docker-compose.yml 또는 .env 파일

### 데이터 손실

정기 백업 설정:

```bash
# CSV 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_$DATE.tar.gz data/*.csv
```

## 🔗 관련 문서

- [시작하기](getting-started.md)
- [아키텍처](architecture.md)
- [Next.js 배포 문서](https://nextjs.org/docs/deployment)
