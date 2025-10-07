# 🌐 샘플 앱

로그인 없이 누구나 사용할 수 있는 퍼블릭 앱 모음

## 📋 목차

- [개요](#개요)
- [앱 목록](#앱-목록)
- [개발 가이드](#개발-가이드)

## 개요

샘플 앱은 호범 포털의 랜딩 페이지에서 로그인 없이 바로 사용할 수 있는 간단한 도구들입니다.

**특징:**

- 🔓 인증 불필요 (누구나 접근 가능)
- 💾 로컬 스토리지 사용 (브라우저 내 데이터 저장)
- 🎯 단순하고 직관적인 UI
- 📱 반응형 디자인

**용도:**

- 포털 기능 시연
- 빠른 유틸리티 도구
- 개발 예시

## 앱 목록

### 1. 계산기 (`/samples/calculator`)

기본적인 사칙연산 계산기

**기능:**

- ➕ 덧셈
- ➖ 뺄셈
- ✖️ 곱셈
- ➗ 나눗셈
- 🔢 소수점 계산
- 🧹 초기화 (AC)
- ⌫ 한 글자 삭제 (DEL)

**기술:**

- React 상태 관리
- `eval()` 없는 안전한 계산 로직
- 키보드 입력 지원

**사용법:**

1. 숫자 버튼 클릭 또는 키보드 입력
2. 연산자 선택
3. = 버튼으로 결과 확인

**코드 위치:**

- `src/app/samples/calculator/page.tsx`

### 2. 메모장 (`/samples/notepad`)

로컬 스토리지 기반 간단한 메모 앱

**기능:**

- 📝 메모 작성 및 편집
- 💾 자동 저장 (로컬 스토리지)
- 📋 메모 목록 관리
- 🗑️ 메모 삭제
- 🎨 텍스트 에리어

**기술:**

- `localStorage` API
- React 상태 관리
- 실시간 자동 저장

**사용법:**

1. 텍스트 에리어에 메모 입력
2. 자동으로 브라우저에 저장
3. 브라우저 닫아도 데이터 유지

**저장 위치:**

- 로컬 스토리지 키: `hobeom-portal-notepad-notes`

**주의사항:**

- 브라우저 캐시 삭제 시 데이터 손실
- 다른 브라우저/기기에서는 동기화 안 됨

**코드 위치:**

- `src/app/samples/notepad/page.tsx`

### 3. 날씨 (`/samples/weather`)

샘플 날씨 정보 표시

**기능:**

- 🌤️ 현재 날씨 표시
- 🌡️ 온도 정보
- 💧 습도
- 🌬️ 풍속
- 📍 도시별 날씨 (샘플 데이터)

**기술:**

- 정적 데이터 (API 연동 없음)
- 조건부 아이콘 렌더링
- 날씨 상태별 스타일링

**사용법:**

1. 도시 선택 (드롭다운)
2. 샘플 날씨 정보 확인

**데이터:**

- 하드코딩된 샘플 데이터
- 실제 날씨 API 연동 가능 (확장 예정)

**코드 위치:**

- `src/app/samples/weather/page.tsx`

## 개발 가이드

### 새 샘플 앱 추가하기

#### 1. 라우트 생성

```bash
# 새 앱 폴더 생성
mkdir -p src/app/samples/new-app

# 페이지 파일 생성
touch src/app/samples/new-app/page.tsx
```

#### 2. 페이지 컴포넌트 작성

```tsx
// src/app/samples/new-app/page.tsx
"use client";

import { useState } from "react";

export default function NewAppPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">새 앱</h1>

        {/* 앱 콘텐츠 */}
        <div className="bg-white rounded-lg p-6 shadow">{/* ... */}</div>
      </div>
    </div>
  );
}
```

#### 3. apps.csv에 등록

```csv
# data/apps.csv
new-app,새 앱,설명,🎯,/samples/new-app,false,public,10,true
```

**필드:**

- `id`: new-app
- `name`: 새 앱
- `description`: 설명
- `icon`: 🎯 (이모지)
- `href`: /samples/new-app
- `require_auth`: false (퍼블릭)
- `category`: public
- `order`: 10 (표시 순서)
- `is_active`: true

#### 4. 랜딩 페이지에서 확인

http://localhost:3000 에서 새 앱 아이콘이 표시됩니다.

### 로컬 스토리지 사용 패턴

#### 데이터 저장

```tsx
// 저장
localStorage.setItem("hobeom-portal-app-data", JSON.stringify(data));

// 불러오기
const saved = localStorage.getItem("hobeom-portal-app-data");
const data = saved ? JSON.parse(saved) : defaultValue;
```

#### React Hook 예시

```tsx
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

// 사용
const [notes, setNotes] = useLocalStorage("my-notes", "");
```

### UI/UX 가이드라인

#### 레이아웃

```tsx
<div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">앱 이름</h1>

    <div className="bg-white rounded-lg p-6 shadow">{/* 콘텐츠 */}</div>
  </div>
</div>
```

#### 반응형 디자인

- 모바일 우선 (mobile-first)
- Tailwind 반응형 클래스 사용
- 최소 너비: 320px
- 최대 너비: 1200px

#### 접근성

- 시맨틱 HTML 사용
- 키보드 네비게이션 지원
- 적절한 ARIA 레이블
- 색상 대비 준수

### 성능 최적화

1. **클라이언트 컴포넌트**: `"use client"` 지시문 사용
2. **상태 최소화**: 필요한 상태만 관리
3. **메모이제이션**: 비용 높은 계산은 `useMemo`
4. **디바운싱**: 검색/입력은 디바운싱 적용
5. **지연 로딩**: 큰 컴포넌트는 동적 import

### 테스트

```typescript
// 예: 계산기 로직 테스트
describe("Calculator", () => {
  it("should add two numbers", () => {
    expect(calculate("2+3")).toBe(5);
  });

  it("should handle decimal points", () => {
    expect(calculate("1.5+2.5")).toBe(4);
  });
});
```

### 확장 아이디어

#### 계산기

- [ ] 공학용 계산기 모드
- [ ] 계산 이력
- [ ] 단위 변환

#### 메모장

- [ ] 마크다운 지원
- [ ] 메모 검색
- [ ] 태그 기능
- [ ] 내보내기 (TXT, MD)

#### 날씨

- [ ] 실제 날씨 API 연동 (OpenWeather, 기상청)
- [ ] 위치 기반 날씨
- [ ] 7일 예보
- [ ] 날씨 알림

#### 새 샘플 앱

- [ ] 할일 목록 (To-Do)
- [ ] 타이머/스톱워치
- [ ] 단위 변환기
- [ ] QR 코드 생성기
- [ ] 컬러 피커
- [ ] 텍스트 도구 (카운터, 변환 등)

## 🔗 관련 문서

- [프로젝트 구조](../../../docs/architecture.md)
- [새 앱 추가](../../../docs/architecture.md#새-앱-추가하기)
- [UI 컴포넌트](../../../docs/architecture.md#uiux-패턴)
