# Design System 사용 가이드

Hobeom Portal의 중앙 집중식 디자인 시스템입니다. 모든 스타일을 한 곳에서 관리하여 일관성을 유지하고 유지보수를 쉽게 합니다.

## 📦 설치 및 임포트

```typescript
import {
  layout,
  text,
  card,
  button,
  table,
  form,
  badge,
  state,
  grid,
  colors,
  cn, // 유틸리티 함수
} from "@/styles/design-system";
```

## 🎨 주요 스타일 카테고리

### 1. Layout (레이아웃)

페이지와 컨테이너의 기본 구조를 정의합니다.

```tsx
<div className={layout.page}>
  <main className={layout.container}>
    {/* 컨텐츠 */}
  </main>
</div>

// 좁은 레이아웃 (폼, 로그인 등)
<div className={layout.page}>
  <main className={layout.containerNarrow}>
    {/* 폼 컨텐츠 */}
  </main>
</div>
```

**사용 가능한 옵션:**

- `layout.page` - 전체 페이지 (`min-h-screen bg-gray-50`)
- `layout.container` - 표준 컨테이너 (max-width: 7xl)
- `layout.containerNarrow` - 좁은 컨테이너 (max-width: 2xl)
- `layout.containerMedium` - 중간 컨테이너 (max-width: 4xl)
- `layout.section` - 섹션 간격 (space-y-6)
- `layout.sectionLarge` - 큰 섹션 간격 (space-y-8)

---

### 2. Text (텍스트)

일관된 타이포그래피를 제공합니다.

```tsx
// 페이지 제목
<h1 className={text.pageTitle}>시스템 로그</h1>

// 섹션 제목
<h2 className={text.sectionTitle}>사용자 목록</h2>

// 카드 제목
<h3 className={text.cardTitle}>통계</h3>

// 설명 텍스트
<p className={text.description}>이것은 설명입니다</p>

// 본문
<p className={text.body}>일반 본문 텍스트</p>

// 레이블
<label className={text.label}>이름</label>
```

**텍스트 계층:**

- **Primary**: `text.pageTitle`, `text.sectionTitle`, `text.label` (text-gray-900, 강조)
- **Secondary**: `text.body`, `text.secondary` (text-gray-700/900, 일반)
- **Tertiary**: `text.description`, `text.hint`, `text.meta` (text-gray-600, 보조)

**상태별 텍스트:**

```tsx
<p className={text.success}>성공 메시지</p>
<p className={text.error}>에러 메시지</p>
<p className={text.warning}>경고 메시지</p>
<p className={text.info}>정보 메시지</p>
```

---

### 3. Card (카드)

컨텐츠 컨테이너 스타일입니다.

```tsx
import { Card } from '@/components/ui/Card';

// 기본 사용
<Card>
  <h2 className={text.cardTitle}>제목</h2>
  <p>내용</p>
</Card>

// 통계 카드
<div className={card.statBlue}>
  <div className={cn(card.statValue, colors.stat.blue.text)}>123</div>
  <div className={cn(card.statLabel, text.secondary)}>사용자 수</div>
</div>
```

**통계 카드 색상:**

- `card.statBlue` - 파란색
- `card.statGreen` - 녹색
- `card.statPurple` - 보라색
- `card.statPink` - 분홍색
- `card.statYellow` - 노란색

---

### 4. Table (테이블)

데이터 테이블 스타일입니다.

```tsx
<div className={table.container}>
  <table className={table.base}>
    <thead className={table.thead}>
      <tr>
        <th className={table.th}>이름</th>
        <th className={table.th}>이메일</th>
      </tr>
    </thead>
    <tbody className={table.tbody}>
      {data.map((item) => (
        <tr key={item.id} className={table.tr}>
          <td className={table.tdPrimary}>{item.name}</td>
          <td className={table.td}>{item.email}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**셀 타입:**

- `table.td` - 일반 셀 (text-gray-700)
- `table.tdPrimary` - 강조 셀 (text-gray-900 font-medium)
- `table.tdSecondary` - 보조 셀 (text-gray-600)

---

### 5. Form (폼)

입력 요소 스타일입니다.

```tsx
<div className={form.group}>
  <label className={text.label}>이메일</label>
  <input type="email" className={form.input} placeholder="이메일을 입력하세요" />

  <label className={text.label}>메시지</label>
  <textarea className={form.textarea} rows={4} />

  <label className="flex items-center gap-2">
    <input type="checkbox" className={form.checkbox} />
    <span className={text.body}>동의합니다</span>
  </label>
</div>
```

---

### 6. Button (버튼)

버튼 스타일입니다.

```tsx
<button className={cn(button.base, button.primary, button.medium)}>
  저장
</button>

<button className={cn(button.base, button.secondary, button.small)}>
  취소
</button>

<button className={cn(button.base, button.danger)}>
  삭제
