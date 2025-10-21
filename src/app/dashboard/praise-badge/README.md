# 🏆 칭찬뱃지 앱

칭찬을 모아 보상을 받을 수 있는 게이미피케이션 앱입니다. **(개인 도구 - 로그인 필수)**

## 📋 개요

관리자가 사용자에게 칭찬을 주면, 사용자는 칭찬을 모아 뱃지를 완성하고, 완성된 뱃지를 사용하여 보상을 받을 수 있습니다.

### 주요 기능

- ⭐️ **칭찬 시스템**: 관리자가 사용자에게 칭찬 포인트 부여
- 🏆 **뱃지 완성**: 4개의 칭찬이 모이면 뱃지 1개 완성
- 🎁 **보상 선택**: 완성된 뱃지 개수에 따라 다양한 보상 선택 가능
- 📱 **푸시 알림**: 사용자가 보상을 선택하면 관리자에게 실시간 알림
- 📊 **히스토리 추적**: 칭찬 및 보상 소진 내역 기록
- 🔐 **개인 도구**: 로그인한 사용자만 접근 가능

## 🎯 사용 시나리오

### 사용자 (자녀/학생)

1. 로그인 후 대시보드에서 **"칭찬뱃지"** 앱 클릭
2. 현재 모은 칭찬 포인트와 완성된 뱃지 개수 확인
3. 뱃지가 충분하면 원하는 보상 선택
4. 관리자 승인 대기

### 관리자 (부모/선생님)

1. 로그인 후 대시보드에서 **"칭찬뱃지관리"** 앱 클릭
2. **칭찬 주기** 탭에서 사용자 선택 후 칭찬하기 버튼 클릭
3. **보상 관리** 탭에서 뱃지 레벨별 보상 아이템 설정
4. **소진 내역** 탭에서 사용자의 보상 요청 승인/완료 처리
5. 사용자가 보상을 선택하면 푸시 알림 수신

## 📁 파일 구조

```
src/app/
├── dashboard/praise-badge/
│   └── page.tsx                          # 사용자 화면 (로그인 필수)
└── dashboard/admin/praise-badges/
    └── page.tsx                          # 관리자 화면

src/app/api/praise-badges/
├── route.ts                              # GET: 뱃지 현황 조회
├── give/route.ts                         # POST: 칭찬 주기
├── rewards/route.ts                      # CRUD: 보상 아이템 관리
└── redeem/route.ts                       # POST/GET/PUT: 보상 소진 및 승인

data/
├── praise-badges.csv                     # 사용자별 칭찬 현황
├── praise-history.csv                    # 칭찬 히스토리
├── praise-redemptions.csv                # 보상 소진 내역
└── praise-reward-items.csv               # 보상 아이템 설정

public/images/praise-badge/
├── piece-0.png                           # 빈 뱃지 (0/4)
├── piece-1.png                           # 1조각 (1/4)
├── piece-2.png                           # 2조각 (2/4)
├── piece-3.png                           # 3조각 (3/4)
├── piece-4.png                           # 완성 (4/4)
└── README.md                             # 이미지 가이드
```

## 🗄️ 데이터 구조

### PraiseBadge (칭찬 현황)

```typescript
{
  id: string;
  userId: string;
  currentPoints: number; // 현재 칭찬 포인트 (0-3)
  completedBadges: number; // 완성된 뱃지 개수
  lastUpdated: string;
}
```

### PraiseHistory (칭찬 히스토리)

```typescript
{
  id: string;
  userId: string;
  givenBy: string;            // 관리자 userId
  timestamp: string;
  pointsAfter: number;        // 칭찬 후 포인트
  badgesAfter: number;        // 칭찬 후 뱃지 개수
  comment?: string;
}
```

### PraiseRewardItem (보상 아이템)

