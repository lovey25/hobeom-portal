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

### 1. Three-Layer Auth System

**Layer 1: Global State** (`src/contexts/AuthContext.tsx`)
# Copilot instructions — concise reference

This file is a short, actionable reference of project rules and patterns. Full examples remain in the codebase.

## Overview
- Stack: Next.js 15 (App Router) + React 19 + TypeScript
- Data: CSV-backed storage under `data/` with `.sample.csv` seeds
- Auth: JWT + bcrypt; tokens stored in cookies

## Core rules (must-know)
- Turbopack: All dev/build scripts include `--turbopack` (see `package.json` scripts)
- Data files: runtime CSVs live at project root `data/`. `.sample.csv` files are committed; actual `.csv` are created at runtime.
- API response standard: { success: boolean, message: string (Korean), data?: any }
- Cookie keys: `hobeom-portal-token`, `hobeom-portal-user` — 7d expiry, SameSite=Strict
- Default JWT secret: `your-secret-key-change-in-production` (override with `JWT_SECRET` env)

## Architecture (3-layer summary)
- Layer 1 — Global auth state: `src/contexts/AuthContext.tsx` verifies token on mount via `/api/auth/verify`. Always check `isLoading` before conditional rendering to prevent auth flash.
- Layer 2 — Route protection: UI wrapper `ProtectedRoute` enforces role-based access and redirects.
- Layer 3 — API-level checks: use helpers in `src/lib/apiHelpers.ts` (`requireAuth`, `requireAdmin`, `successResponse`, `errorResponse`).

## CSV data guidelines
- Use `src/lib/data.ts` for all CSV reads/writes. Missing `.csv` files are auto-created from `.sample.csv` via `ensureDataFile`.
- CSV headers must match TypeScript interfaces in `src/types/index.ts`.
- Prefer batch write APIs (single atomic write) when adding/updating multiple rows to avoid race conditions.

## API contract
- Must return the standard response shape. Authentication failures → 401, server errors → 500.
- Common endpoints: `/api/auth/login`, `/api/auth/verify`, `/api/apps`, admin-only `/api/users`, and CSV batch endpoints for bulk writes.

## Dev commands (quick)
```bash
npm run dev   # includes --turbopack
npm run build # includes --turbopack
npm run lint
bash scripts/init-dev.sh  # copy sample CSVs for local dev
```

## Common components & patterns
- `ProtectedRoute`, `LoadingSpinner`, `ErrorMessage` are standardized common components.
- CSV editor: spreadsheet-style editor (single-click select, double-click edit, auto-backup `.backup`).
- Group/accordion UI: use `Set<string>` to track collapsed groups for O(1) checks.

## File layout (essential)
- `src/`: app/, components/, contexts/, lib/, types/
- `data/`: runtime CSV files (e.g. `users.csv`, `apps.csv`) and `*.sample.csv` templates

## Environment
- Recommended: set `JWT_SECRET` (defaults to fallback). Set `NODE_ENV` appropriately to enable cookie secure flags.

## Common pitfalls
- Missing `--turbopack` in scripts — check `package.json`.
- CSV missing — run `scripts/init-dev.sh` or let `ensureDataFile` create files on first read.
- Auth flicker: always account for `isLoading` in `AuthContext` before rendering protected UI.
- API must follow response contract; messages are expected in Korean.
- Avoid per-row CSV writes; use batch APIs to reduce corruption risk.
