# Copilot Instructions for Hobeom Portal

## Project Overview

**Korean web portal platform** (Next.js 15 + React 19 + TypeScript) providing public sample apps and role-based dashboard features. Uses **CSV-based data storage** with JWT authentication.

## Tech Stack

- **Next.js 15.5.4** App Router + **Turbopack** (MANDATORY `--turbopack` flag in all npm scripts)
- **React 19** with client-side AuthContext pattern
- **Auth**: JWT (`jsonwebtoken`) + bcrypt, stored in cookies (`js-cookie`)
- **Data**: CSV files (`csv-parser`, `papaparse`) with auto-initialization from `*.sample.csv`
- **UI**: Tailwind CSS v4 + custom components in `src/components/ui/`

## Architecture Patterns

### 1. Three-Layer Auth System

**Layer 1: Global State** (`src/contexts/AuthContext.tsx`)

```tsx
const { user, isAuthenticated, isLoading, login, logout } = useAuth();
// Auto-verifies token on mount via /api/auth/verify
// ALWAYS check isLoading before conditional rendering to prevent auth flash
```

**Layer 2: Route Protection** (`src/components/ProtectedRoute.tsx`)

```tsx
<ProtectedRoute requiredRole="admin">
  {" "}
  // Optional role check
  <YourComponent />
</ProtectedRoute>
// Failed auth → redirects to `/`, insufficient role → redirects to `/dashboard`
```

**Layer 3: API Verification** (in API routes)

```tsx
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const decoded = verifyToken(token); // null if invalid/expired
if (!decoded) return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });
```

**Critical Auth Rules:**

- Tokens stored in **cookies** (NOT localStorage) via `cookieUtils` (`src/lib/cookies.ts`)
- Keys: `hobeom-portal-token`, `hobeom-portal-user` (7-day expiry, sameSite: strict)
- JWT_SECRET fallback: `"your-secret-key-change-in-production"` (line 4 of `src/lib/auth.ts`)
- Login updates `last_login` timestamp in users.csv automatically

### 2. CSV Data Layer (File-Based Persistence)

**All data ops through `src/lib/data.ts`:**

```tsx
import { readCSV, writeCSV, getUsers, getUserByUsername } from "@/lib/data";

// Auto-init: Missing CSVs copied from *.sample.csv on first readCSV() call
await ensureDataFile("users.csv"); // Creates from users.sample.csv if missing
```

**CSV Schema Examples:**

```
data/apps.csv: id,name,description,icon,href,require_auth,category,order,is_active
data/users.csv: id,username,email,name,role,created_at,last_login,password_hash
```

**Critical Rules:**

- Headers MUST match TypeScript interfaces in `src/types/index.ts`
- `writeCSV()` uses manual serialization (escapes commas with quotes)
- Data dir: `/data/` at project root, NOT `src/data/`
- `.sample.csv` files = schema templates + seed data (tracked in git)
- Actual `.csv` files ignored by git (created at runtime)

**Batch Operations Pattern** (avoid CSV race conditions):

```tsx
// WRONG: N separate writes = data corruption risk
for (item of items) await addTripItem(item); // ❌

// RIGHT: Single atomic write
await addTripItemsBatch(tripListId, items); // ✅
// See: addTripItemsBatch, deleteTripItemsBatch, updateTripItemsBagBatch in data.ts
```

### 3. API Response Standard (Mandatory Format)

**ALL API routes MUST return:**

```tsx
interface ApiResponse {
  success: boolean;
  message: string; // ALWAYS Korean
  data?: any;
}

// Template:
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token || "");
    if (!decoded) return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });

    // ... business logic ...
    return NextResponse.json({ success: true, message: "성공", data });
  } catch (error) {
    return NextResponse.json({ success: false, message: "오류 발생" }, { status: 500 });
  }
}
```

**Key API Endpoints:**

- `POST /api/auth/login` - Returns `{success, message, user, token}`
- `POST /api/auth/verify` - Validates JWT
- `GET /api/apps?category=public|dashboard|admin` - App list
- `GET /api/users` - Admin only
- `POST /api/travel-prep/trip-items/batch` - Batch add items (see CSV batch pattern)

## Development Workflows

### Critical Commands (Turbopack Mandatory)

```bash
npm run dev     # Uses --turbopack flag (see package.json scripts)
npm run build   # Production build with Turbopack (also uses --turbopack)
npm run lint    # ESLint with flat config (eslint.config.mjs)
```

### Data Initialization

```bash
bash scripts/init-dev.sh  # Copies *.sample.csv → *.csv files
# OR auto-init happens on first readCSV() call (ensureDataFile in data.ts)
```

### Adding New Apps (5 Steps)

1. Add to `data/apps.csv`: `id,name,description,icon,href,require_auth,category,order,is_active`
2. Create route: `src/app/{samples|dashboard}/[app-name]/page.tsx`
3. Dashboard apps: wrap with `<ProtectedRoute requiredRole="admin">` if admin-only
4. Add data functions to `src/lib/data.ts` if needed
5. Test with test accounts: `admin/password`, `user1/password`

## App Categories & Storage Patterns

### Public Apps (`/samples/*`)

- No auth required, localStorage-based
- Example: notepad uses `localStorage.getItem("hobeom-portal-notepad-notes")`
- CSV: `require_auth: false, category: public`

### Dashboard Apps (`/dashboard/*`)

- Auth required, wrap with `<ProtectedRoute>`
- Server-side CSV data via API routes
- Example: travel-prep fetches from `/api/travel-prep/*`
- CSV: `require_auth: true, category: dashboard`

