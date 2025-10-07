# 🎒 여행 준비 앱

여행 준비물 관리와 가방 패킹을 최적화하는 통합 솔루션

## 📋 목차

- [개요](#개요)
- [핵심 기능](#핵심-기능)
- [사용 방법](#사용-방법)
- [화면 구성](#화면-구성)
- [데이터 구조](#데이터-구조)
- [API 엔드포인트](#api-엔드포인트)
- [개발 가이드](#개발-가이드)

## 개요

여행 준비 앱은 여행자가 준비물을 체계적으로 관리하고, 여러 가방에 효율적으로 배정하며, 무게와 부피를 실시간으로 추적할 수 있는 도구입니다.

**주요 해결 과제:**

- ✅ 준비물 체크리스트 관리
- ✅ 가방별 무게/부피 자동 계산
- ✅ 아이템 중요도 및 카테고리 분류
- ✅ 일괄 작업으로 성능 최적화
- ✅ 직관적인 필터링 및 검색

## 핵심 기능

### 1. 여행 관리

여행 유형별 템플릿 제공:

- 국내여행
- 해외여행
- 캠핑
- 출장
- 기타

각 여행은 다음 정보를 포함:

- 여행 이름
- 시작/종료 날짜
- 여행 유형
- 일수 자동 계산

### 2. 아이템 관리

**마스터 아이템 목록:**

- 의류 (상의, 하의, 속옷 등)
- 전자기기 (충전기, 노트북, 카메라 등)
- 세면도구 (칫솔, 치약, 샴푸 등)
- 의료용품 (상비약, 밴드 등)
- 서류 (여권, 신분증, 보험 등)
- 기타

**아이템 속성:**

- 이름
- 카테고리
- 중요도 (1~5)
- 무게 (g)
- 부피 (L)
- 크기 (cm)

### 3. 가방 패킹

**가방 관리:**

- 가방 추가/수정/삭제
- 가방별 용량 설정 (L)
- 최대 무게 설정 (kg)
- 가방 색상 선택

**실시간 통계:**

- 현재 무게 / 최대 무게
- 현재 부피 / 최대 용량
- 아이템 개수
- 용량 초과 경고

**아이템 배정:**

- 드래그 앤 드롭 (선택 후 클릭)
- 일괄 이동 (여러 아이템 한 번에)
- 미배정 아이템 필터

### 4. 배치 작업 (성능 최적화)

CSV 동시 쓰기 문제를 해결하기 위한 배치 API:

- **일괄 추가**: 여러 아이템을 한 번에 여행에 추가
- **일괄 삭제**: 선택된 여러 아이템 동시 삭제
- **일괄 이동**: 여러 아이템을 한 번에 다른 가방으로 이동

**성능 개선:**

- N번 읽기/쓰기 → 1번 읽기/쓰기
- 데이터 무결성 보장
- 사용자 경험 향상

### 5. 편의 기능

**선택 및 필터:**

- 전체 선택/해제
- 카테고리 필터
- 중요도 필터
- 준비상태 필터 (전체/준비중/완료)
- 미배정 아이템 필터
- 가방별 필터

**아이템 관리:**

- 준비 완료 토글
- 수량 조절 (+/-)
- 아이템 편집
- 아이템 삭제

**UI/UX:**

- 반응형 디자인 (모바일/태블릿/데스크톱)
- 빠른 섹션 이동 (스크롤 네비게이션)
- 실시간 통계 업데이트
- 시각적 피드백 (선택 상태, 호버 효과)

## 사용 방법

### 워크플로우

#### 1. 여행 선택/생성

```
대시보드 → 여행 준비 → 여행 선택
```

- 기존 여행 선택 또는 새 여행 생성
- 여행 유형 템플릿 선택
- 일정 입력 (시작일, 종료일)

#### 2. 아이템 선택

```
여행 준비 → 준비물 선택
```

- 마스터 목록에서 필요한 아이템 검색
- 카테고리/중요도로 필터링
- 체크박스로 여러 아이템 선택
- "선택한 아이템 추가" 버튼 클릭

#### 3. 가방 설정

```
여행 준비 → 가방 섹션 → 가방 추가
```

- 가방 이름 입력 (예: 캐리어, 백팩)
- 용량 설정 (L)
- 최대 무게 설정 (kg)
- 색상 선택

#### 4. 아이템 배정

**방법 1: 개별 드래그**

1. 준비물 섹션에서 아이템 클릭 (선택)
2. 원하는 가방 클릭
3. 확인 대화상자에서 승인

**방법 2: 일괄 이동**

1. 여러 아이템 체크박스 선택
2. "선택한 아이템을 가방으로" 버튼 클릭
3. 가방 선택

#### 5. 패킹 진행

- 실제로 가방에 넣은 아이템은 "준비완료" 버튼 클릭
- 가방 통계에서 무게/부피 확인
- 용량 초과 시 아이템 재배치

#### 6. 최종 확인

- 모든 아이템이 준비 완료되었는지 확인
- 가방별 통계 최종 점검
- 미배정 아이템이 없는지 확인

## 화면 구성

### 메인 화면 (`/dashboard/travel-prep`)

**섹션 구성:**

1. **필터 바** (최상단)

   - 중요도 필터
   - 카테고리 필터
   - 한 줄로 컴팩트하게 배치

2. **가방 섹션**

   - 가방 카드 그리드 (2~4열 반응형)
   - 각 카드: 이름, 통계, 진행률 바
   - 선택 시 해당 가방 아이템만 필터링
   - 선택된 가방 삭제 버튼 (헤더)

3. **준비물 섹션**
   - 헤더: 아이템 수, 액션 버튼들
   - 미배정 필터 버튼
   - 준비상태 순환 버튼
   - 아이템 카드 그리드 (1~3열 반응형)

**빠른 네비게이션:**

- 스크롤 시 상단에 섹션 바로가기 표시
- 필터 / 가방 / 준비물 섹션으로 즉시 이동

### 가방 관리 화면 (`/dashboard/travel-prep/bags`)

- 가방 목록 표시
- 가방 추가/수정/삭제
- 가방별 상세 통계

### 아이템 선택 화면 (`/dashboard/travel-prep/items`)

- 마스터 아이템 전체 목록
- 이미 추가된 아이템 표시
- 검색 및 필터링
- 일괄 추가 기능

### 여행 선택 화면 (`/dashboard/travel-prep/select-trip`)

- 여행 목록 표시
- 새 여행 생성
- 여행 선택하여 준비 시작

## 데이터 구조

### CSV 파일

#### travel-items.csv (마스터 아이템 목록)

```csv
id,name,category,importance,weight_g,volume_l,size_cm,notes,is_active
1,티셔츠,의류,3,150,0.5,30x20x2,,true
2,청바지,의류,4,500,1.2,40x30x5,,true
3,충전기,전자기기,5,100,0.1,10x5x3,,true
```

**필드 설명:**

- `id`: 고유 식별자
- `name`: 아이템 이름
- `category`: 카테고리
- `importance`: 중요도 (1~5)
- `weight_g`: 무게 (그램)
- `volume_l`: 부피 (리터)
- `size_cm`: 크기 (센티미터)
- `notes`: 메모
- `is_active`: 활성 상태

#### trip-lists.csv (여행 목록)

```csv
id,user_id,name,travel_type_id,start_date,end_date,created_at,is_active
1,user1,제주도 여행,1,2025-10-15,2025-10-17,2025-10-01T10:00:00Z,true
```

**필드 설명:**

- `id`: 여행 ID
- `user_id`: 사용자 ID
- `name`: 여행 이름
- `travel_type_id`: 여행 유형 ID
- `start_date`, `end_date`: 여행 기간
- `created_at`: 생성 시각
- `is_active`: 활성 상태

#### bags.csv (가방 정보)

```csv
id,trip_id,name,capacity_l,max_weight_kg,color,created_at
1,1,캐리어,50,20,blue,2025-10-01T11:00:00Z
2,1,백팩,30,10,green,2025-10-01T11:01:00Z
```

**필드 설명:**

- `id`: 가방 ID
- `trip_id`: 여행 ID
- `name`: 가방 이름
- `capacity_l`: 용량 (리터)
- `max_weight_kg`: 최대 무게 (킬로그램)
- `color`: 색상
- `created_at`: 생성 시각

#### trip-items.csv (여행별 선택 아이템)

```csv
id,trip_id,item_id,quantity,is_prepared,bag_id,added_at
1,1,1,3,true,1,2025-10-01T12:00:00Z
2,1,2,2,false,1,2025-10-01T12:01:00Z
3,1,3,1,true,2,2025-10-01T12:02:00Z
```

**필드 설명:**

- `id`: 고유 ID
- `trip_id`: 여행 ID
- `item_id`: 마스터 아이템 ID
- `quantity`: 수량
- `is_prepared`: 준비 완료 여부
- `bag_id`: 배정된 가방 ID (빈 문자열 = 미배정)
- `added_at`: 추가 시각

#### travel-types.csv (여행 유형 템플릿)

```csv
id,name,description,default_items,order,is_active
1,국내여행,국내 여행을 위한 기본 템플릿,"1,2,3,4,5",1,true
2,해외여행,해외 여행을 위한 기본 템플릿,"1,2,3,4,5,10,11",2,true
```

## API 엔드포인트

### 여행 관리

#### `GET /api/travel-prep/trips`

현재 사용자의 여행 목록 조회

**응답:**

```json
{
  "success": true,
  "message": "여행 목록 조회 성공",
  "data": [
    {
      "id": "1",
      "name": "제주도 여행",
      "startDate": "2025-10-15",
      "endDate": "2025-10-17"
    }
  ]
}
```

#### `POST /api/travel-prep/trips`

새 여행 생성

**요청 본문:**

```json
{
  "name": "부산 여행",
  "travelTypeId": "1",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03"
}
```

### 아이템 관리

#### `GET /api/travel-prep/items`

마스터 아이템 목록 조회

**쿼리 파라미터:**

- `category`: 카테고리 필터
- `importance`: 중요도 필터

#### `GET /api/travel-prep/trip-items?tripId={id}`

특정 여행의 아이템 조회

#### `POST /api/travel-prep/trip-items/batch`

여러 아이템 일괄 추가

**요청 본문:**

```json
{
  "tripId": "1",
  "itemIds": ["1", "2", "3"],
  "quantity": 1
}
```

#### `POST /api/travel-prep/trip-items/batch-delete`

여러 아이템 일괄 삭제

**요청 본문:**

```json
{
  "tripItemIds": ["1", "2", "3"]
}
```

#### `POST /api/travel-prep/trip-items/batch-update-bag`

여러 아이템 가방 일괄 이동

**요청 본문:**

```json
{
  "tripItemIds": ["1", "2", "3"],
  "bagId": "bag-1"
}
```

### 가방 관리

#### `GET /api/travel-prep/bags?tripId={id}`

특정 여행의 가방 조회

#### `POST /api/travel-prep/bags`

새 가방 추가

**요청 본문:**

```json
{
  "tripId": "1",
  "name": "캐리어",
  "capacityL": 50,
  "maxWeightKg": 20,
  "color": "blue"
}
```

#### `DELETE /api/travel-prep/bags/{id}`

가방 삭제 (아이템은 미배정 상태로 변경)

### 통계

#### `GET /api/travel-prep/bag-stats?tripId={id}`

가방별 통계 조회 (무게, 부피, 아이템 수)

**응답:**

```json
{
  "success": true,
  "data": [
    {
      "bagId": "1",
      "bag": { "name": "캐리어", "capacityL": 50, "maxWeightKg": 20 },
      "totalWeight": 5.5,
      "totalVolume": 15.3,
      "itemCount": 10,
      "weightPercent": 27.5,
      "volumePercent": 30.6
    }
  ]
}
```

## 개발 가이드

### 컴포넌트 구조

```
src/app/dashboard/travel-prep/
├── page.tsx                    # 메인 페이지
├── README.md                   # 이 문서
├── bags/
│   └── page.tsx               # 가방 관리 페이지
├── items/
│   └── page.tsx               # 아이템 선택 페이지
├── select-trip/
│   └── page.tsx               # 여행 선택 페이지
└── components/
    ├── BagCard.tsx            # 가방 카드
    ├── BagFormModal.tsx       # 가방 추가/수정 모달
    ├── ItemCard.tsx           # 아이템 카드
    ├── ItemFormModal.tsx      # 아이템 추가/수정 모달
    └── FilterBar.tsx          # 필터 바
```

### 상태 관리

메인 페이지에서 관리하는 주요 상태:

```typescript
const [tripId, setTripId] = useState<string | null>(null);
const [tripItems, setTripItems] = useState<TripItemWithDetails[]>([]);
const [bagStats, setBagStats] = useState<BagStats[]>([]);
const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
const [filter, setFilter] = useState<FilterState>({
  category: undefined,
  importance: undefined,
  isPrepared: undefined,
  bagId: undefined,
});
```

### 배치 작업 구현

```typescript
// 일괄 삭제 예시
const deleteSelectedItems = async () => {
  const ids = Array.from(selectedItemIds);

  const response = await fetch("/api/travel-prep/trip-items/batch-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tripItemIds: ids }),
  });

  if (response.ok) {
    await loadData(); // 데이터 새로고침
    setSelectedItemIds(new Set()); // 선택 초기화
  }
};
```

### 필터링 로직

```typescript
const filteredItems = tripItems.filter((item) => {
  if (filter.category && item.item.category !== filter.category) return false;
  if (filter.importance && item.item.importance !== filter.importance) return false;
  if (filter.isPrepared !== undefined && item.isPrepared !== filter.isPrepared) return false;
  if (filter.bagId === "unassigned" && item.bagId !== "") return false;
  if (filter.bagId && filter.bagId !== "unassigned" && item.bagId !== filter.bagId) return false;
  return true;
});
```

### 성능 최적화 팁

1. **배치 API 사용**: 여러 작업은 반드시 배치 API 사용
2. **상태 최소화**: 필요한 상태만 관리
3. **메모이제이션**: `useMemo`로 필터링 결과 캐싱
4. **디바운싱**: 검색 입력 시 디바운싱 적용
5. **조건부 렌더링**: 큰 리스트는 가상 스크롤 고려

### 새 기능 추가 가이드

#### 1. 새 필터 추가

1. `FilterState` 인터페이스에 필드 추가
2. `FilterBar` 컴포넌트에 UI 추가
3. 필터링 로직 업데이트

#### 2. 새 통계 추가

1. `BagStats` 인터페이스 확장
2. API에서 계산 로직 추가
3. `BagCard`에서 표시

#### 3. 새 데이터 필드 추가

1. CSV 파일 스키마 업데이트
2. TypeScript 타입 업데이트
3. API 읽기/쓰기 로직 수정
4. UI에 필드 추가

## 🔗 관련 문서

- [프로젝트 아키텍처](../../../docs/architecture.md)
- [API 설계](../../../docs/architecture.md#-api-설계)
- [데이터 관리](../../../docs/architecture.md#-데이터-관리)
