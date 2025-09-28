export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
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
