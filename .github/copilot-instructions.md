# Copilot Instructions for Hobeom Portal

## Project Overview

This is a **Korean web portal platform** built with **Next.js 15**, **React 19**, and **TypeScript**. It provides public sample apps and protected dashboard features with role-based authentication (user/admin). The architecture uses **CSV-based data storage** for simplicity and **JWT authentication** with client-side session management.

## Tech Stack & Key Dependencies

- **Next.js 15.5.4** with App Router and **Turbopack** (`--turbopack` flag MANDATORY - configured in package.json)
- **React 19** with client-side auth context pattern (`src/contexts/AuthContext.tsx`)
- **Authentication**: JWT tokens with `bcryptjs`, stored in cookies via `js-cookie`
- **Data Layer**: CSV files (`csv-parser`, `papaparse`) in `/data/` directory with auto-initialization from `*.sample.csv`
- **UI**: Tailwind CSS v4 with custom component library in `src/components/ui/`

## Critical Architecture Patterns

### 1. Authentication Flow (3-Layer Pattern)

```tsx
// Layer 1: Global auth state via AuthContext (src/contexts/AuthContext.tsx)
const { user, isAuthenticated, isLoading, login, logout } = useAuth();

// Layer 2: ProtectedRoute wrapper for auth-required pages (src/components/ProtectedRoute.tsx)
<ProtectedRoute requiredRole="admin">
  {" "}
  // Optional role enforcement
  <AdminContent />
</ProtectedRoute>;

// Layer 3: API route JWT verification (src/lib/auth.ts)
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const decoded = verifyToken(token); // Returns decoded payload or null
```

**Key Implementation Details:**

- Auth state checks happen in `useEffect` with `isLoading` guard to prevent flash of wrong content
- Tokens stored in cookies (NOT localStorage) via `cookieUtils` from `src/lib/cookies.ts`
- JWT_SECRET defaults to fallback string if `process.env.JWT_SECRET` not set (see `src/lib/auth.ts:4`)
- Failed auth redirects to `/` (landing page), insufficient permissions redirect to `/dashboard`

### 2. CSV Data Management Pattern (File-Based Persistence)

```tsx
// All data operations through src/lib/data.ts
import { readCSV, writeCSV, getUsers, getUserByUsername } from "@/lib/data";

// Auto-initialization: Missing CSV files copied from *.sample.csv on first read
// Example: data/users.csv created from data/users.sample.csv automatically

// App configuration in data/apps.csv with schema:
// id,name,description,icon,href,require_auth,category,order,is_active
// category: "public" | "dashboard" | "admin"
```

**Critical CSV Rules:**

- CSV files must have headers matching TypeScript interfaces in `src/types/index.ts`
- Writing CSV uses manual serialization (NOT external library) - see `writeCSV()` in `src/lib/data.ts`
- Data directory is at project root (`/data/`), NOT in `src/`
- Sample files (`.sample.csv`) serve as schema templates and initial seed data

### 3. API Route Standardization (Mandatory Response Format)

```tsx
// ALL API routes return ApiResponse interface (src/types/index.ts)
interface ApiResponse {
  success: boolean;
  message: string; // ALWAYS in Korean
  data?: any;
}

// Example implementation pattern:
export async function POST(request: NextRequest) {
  try {
    // ... logic ...
    return NextResponse.json({ success: true, message: "성공", data });
  } catch (error) {
    return NextResponse.json({ success: false, message: "오류 발생" }, { status: 500 });
  }
}
```

**Active API Endpoints:**

- `POST /api/auth/login` - JWT token generation, updates `last_login` in CSV
- `POST /api/auth/verify` - Token validation
- `GET /api/apps?category={public|dashboard|admin}` - App list by category
- `GET /api/users` - User management (admin only)
- `PUT /api/users/[id]` - Update user data

## Development Workflows

### Critical Commands (Turbopack Mandatory)

```bash
npm run dev     # Uses --turbopack flag (see package.json scripts)
npm run build   # Production build with Turbopack (also uses --turbopack)
npm run lint    # ESLint with flat config (eslint.config.mjs)
```

### Data Initialization Workflow

```bash
# Run initialization script to copy sample CSV files
bash scripts/init-dev.sh  # Creates data/*.csv from *.sample.csv files

# Or let auto-initialization happen on first API call
# (see ensureDataFile() in src/lib/data.ts)
```

### Adding New Apps (5-Step Process)

1. Add entry to `data/apps.csv` with unique ID and proper category
2. Create route file at `src/app/{samples|dashboard}/[app-name]/page.tsx`
3. For dashboard apps: wrap page content with `<ProtectedRoute>`
4. Update `src/lib/data.ts` if custom data operations needed
5. Test with appropriate user role (public/user/admin)

