# Copilot Instructions for Hobeom Portal

## Project Overview

This is a **Korean web portal platform** built with **Next.js 15**, **React 19**, and **TypeScript**. It provides public sample apps and protected dashboard features with role-based authentication (user/admin). The architecture uses **CSV-based data storage** for simplicity and **JWT authentication** with client-side session management.

## Tech Stack & Key Dependencies

- **Next.js 15.5.4** with App Router and **Turbopack** (`--turbopack` flag required)
- **React 19** with client-side auth context pattern
- **Authentication**: JWT tokens with `bcryptjs`, stored in cookies via `js-cookie`
- **Data Layer**: CSV files (`csv-parser`, `papaparse`) in `/data/` directory
- **UI**: Tailwind CSS v4 with custom component library in `src/components/ui/`

## Critical Architecture Patterns

### Authentication Flow (Essential Pattern)

```tsx
// 1. AuthContext provides global auth state (src/contexts/AuthContext.tsx)
const { user, isAuthenticated, login, logout } = useAuth();

// 2. ProtectedRoute wrapper for auth-required pages (src/components/ProtectedRoute.tsx)
<ProtectedRoute requiredRole="admin">
  {" "}
  // Optional role enforcement
  <AdminContent />
</ProtectedRoute>;

// 3. API routes use JWT verification (src/lib/auth.ts)
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

### CSV Data Management Pattern

```tsx
// All data operations go through src/lib/data.ts
export async function readCSV<T>(filename: string): Promise<T[]>;
export async function writeCSV<T>(filename: string, data: T[]): Promise<void>;

// App configuration stored in data/apps.csv with categories: public|dashboard|admin
// User data in data/users.csv with role-based access control
```

### API Route Structure (Critical Pattern)

```tsx
// All API routes return standardized responses (src/types/index.ts)
interface ApiResponse {
  success: boolean;
  message: string; // Always in Korean
  data?: any;
}

// Authentication endpoints:
// POST /api/auth/login - JWT token generation
// POST /api/auth/verify - Token validation
// GET /api/apps?category=public|dashboard|admin - App list by category
```

## Development Commands & Workflows

```bash
npm run dev     # MUST use --turbopack flag (configured in package.json)
npm run build   # Production build with Turbopack
npm run lint    # ESLint with flat config format
```

### Sample Apps vs Dashboard Apps

- **Public apps** (`/samples/*`): No auth required, stored in localStorage
- **Dashboard apps** (`/dashboard/*`): Require authentication, protected routes
- **Admin tools**: Require `role: "admin"`, extra protection layer

## Component & Styling Conventions

### UI Component Pattern (src/components/ui/)

```tsx
// Consistent prop interfaces with className overrides
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg"; // Standardized size variants
}
// Usage: <Card padding="lg" className="custom-classes">
```

### Responsive & Accessibility

- Korean text content throughout (error messages, UI labels)
- Loading states with spinner animations
- Error boundaries for auth failures
- Mobile-first responsive design with Tailwind classes

## Data Flow & Integration Points

### App Discovery Pattern

1. Apps defined in `data/apps.csv` with metadata (category, auth, order)
2. `AppIconGrid` component fetches via `/api/apps?category=X`
3. Dynamic routing based on `href` field in CSV
4. Role-based filtering happens at API level

### Session Management

- JWT tokens stored in cookies (not localStorage for security)
- Auth state persists across page reloads via `AuthContext`
- Automatic token verification on app startup
- Cookie utilities in `src/lib/cookies.ts` handle all storage operations

## Korean Localization Requirements

- All user-facing text in Korean (UI, error messages, API responses)
- Korean-specific date formatting and validation patterns
- Default test users: admin/admin, user1/user1, demo/demo (all password: "password")

## File Structure Rules

- API routes: `src/app/api/` with TypeScript `.ts` extension
- Pages: `src/app/` with `.tsx` for React components
- Utilities: `src/lib/` for shared business logic
- Types: Centralized in `src/types/index.ts`
- Data: CSV files in project root `/data/` directory
