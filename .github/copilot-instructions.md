# Copilot Instructions for Hobeom Portal

## Project Overview

**Korean web portal platform** (Next.js 15 + React 19 + TypeScript) providing public sample apps and role-based dashboard features. Uses **CSV-based data storage** with JWT authentication.

**Version:** v0.4.0 (Refactored Architecture)

## Tech Stack

- **Next.js 15.5.4** App Router + **Turbopack** (MANDATORY `--turbopack` flag in all npm scripts)
- **React 19** with client-side AuthContext pattern
- **Auth**: JWT (`jsonwebtoken`) + bcrypt, stored in cookies (`js-cookie`)
- **Data**: CSV files (`csv-parser`, `papaparse`) with auto-initialization from `*.sample.csv`
- **UI**: Tailwind CSS v4 + custom components in `src/components/ui/`

## Architecture Patterns

```markdown
# Copilot instructions — Hobeom Portal (concise)

This file contains the repo-specific rules and examples an AI coding agent needs to be productive.

- Stack: Next.js 15 (App Router, Turbopack), React 19 + TypeScript. All dev/build scripts use `--turbopack` (see `package.json`).
- Data: CSV-backed storage in project root `data/`. Committed `*.sample.csv` files are used to initialize missing runtime CSVs via `src/lib/data.ts:ensureDataFile`.
- Auth: JWT + bcrypt. Tokens and user object are stored in cookies (`hobeom-portal-token`, `hobeom-portal-user`, 7d, SameSite=Strict). Default secret: `your-secret-key-change-in-production` (override with `JWT_SECRET`).

Key conventions and examples

- API response shape: { success: boolean, message: string (Korean), data?: any }. Use helpers in `src/lib/apiHelpers.ts` (`successResponse`, `errorResponse`, `withErrorHandler`).
- Auth flow: client `src/contexts/AuthContext.tsx` calls `/api/auth/verify` on mount. Guard UI by checking `isLoading` before rendering protected content.
- Route & API protection: UI wrapper `ProtectedRoute` for client routes; server helpers `requireAuth` / `requireAdmin` in `src/lib/apiHelpers.ts` for API routes.
- CSV I/O: Always go through `src/lib/data.ts` (readCSV/writeCSV). CSV headers must match `src/types/index.ts`. Prefer batch writes (write whole file) to avoid corruption.

Developer workflows (concrete)

- Initialize dev CSVs: `bash scripts/init-dev.sh` (copies `*.sample.csv` to `data/`).
- Run dev: `npm run dev` (starts Next with Turbopack and push scheduler via `nodemon`).
- Generate VAPID keys for push: `node scripts/generate-vapid-keys.js`.
- Run push scheduler standalone: `npm run push-scheduler` or `node scripts/push-scheduler.js`.

Files and locations to consult (quick map)

- API helpers: `src/lib/apiHelpers.ts` (response shapes, requireAuth/requireAdmin, extractUser).
- CSV/data layer: `src/lib/data.ts` (ensureDataFile, readCSV, writeCSV, mapping helpers).
- Auth provider: `src/contexts/AuthContext.tsx` (login/logout/checkAuth patterns, cookie usage).
- Types: `src/types/index.ts` (CSV TypeScript contracts).
- Common UI: `src/components/common/` (ProtectedRoute, LoadingSpinner, ErrorMessage).

Pitfalls & rules to enforce automatically

- Always include `--turbopack` for Next.js dev/build commands.
- Do not write CSV rows piecemeal; always use the writeCSV batch helpers.
- API messages are in Korean; preserve existing wording when modifying responses.
- Avoid changing cookie keys or token formats unless updating `src/lib/auth.ts` and `src/contexts/AuthContext.tsx` together.

If anything here is unclear or you need more examples (API route patterns, CSV headers, or common tests), tell me which area and I will expand with targeted snippets.
```