## App Categories & Storage Patterns

### Public Apps (`/samples/*` routes)

- **No authentication required**
- Client-side only with localStorage persistence
- Example: `src/app/samples/notepad/page.tsx` uses `localStorage.getItem("notepad-notes")`
- Must be marked `require_auth: false, category: public` in CSV

### Dashboard Apps (`/dashboard/*` routes)

- **Require authentication** - wrapped with `<ProtectedRoute>`
- Can use API routes for server-side data (CSV or future DB)
- Example: `src/app/dashboard/users/page.tsx` fetches from `/api/users`
- Must be marked `require_auth: true, category: dashboard` in CSV

### Admin Tools

- **Require `role: "admin"`** - wrapped with `<ProtectedRoute requiredRole="admin">`
- Extra layer of role validation at API level
- Example: User management in `/dashboard/users` checks role in API route
- Must be marked `category: admin` in CSV

## Component & Styling Conventions

### UI Component Pattern (src/components/ui/)

```tsx
// Consistent prop interfaces with className overrides for Tailwind
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg"; // Standardized size variants
}
// Usage: <Card padding="lg" className="bg-blue-50">
```

### Layout Structure (Critical Pattern)

```tsx
// Root layout wraps entire app with AuthProvider (src/app/layout.tsx)
<html lang="ko">
  <body>
    <AuthProvider>{children}</AuthProvider>
  </body>
</html>

// Dashboard pages should include DashboardHeader component
<DashboardHeader /> // Shows user info, logout button
```

### Loading & Error States

```tsx
// Standard loading pattern with isLoading state
{
  isLoading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />;
}

// Protected routes show Korean loading message during auth check
// See ProtectedRoute.tsx for reference implementation
```

## Data Flow & Integration Points

### App Discovery Flow (4-Step Pattern)

1. `data/apps.csv` defines all available apps with metadata
2. Root page (`src/app/page.tsx`) or dashboard fetches via `/api/apps?category=X`
3. `AppIconGrid` component (`src/components/AppIconGrid.tsx`) renders grid
4. Click navigates to `href` from CSV, Next.js App Router handles routing

### Session Management (Cookie-Based)

```tsx
// All cookie operations through cookieUtils (src/lib/cookies.ts)
import { cookieUtils } from "@/lib/cookies";

// Storage keys: "hobeom-portal-token" and "hobeom-portal-user"
cookieUtils.setToken(token); // 7-day expiry, sameSite: "strict"
cookieUtils.getToken(); // Returns string | undefined
cookieUtils.clearAll(); // Logout cleanup

// AuthContext automatically verifies token on mount via /api/auth/verify
```

## Korean Localization Requirements

- **All user-facing text MUST be in Korean**: UI labels, error messages, API responses
- **Date formatting**: Use Korean locale for date displays
- **Test accounts** (all with password "password"):
  - `admin` - Admin role, full access
  - `user1` - User role, dashboard access
  - `demo` - User role, demo account

## File Structure & Naming Conventions

```
src/
├── app/
│   ├── api/              # API routes (.ts files, NOT .tsx)
│   ├── samples/          # Public apps (no auth)
│   ├── dashboard/        # Protected apps (auth required)
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI primitives (Button, Card, Input)
│   ├── AppIconGrid.tsx   # Main app grid component
│   └── ProtectedRoute.tsx # Auth wrapper HOC
├── contexts/
│   └── AuthContext.tsx   # Global auth state provider
├── lib/
│   ├── auth.ts           # JWT utilities (generateToken, verifyToken)
│   ├── cookies.ts        # Cookie management utilities
│   └── data.ts           # CSV read/write operations
└── types/
    └── index.ts          # Centralized TypeScript types

data/                     # Project root (NOT in src/)
├── users.csv             # User data with passwordHash
├── users.sample.csv      # Seed template for users
└── apps.csv              # App metadata and configuration
```

## Environment Variables

```bash
# Optional - defaults to fallback if not set
JWT_SECRET=your-secret-key-change-in-production  # Used in src/lib/auth.ts
NODE_ENV=production  # Affects cookie secure flag in src/lib/cookies.ts
```

## Common Pitfalls & Solutions

1. **Turbopack flag missing**: Build fails → Always use `--turbopack` (check package.json scripts)
2. **CSV file not found**: First run → Use `scripts/init-dev.sh` OR let auto-init create from sample
3. **Auth redirect loop**: Check `isLoading` state before redirecting in useEffect
4. **Korean text missing**: All messages must be in Korean per project conventions
5. **API response format**: Always return `{ success, message, data }` structure
