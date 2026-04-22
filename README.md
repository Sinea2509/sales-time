# Sales Time

Next.js (App Router) app with **Clerk** authentication and organizations, **Prisma** on PostgreSQL for app-owned roles and audit logs, **shadcn/ui** (Base UI) components, **hexagonal** domain boundaries, and **atomic design**-style UI folders.

## Features

- Email/password (and other methods) via Clerk; **password reset** and account security live on Clerk’s hosted UI and [`/dashboard/account`](/app/dashboard/account) (`<UserProfile />`).
- **Organization switching** via Clerk’s `<OrganizationSwitcher />` in the dashboard header.
- **System super admin**: database role `SUPER_ADMIN` grants access to `/dashboard/super-admin`, ability to **enter any Clerk organization** with audit logging, and **org-admin-level authorization** for the elevated org (cookie-backed, resolved in domain policy).
- **Webhooks** (optional): sync Clerk users into the local `User` table for foreign keys on `SystemRole` / `SuperAdminAuditLog`.
- **Admin onboarding** ([`/onboarding`](app/onboarding/page.tsx)): four-step wizard (Contexte → Coach IA → Process → Invitations) matching the product PDF; data is stored on [`OnboardingProfile`](prisma/schema.prisma). New sign-ups are sent here first; [`app/dashboard/layout.tsx`](app/dashboard/layout.tsx) redirects until `completedAt` is set (super admins skip this gate).

## Quick start

1. Copy [`.env.example`](.env.example) to `.env` and set **valid** Clerk keys (Next.js validates the publishable key at build time) plus `DATABASE_URL`.
2. Install dependencies: `npm install` (runs `prisma generate` via `postinstall`).
3. Apply migrations: `npm run db:migrate:dev` (local) or `npm run db:migrate` (deploy).
4. Run the app: `npm run dev`.

## Clerk dashboard

- Enable **Organizations** and configure roles (default `org:admin` / `org:member` works with this codebase).
- Add redirect URLs for local dev, e.g. `http://localhost:3000`, `http://localhost:3000/dashboard`, and `http://localhost:3000/onboarding`.
- Optional: create a **webhook** endpoint `https://<your-host>/api/webhooks/clerk` for `user.*` events and set `CLERK_WEBHOOK_SECRET`.

## Super admin

1. Ensure the user exists in the app DB (webhook or by visiting `/dashboard`, which **upserts** the user from Clerk).
2. Grant the role:

```bash
DATABASE_URL="postgresql://..." CLERK_USER_ID="user_..." npx prisma db seed
```

3. Sign in and open **Super admin** in the header to list organizations and **operate in** one. Every enter/exit writes a row to `SuperAdminAuditLog`. An **httpOnly** cookie `st_super_admin_org` stores the elevated Clerk org id.

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Next dev server                      |
| `npm run build`   | Production build (needs env as above)|
| `npm test`        | Vitest unit tests                    |
| `npm run e2e`     | Playwright (start dev server first)  |
| `npm run db:*`    | Prisma generate / migrate / studio   |

## Architecture

- **Domain / application**: [`src/core`](src/core) — policies and use-cases; no Next.js or Prisma imports.
- **Ports**: [`src/core/ports`](src/core/ports) — interfaces for auth session, users, audit, org directory.
- **Adapters**: [`src/adapters`](src/adapters) — Clerk session, Clerk Backend API org list, Prisma repositories, [`composition.ts`](src/adapters/composition.ts) wiring.
- **UI**: [`components/ui`](components/ui) (atoms), [`components/molecules`](components/molecules), [`components/organisms`](components/organisms), [`components/templates`](components/templates).

## Authorization model

`resolveActorAuthorization` ([`src/core/domain/authorization-policy.ts`](src/core/domain/authorization-policy.ts)) computes:

- `activeTenantClerkOrgId` — super-admin cookie wins when present; otherwise Clerk session `orgId`.
- `canManageOrganization` — `org:admin` for the active tenant **or** elevated super admin for that tenant.
- `isElevatedSuperAdmin` — super admin with an active elevation cookie targeting the active tenant.

Use **`activeTenantClerkOrgId`** for org-scoped queries and mutations, not only the raw session org.

## Middleware

[`middleware.ts`](middleware.ts) protects all routes except `/`, `/sign-in`, `/sign-up`, and `/api/webhooks/*`. Next.js 16 may warn about the `middleware` → `proxy` migration; follow upstream guidance when upgrading.