```typescript
{
  id: string;
  badgeLevel: number;         // 필요한 뱃지 개수 (1-4)
  name: string;               // 보상 이름
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### PraiseRedemption (소진 내역)

```typescript
{
  id: string;
  userId: string;
  badgeCount: number;         // 소진한 뱃지 개수
  rewardItemId: string;
  rewardItemName: string;
  timestamp: string;
  status: "pending" | "approved" | "completed";
  approvedBy?: string;
  approvedAt?: string;
  comment?: string;
}
```

## 🔌 API 엔드포인트

### 뱃지 현황 조회

```http
GET /api/praise-badges
Authorization: Bearer {token}
```

**응답 (일반 사용자)**:

```json
{
  "success": true,
  "message": "칭찬뱃지 현황을 조회했습니다.",
  "data": {
    "id": "badge-user123-1729200000",
    "userId": "user123",
    "currentPoints": 2,
    "completedBadges": 3,
    "lastUpdated": "2025-10-18T12:00:00.000Z"
  }
}
```

### 칭찬 주기 (관리자 전용)

```http
POST /api/praise-badges/give
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user123",
  "comment": "숙제를 잘 했어요!"
}
```

### 보상 아이템 조회

```http
GET /api/praise-badges/rewards
Authorization: Bearer {token}
```

### 보상 아이템 추가 (관리자 전용)

```http
POST /api/praise-badges/rewards
Authorization: Bearer {token}
Content-Type: application/json

{
  "badgeLevel": 1,
  "name": "아이스크림 먹기",
  "description": "좋아하는 아이스크림 한 개"
}
```

### 보상 소진 (사용자)

```http
POST /api/praise-badges/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "rewardItemId": "reward1"
}
```

### 소진 승인 (관리자 전용)

```http
PUT /api/praise-badges/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "redemption-123456",
  "status": "approved"  // or "completed"
}
```

## 🎨 이미지 커스터마이징

`public/images/praise-badge/` 폴더에 다음 이미지를 추가하세요:

- **piece-0.png**: 빈 뱃지
- **piece-1.png**: 1/4 채워진 뱃지
- **piece-2.png**: 2/4 채워진 뱃지
- **piece-3.png**: 3/4 채워진 뱃지
- **piece-4.png**: 완성된 뱃지

이미지가 없으면 이모지(⭐️, 🏆)로 자동 대체됩니다.

### 권장 사양

- 크기: 200x200px ~ 400x400px
- 포맷: PNG (투명 배경 권장)
- 디자인: 4분할이 명확한 "참 잘했어요" 뱃지

## 🚀 초기 설정

1. **CSV 파일 초기화**

   ```bash
   bash scripts/init-dev.sh
   ```

2. **보상 아이템 설정**

   - 관리자로 로그인
   - 칭찬뱃지관리 > 보상 관리 탭
   - 뱃지 레벨별(1~4개) 보상 추가

3. **앱 활성화 확인**
   - `data/apps.csv`에서 칭찬뱃지 앱이 `is_active=true`인지 확인

## 💡 사용 팁

### 칭찬 포인트 시스템

- 칭찬 1회 = 포인트 1개
- 포인트 4개 = 뱃지 1개 완성
- 뱃지는 누적되며, 여러 개를 모을 수 있음

### 보상 레벨 설정 예시

- **뱃지 1개**: 아이스크림, 스티커, 간식
- **뱃지 2개**: 영화 관람, 게임 시간 30분
- **뱃지 3개**: 외식, 좋아하는 음식
- **뱃지 4개**: 놀이공원, 특별한 선물

### 푸시 알림 설정

관리자가 푸시 알림을 받으려면:

1. 대시보드 > 설정
2. 푸시 알림 활성화
3. 브라우저 알림 권한 허용

## 🔧 문제 해결

### 뱃지 현황이 안 보여요

- 사용자가 로그인되어 있는지 확인
- 첫 접속 시 자동으로 초기 뱃지 생성됨

### 보상을 선택했는데 뱃지가 차감되지 않아요

- 소진 내역 탭에서 상태 확인
- `pending` 상태일 경우 관리자 승인 대기 중

### 푸시 알림이 오지 않아요

- 관리자의 푸시 구독이 활성화되어 있는지 확인
- VAPID 키가 설정되어 있는지 확인
- 브라우저 알림 권한 확인

## 📝 향후 개선 사항

- [ ] 칭찬 히스토리 API 추가
- [ ] 뱃지 만료 기능 (예: 3개월)
- [ ] 통계 대시보드 (월별 칭찬 횟수 등)
- [ ] 사용자별 칭찬 카테고리 설정
- [ ] 보상 완료 후 피드백 기능
- [ ] 뱃지 애니메이션 효과
- [ ] 다중 사용자 지원 개선

## 📄 라이선스

Hobeom Portal의 일부로 제공됩니다.