</button>
```

---

### 7. Badge (뱃지)

상태 표시용 뱃지입니다.

```tsx
<span className={cn(badge.base, badge.blue)}>활성</span>
<span className={cn(badge.base, badge.green)}>성공</span>
<span className={cn(badge.base, badge.red)}>에러</span>
```

---

### 8. State (상태)

로딩, 에러, 빈 상태를 표시합니다.

```tsx
{loading ? (
  <p className={state.loading}>로딩 중...</p>
) : error ? (
  <p className={state.error}>{error}</p>
) : data.length === 0 ? (
  <p className={state.empty}>데이터가 없습니다</p>
) : (
  // 데이터 표시
)}
```

---

### 9. Grid (그리드)

반응형 그리드 레이아웃입니다.

```tsx
// 2열 그리드
<div className={grid.cols2}>
  <Card>카드 1</Card>
  <Card>카드 2</Card>
</div>

// 4열 그리드 (통계)
<div className={grid.cols4}>
  <div className={card.statBlue}>...</div>
  <div className={card.statGreen}>...</div>
  <div className={card.statPurple}>...</div>
  <div className={card.statPink}>...</div>
</div>
```

---

## 🛠 유틸리티 함수

### `cn()` - 클래스 결합

조건부로 여러 클래스를 결합합니다.

```tsx
// 기본 사용
<div className={cn(text.body, "mt-4")}>텍스트</div>

// 조건부 클래스
<div className={cn(
  text.body,
  isActive && "font-bold",
  hasError && "text-red-600"
)}>
  텍스트
</div>

// 디자인 시스템 + 커스텀 클래스
<div className={cn(card.statBlue, "hover:scale-105 transition")}>
  통계
</div>
```

---

## 📊 실전 예제

### 예제 1: 관리자 페이지

```tsx
import { layout, text, card, table, state } from "@/styles/design-system";

export default function AdminPage() {
  return (
    <div className={layout.page}>
      <main className={layout.container}>
        <div className="mb-6">
          <h1 className={text.pageTitle}>관리자 대시보드</h1>
          <p className={text.description}>시스템 관리 및 모니터링</p>
        </div>

        <div className={grid.cols4}>
          <div className={card.statBlue}>
            <div className={cn(card.statValue, colors.stat.blue.text)}>1,234</div>
            <div className={cn(card.statLabel, text.secondary)}>전체 사용자</div>
          </div>
          {/* 나머지 통계 카드 */}
        </div>

        <Card>
          <h2 className={text.cardTitle}>최근 활동</h2>
          <div className={table.container}>
            <table className={table.base}>{/* 테이블 내용 */}</table>
          </div>
        </Card>
      </main>
    </div>
  );
}
```

### 예제 2: 폼 페이지

```tsx
import { layout, text, form, button, cn } from "@/styles/design-system";

export default function SettingsPage() {
  return (
    <div className={layout.page}>
      <main className={layout.containerNarrow}>
        <h1 className={text.pageTitle}>설정</h1>

        <Card>
          <form className={form.group}>
            <div>
              <label className={text.label}>이름</label>
              <input type="text" className={form.input} />
            </div>

            <div>
              <label className={text.label}>소개</label>
              <textarea className={form.textarea} rows={4} />
            </div>

            <div className="flex gap-2">
              <button type="submit" className={cn(button.base, button.primary)}>
                저장
              </button>
              <button type="button" className={cn(button.base, button.secondary)}>
                취소
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
```

---

## 🎯 스타일 수정 방법

모든 스타일을 한 곳에서 관리하므로, 디자인 변경이 필요할 때 `/src/styles/design-system.ts` 파일만 수정하면 됩니다.

### 예: 페이지 제목 색상 변경

```typescript
// src/styles/design-system.ts
export const text = {
  // 기존
  pageTitle: "text-2xl font-bold text-gray-900",

  // 파란색으로 변경
  pageTitle: "text-2xl font-bold text-blue-900",

  // ...
};
```

이 변경은 `text.pageTitle`을 사용하는 모든 페이지에 자동으로 적용됩니다!

---

## ✅ 모범 사례

1. **항상 디자인 시스템 사용**: 인라인 Tailwind 클래스 대신 디자인 시스템의 상수 사용
2. **커스텀 클래스는 `cn()`으로 결합**: `className={cn(text.body, "custom-class")}`
3. **새로운 패턴 발견 시 추가**: 반복되는 스타일은 디자인 시스템에 추가
4. **시맨틱 네이밍**: 색상보다는 용도 중심 (예: `text.primary` > `text.gray900`)

---

## 🚀 기대 효과

- ✅ **일관성**: 모든 페이지에서 동일한 스타일 적용
- ✅ **유지보수**: 한 곳만 수정하면 전체 적용
- ✅ **생산성**: 매번 클래스 이름 고민할 필요 없음
- ✅ **확장성**: 새로운 스타일 패턴 쉽게 추가
- ✅ **타입 안전성**: TypeScript의 자동완성과 타입 체크

---

## 📚 추가 리소스

- Tailwind CSS 문서: https://tailwindcss.com
- 프로젝트 아키텍처: `/docs/architecture.md`