### Admin Apps

- Admin role required: `<ProtectedRoute requiredRole="admin">`
- Double-check role in API routes too
- Example: `/dashboard/users` checks `decoded.role === "admin"` in API
- CSV: `category: admin`
- **CSV Editor App**: Excel-like spreadsheet for editing data files directly

## Component Patterns

### Accordion/Grouping Pattern (New in v0.3.0)

**Used in:** travel-prep items, travel-prep main screen

```tsx
// State: groupBy mode + collapsed groups tracking
const [groupBy, setGroupBy] = useState<"none" | "category" | "importance">("none");
const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

// Initialize all groups as collapsed when groupBy changes
useEffect(() => {
  if (groupBy !== "none") {
    const timer = setTimeout(() => {
      const allGroupKeys = Object.keys(groupedItems);
      if (allGroupKeys.length > 0) {
        setCollapsedGroups(new Set(allGroupKeys));
      }
    }, 0);
    return () => clearTimeout(timer);
  }
}, [groupBy]);

// Toggle individual group
const toggleGroup = (groupName: string) => {
  const newCollapsed = new Set(collapsedGroups);
  if (newCollapsed.has(groupName)) {
    newCollapsed.delete(groupName);
  } else {
    newCollapsed.add(groupName);
  }
  setCollapsedGroups(newCollapsed);
};

// Group items by key
const groupedItems: { [key: string]: ItemType[] } = {};
if (groupBy === "category") {
  items.forEach((item) => {
    const key = item.category || "기타";
    if (!groupedItems[key]) groupedItems[key] = [];
    groupedItems[key].push(item);
  });
}

// Render accordion
{
  Object.keys(groupedItems).map((groupName) => (
    <div key={groupName}>
      <button onClick={() => toggleGroup(groupName)}>
        <span className={`transform ${collapsedGroups.has(groupName) ? "" : "rotate-90"}`}>▶</span>
        {groupName}
      </button>
      {!collapsedGroups.has(groupName) && (
        <div>
          {groupedItems[groupName].map((item) => (
            <ItemCard {...item} />
          ))}
        </div>
      )}
    </div>
  ));
}
```

**Key Features:**

- `Set<string>` for O(1) collapse state lookup
- `setTimeout` in useEffect prevents timing issues with groupedItems calculation
- Group selection buttons with stopPropagation to prevent toggle
- Importance sorting order: 매우중요 → 중요 → 보통 → 낮음 → 선택

### Spreadsheet Pattern (CSV Editor)

**Location:** `src/app/dashboard/csv-editor/components/Spreadsheet.tsx`

```tsx
// Dual-mode interaction: click=select, double-click=edit
const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

// Column management
const [columnWidths, setColumnWidths] = useState<number[]>(() => headers.map(() => 100));
const [sortState, setSortState] = useState<{ col: number; direction: "asc" | "desc" } | null>(null);

// Click: select only
const handleCellClick = (row: number, col: number) => {
  setSelectedCell({ row, col });
  setEditingCell(null);
};

// Double-click: enter edit mode
const handleCellDoubleClick = (row: number, col: number) => {
  setSelectedCell({ row, col });
  setEditingCell({ row, col });
  setEditValue(data[row][headers[col]] || "");
};

// Keyboard navigation in edit mode
const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    // Save and move down (or up if Shift)
  } else if (e.key === "Tab") {
    // Save and move right (or left if Shift)
  } else if (e.key === "Escape") {
    // Cancel edit
  }
};

// Keyboard navigation in select mode (table with tabIndex={0})
const handleTableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (!selectedCell || editingCell) return;
  if (e.key === "Enter") {
    // Enter edit mode
  } else if (e.key === "ArrowUp/Down/Left/Right") {
    // Move selection
  }
};
```

**Key Features:**

- Auto-backup on save (`.backup` suffix)
- Column resizing via drag handles
- Click header to sort (asc ↔ desc)
- Numeric vs string sorting detection
- Tab wraps to next row

### UI Components (`src/components/ui/`)

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string; // Tailwind override
  padding?: "sm" | "md" | "lg";
}
```

### Layout Structure

```tsx
// Root wraps with AuthProvider (src/app/layout.tsx)
<AuthProvider>{children}</AuthProvider>

// Dashboard pages include header
<DashboardHeader />  // User info + logout
```

### Loading States

```tsx
// Check isLoading before rendering to prevent auth flash
if (isLoading) return <LoadingSpinner />;
if (!isAuthenticated) return null; // Let redirect happen
```

## Data Flows

### App Discovery (4 Steps)

1. `data/apps.csv` defines apps
2. Page fetches via `/api/apps?category=X`
3. `AppIconGrid` renders
4. Click → navigate to `href`

### Session (Cookie-Based)

```tsx
import { cookieUtils } from "@/lib/cookies";
cookieUtils.setToken(token); // 7d expiry
cookieUtils.getToken();
cookieUtils.clearAll(); // Logout
// AuthContext auto-verifies on mount
```

## Korean Localization

- All UI text, messages, errors in Korean
- Test accounts (password: `password`):
  - `admin` - Full access
  - `user1`, `demo` - Dashboard only

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

## Common Pitfalls

1. **Missing `--turbopack`**: Check package.json scripts
2. **CSV not found**: Run `scripts/init-dev.sh` or let auto-init create it
3. **Auth redirect loop**: Always check `isLoading` before redirecting
4. **Wrong API format**: Must return `{success, message, data}`
5. **Batch ops**: Use `addTripItemsBatch` not loop of single writes
