export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
  lastLogin?: string;      // 로그인 시점
  lastAccess?: string;     // API 호출 시점 (할일 리셋 등에 사용)
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, "passwordHash">;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AppIcon {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG 또는 이미지 URL
  href: string;
  requireAuth: boolean;
  category: "public" | "dashboard" | "admin";
  order: number;
  isActive: boolean;
}

export interface DashboardConfig {
  userId: string;
  activeApps: string[];
  layout: {
    columns: number;
    iconSize: "small" | "medium" | "large";
  };
  customization: {
    theme: "light" | "dark" | "system";
    showCategories: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// Travel Prep App Types
// ============================================

/**
 * 여행 종류 타입 (여행/출장)
 */
export type TravelType = "여행" | "출장";

/**
 * 여행 종류 마스터 데이터
 */
export interface TravelTypeTemplate {
  id: string;
  name: string;
  days: number; // 1-10일
  type: TravelType;
}

/**
 * 준비물 아이템 마스터 데이터
 */
export interface TravelItem {
  id: string;
  name: string;
  width: number; // cm
  height: number; // cm
  depth: number; // cm
  weight: number; // g (그램)
  category: string; // 의류, 전자기기, 세면도구 등
  importance: number; // 1-5 (1: 낮음, 5: 높음)
  isActive: boolean;
}

/**
 * 가방 마스터 데이터
 */
export interface Bag {
  id: string;
  name: string;
  width: number; // cm
  height: number; // cm
  depth: number; // cm
  weight: number; // g (빈 가방 무게)
  isActive: boolean;
}

/**
 * 사용자의 여행 리스트
 */
export interface TripList {
  id: string;
  userId: string;
  travelTypeId?: string; // TravelTypeTemplate 참조 (선택사항)
  startDate?: string;
  name: string;
  days: number;
  type: TravelType;
  createdAt: string;
  lastUsed: string;
}

/**
 * 여행별 준비물/가방 아이템
 */
export interface TripItem {
  id: string;
  tripListId: string;
  itemId: string; // TravelItem.id 또는 Bag.id
  itemType: "item" | "bag";
  bagId?: string; // 어느 가방에 담았는지 (item인 경우만)
  isPrepared: boolean;
  quantity: number; // 아이템 수량 (기본값: 1)
  order: number;
}

/**
 * 가방별 통계 정보
 */
export interface BagStats {
  bagId: string;
  bag: Bag;
  items: (TravelItem & { isPrepared: boolean })[];
  totalWeight: number; // 가방 무게 + 아이템 무게
  totalVolume: number; // 사용중인 부피
  saturation: number; // 포화도 (%)
}

/**
 * 여행 준비물 필터 옵션
 */
export interface TripItemFilter {
  bagId?: string | "unassigned" | "all";
  importance?: number | "all";
  category?: string | "all";
  isPrepared?: boolean | "all";
}

// ============================================
// Daily Tasks Types
// ============================================

/**
 * 일일 할일 아이템
 */
export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  importance: number; // 1-3 (1: 낮음, 3: 높음)
  isActive: boolean;
  createdAt: string;
  displayOrder: number; // 표시 순서
}

/**
 * 일일 할일 완료 로그
 */
export interface DailyTaskLog {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt: string | null;
}

/**
 * 일일 통계
 */
export interface DailyStat {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // 0-100
  createdAt: string;
}

/**
 * 할일 + 완료 상태
 */
export interface DailyTaskWithStatus extends DailyTask {
  isCompleted: boolean;
  completedAt?: string;
}

/**
 * 사용자별 할일 현황 (관리자용)
 */
export interface UserDailyStatus {
  userId: string;
  username: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasks: DailyTaskWithStatus[];
}

// ============================================
// User Settings Types
// ============================================

/**
 * 사용자 설정
 */
export interface UserSetting {
  id: string;
  userId: string;
  category: "display" | "daily_tasks" | "notifications" | "system";
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * 설정 구성
 */
export interface SettingsConfig {
  display: {
    dashboardColumns: number;
    cardSize: "small" | "medium" | "large";
    language: "ko" | "en";
  };
  dailyTasks: {
    resetTime: string;
    excludeWeekends: boolean;
    statsPeriod: number;
    completionGoal: number;
  };
  notifications: {
    dailyTasksEnabled: boolean;
    travelPrepEnabled: boolean;
    emailEnabled: boolean;
  };
}

/**
 * 사용자별 앱 설정
 */
export interface UserAppSetting {
  id: string;
  userId: string;
  appId: string;
  isVisible: boolean;
  customOrder: number;
  category: "public" | "dashboard" | "admin";
}

/**
 * 활동 로그
 */
export interface ActivityLog {
  id: string;
  userId: string;
  actionType: string;
  actionDescription: string;
  createdAt: string;
  appId?: string;
}
