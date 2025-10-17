/**
 * Hobeom Portal Design System
 * 프로젝트 전역에서 사용하는 스타일 상수를 정의합니다.
 *
 * 사용법:
 * import { layout, text, card, button } from '@/styles/design-system';
 * <div className={layout.page}>
 *   <h1 className={text.pageTitle}>제목</h1>
 * </div>
 */

/**
 * 레이아웃 스타일
 */
export const layout = {
  // 페이지 전체 컨테이너
  page: "min-h-screen bg-gray-50",

  // 메인 컨텐츠 영역 (표준 너비 제한 + 패딩)
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",

  // 좁은 컨테이너 (폼, 로그인 등)
  containerNarrow: "max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8",

  // 중간 너비 컨테이너
  containerMedium: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",

  // 섹션 간격
  section: "space-y-6",
  sectionLarge: "space-y-8",
} as const;

/**
 * 텍스트 스타일
 */
export const text = {
  // 페이지 제목 (H1)
  pageTitle: "text-2xl font-bold text-gray-900",

  // 섹션 제목 (H2)
  sectionTitle: "text-xl font-bold text-gray-900",

  // 서브 제목 (H3)
  subTitle: "text-lg font-semibold text-gray-900",

  // 카드 제목
  cardTitle: "text-lg font-bold text-gray-900 mb-4",

  // 본문 텍스트
  body: "text-sm text-gray-900",
  bodyMedium: "text-base text-gray-900",
  bodyLarge: "text-lg text-gray-900",

  // 보조 텍스트
  secondary: "text-sm text-gray-700",
  tertiary: "text-sm text-gray-600",

  // 설명/힌트 텍스트
  description: "text-sm text-gray-600 mt-1",
  hint: "text-xs text-gray-600",

  // 메타 정보 (시간, 작성자 등)
  meta: "text-xs text-gray-600",

  // 레이블
  label: "text-sm font-medium text-gray-900",
  labelSecondary: "text-sm font-medium text-gray-700",

  // 상태별 텍스트
  success: "text-green-700 font-medium",
  error: "text-red-700 font-medium",
  warning: "text-yellow-700 font-medium",
  info: "text-blue-700 font-medium",
} as const;

/**
 * 카드 스타일
 */
export const card = {
  // 기본 카드
  base: "bg-white rounded-lg shadow-sm border border-gray-200",

  // 패딩 옵션
  padding: "p-6",
  paddingSmall: "p-4",
  paddingLarge: "p-8",

  // 호버 효과
  hover: "hover:shadow-md transition-shadow",

  // 통계 카드
  statBlue: "bg-blue-50 rounded-lg p-4 text-center border border-blue-200",
  statGreen: "bg-green-50 rounded-lg p-4 text-center border border-green-200",
  statPurple: "bg-purple-50 rounded-lg p-4 text-center border border-purple-200",
  statPink: "bg-pink-50 rounded-lg p-4 text-center border border-pink-200",
  statYellow: "bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200",

  // 통계 카드 내부 텍스트
  statValue: "text-2xl font-bold",
  statLabel: "text-sm font-medium",
} as const;

/**
 * 버튼 스타일
 */
export const button = {
  // 기본 버튼
  base: "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",

  // Primary 버튼
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",

  // Secondary 버튼
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",

  // Danger 버튼
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",

  // Ghost 버튼
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",

  // 크기 옵션
  small: "px-3 py-1.5 text-sm",
  medium: "px-4 py-2 text-base",
  large: "px-6 py-3 text-lg",

  // 비활성화
  disabled: "opacity-50 cursor-not-allowed",
} as const;

/**
 * 폼 요소 스타일
 */
export const form = {
  // 입력 필드
  input: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
  inputError: "border-red-500 focus:ring-red-500",

  // 텍스트 영역
  textarea:
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",

  // 선택 박스
  select: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",

  // 체크박스/라디오
  checkbox: "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
  radio: "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500",

  // 폼 그룹
  group: "space-y-4",

  // 에러 메시지
  errorMessage: "text-sm text-red-600 mt-1",
} as const;

/**
 * 테이블 스타일
 */
export const table = {
  // 테이블 컨테이너
  container: "overflow-x-auto",

  // 테이블 기본
  base: "min-w-full text-sm divide-y divide-gray-200",

  // 헤더
  thead: "bg-gray-100",
  th: "px-4 py-3 text-left font-semibold text-gray-900",

  // 본문
  tbody: "divide-y divide-gray-200 bg-white",
  tr: "hover:bg-gray-50",
  td: "px-4 py-3 text-gray-700",

  // 셀 타입별
  tdPrimary: "px-4 py-3 text-gray-900 font-medium",
  tdSecondary: "px-4 py-3 text-gray-600",
} as const;

/**
 * 뱃지/태그 스타일
 */
export const badge = {
  base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",

  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
} as const;

/**
 * 상태별 스타일
 */
export const state = {
  // 로딩
  loading: "text-center text-gray-600",

  // 에러
  error: "text-center text-red-700 font-medium",

  // 빈 상태
  empty: "text-center text-gray-600",

  // 성공 메시지
  success: "text-green-700 font-medium",
} as const;

/**
 * 그리드 레이아웃
 */
export const grid = {
  // 2열 그리드
  cols2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  cols2Large: "grid grid-cols-1 md:grid-cols-2 gap-6",

  // 3열 그리드
  cols3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  cols3Large: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",

  // 4열 그리드
  cols4: "grid grid-cols-2 md:grid-cols-4 gap-4",
  cols4Large: "grid grid-cols-2 md:grid-cols-4 gap-6",
} as const;

/**
 * 유틸리티 함수: 조건부로 클래스 결합
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * 색상 팔레트 (통계 카드 등에 사용)
 */
export const colors = {
  stat: {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  },
} as const;
