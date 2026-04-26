# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bash scripts/init.sh          # First-time setup: copies data/*.sample.csv → data/*.csv (real CSVs are gitignored)
node scripts/generate-vapid-keys.js  # Generate VAPID keys for web push (write into .env.local)

npm run dev                   # Concurrent: next dev (Turbopack, port 3000) + push-scheduler (nodemon)
npm run dev:next              # Next dev only
npm run dev:push              # Push scheduler only
npm run build                 # next build --turbopack (Turbopack required by package.json scripts)
npm start                     # Concurrent: next start -p 3002 + push-scheduler
npm run lint                  # eslint
```

No test runner is configured in this project.

User-facing strings, commit messages, and API `message` fields are written in Korean — match that convention when adding to existing files.

## Architecture

Next.js 16 App Router + React 19 + TypeScript (strict). Tailwind v4 via `@tailwindcss/postcss`. Path alias `@/*` → `src/*`.

### Three persistence layers (intentional, do not unify blindly)

1. **CSV files in `data/`** — primary store for users, apps, settings, travel-prep, daily-tasks, push subscriptions, praise system, activity logs. Accessed only through `src/lib/data.ts` (`readCSV`, `writeCSV`, `ensureDataFile`). `ensureDataFile` auto-copies `*.sample.csv` → `*.csv` on first read, so missing real CSVs self-heal in dev.
2. **SQLite `data/cafe.db`** (better-sqlite3, WAL mode) — only the `/cafe` board (posts, comments). Schema is created on import in `src/lib/db.ts`; access via `getDB()`.
3. **Google Sheets** — only the growth-records app (`/dashboard/growth-records`). Lives behind `src/lib/sheets/` (`client.ts` for the Service Account auth, `growthAdapter.ts` for read/append/update/delete with dynamic Korean header → internal key mapping). Sheets is the SoT for that domain; no CSV mirror. Tabs `설정` (자녀 프로필 1행) and `기록` (측정 시계열).

When adding a feature, follow the existing layer for the domain; don't move CSV-backed data into SQLite or Sheets (or vice versa) without explicit reason.

### Auth & API conventions

- JWT signed with `JWT_SECRET`, 7-day expiry. Cookie name `hobeom-portal-token`. Stored client-side via `src/lib/cookies.ts`, exposed app-wide through `AuthContext` (`src/contexts/AuthContext.tsx`).
- API routes must use the helpers in [src/lib/apiHelpers.ts](src/lib/apiHelpers.ts):
  - `requireAuth(request)` / `requireAdmin(request)` — return `{decoded, response}`; if `response` is non-null, return it immediately.
  - `successResponse(message, data?, status?)` / `errorResponse(message, status?)` — enforce the `{success, message, data?}` shape. Messages are Korean.
  - `withErrorHandler(handler)` — try/catch wrapper used to standardize 500 handling.
  - Token is read from `Authorization: Bearer …` header *or* the `hobeom-portal-token` cookie (handled by `extractUser`).
- Client routes use `<ProtectedRoute requiredRole="admin">` from `src/components/common/`.

### App registry

The home page and dashboard render app tiles from `data/apps.csv` (id, name, icon, href, require_auth, category=`public|dashboard|admin`, order, is_active). Adding a new app means: row in `apps.csv` + route under `src/app/(samples|dashboard|dashboard/admin)/<name>/` + (optional) API under `src/app/api/<name>/`. Toggling `is_active` hides without deleting.

### Web Push system

Push delivery is split between Next.js (subscription management) and a **separate Node process** (`scripts/push-scheduler.js`, node-cron) that polls CSVs and sends notifications. Both `npm run dev` and `npm start` launch the scheduler alongside Next via `concurrently`. The scheduler reads `.env.local` directly (not Next's env loader) — VAPID keys must live there. Service Worker is `public/sw.js`. Subscriptions live in `data/subscriptions.csv`, keyed by `(user_id, endpoint)` so one user can have multiple devices.

### Design system

Use `src/styles/design-system.ts` constants (`layout`, `text`, `card`, `button`, `table`, `cn`) instead of writing raw Tailwind classes for common patterns — it's the project-wide source of truth for spacing, color, and typography. Composing with `cn(card.statBlue, "extra-class")` is the expected pattern.

### Ports & environments

- Dev: 3000 (`NODE_ENV=development next dev --turbopack`).
- Prod: 3002 (`next start -p 3002`). Deployment uses PM2 (see README); `ecosystem.config.js` is referenced but not committed.
- `next.config.ts` whitelists `test.everyx.net` as a dev origin.

### Environment variables (`.env.local`)

| Variable | Used by | Notes |
| -------- | ------- | ----- |
| `JWT_SECRET` | auth | required in prod |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | web push | scheduler reads `.env.local` directly |
| `GOOGLE_SHEETS_ID` | growth-records | spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | growth-records | Service Account JSON as a single line; `private_key` newlines may stay as `\n` |

### ESLint posture

Project deliberately downgrades several rules from error to warning (`@typescript-eslint/no-explicit-any`, `no-unused-vars`, `react-hooks/exhaustive-deps`, `react-hooks/immutability`, `react-hooks/set-state-in-effect`). Don't "fix" warnings unrelated to your change just to clean them up.

## Per-feature docs

Feature-level READMEs live alongside the code (e.g. [src/app/dashboard/travel-prep/README.md](src/app/dashboard/travel-prep/README.md), [src/app/dashboard/users/README.md](src/app/dashboard/users/README.md), [src/app/dashboard/csv-editor/README.md](src/app/dashboard/csv-editor/README.md), [src/app/dashboard/growth-records/README.md](src/app/dashboard/growth-records/README.md), [src/app/dashboard/admin/push-test/README.md](src/app/dashboard/admin/push-test/README.md)). Cross-cutting docs are in [docs/](docs/) — [architecture.md](docs/architecture.md) is the most detailed reference for the push pipeline and data layer.
