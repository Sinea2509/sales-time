# Sales Time

Next.js (App Router) app with **app-owned** email/password authentication and sessions, **Prisma** on PostgreSQL for users, organizations, roles and audit logs, **shadcn/ui** (Base UI) components, **hexagonal** domain boundaries, and **atomic design**-style UI folders.

## Features

- **Sign up / sign in** with email and password stored in the app database (Argon2). Password reset via email ([`RESEND_API_KEY`](.env.example), `APP_BASE_URL`).
- **Organizations** and membership roles (`ADMIN` / `MEMBER`); org switching via the in-app org switcher and cookies.
- **System super admin**: database role `SUPER_ADMIN` grants access to `/admin` super-admin tools, ability to **enter any organization** with audit logging, and org-admin-level authorization for the elevated org (signed httpOnly cookie).
- **Admin onboarding** ([`/onboarding`](app/onboarding/page.tsx)): wizard storing data on `OnboardingProfile`; company layout may redirect until onboarding is complete (super admins skip where applicable).

## Quick start

1. Copy [`.env.example`](.env.example) to `.env` and set **`DATABASE_URL`** (and optional `DIRECT_URL` / `DATABASE_URL_UNPOOLED` for Prisma CLI per comments in the example).
2. For **SONCAS / DISC** meeting analysis via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway), set `AI_GATEWAY_API_KEY` in `.env`.
3. Install dependencies: `npm install` (runs `prisma generate` via `postinstall`).
4. Apply migrations: `npm run db:migrate:dev` (local) or `npm run db:migrate` (deploy).
5. Seed a super admin and default prompts: `npx prisma db seed` (see [prisma/seed.ts](prisma/seed.ts) for `SEED_SUPER_ADMIN_*` overrides).
6. Run the app: `npm run dev`.

## Organization app (rendez-vous & analyse)

With an **active organization** selected, the company area includes dashboard indicators, meetings, and analysis (SONCAS + DISC via AI Gateway when configured). Super admins can edit global analysis prompts under the admin prompts UI.

## Super admin

Super admin is an **app database** role (`SystemRole.SUPER_ADMIN`). Passwords are managed in-app (sign-up, account settings, forgot password).

### Vercel + Neon

1. In Vercel, connect the [Neon](https://neon.tech) integration (or paste `DATABASE_URL` from the Neon console) into project **Environment Variables** for Production / Preview / Development as needed.
2. For Prisma CLI (`migrate deploy`, seed, studio), the app needs a **direct** connection (host **without** `-pooler`): set **`DIRECT_URL`**, or rely on the Vercel Neon integration’s **`DATABASE_URL_UNPOOLED`** (see [`prisma.config.ts`](prisma.config.ts) resolution order). Keep **`DATABASE_URL`** **pooled** for runtime (`lib/prisma.ts`). Without a direct URL, `npm run build` can fail with **P1002** (advisory lock) or the explicit pooler guard error—[`prisma migrate deploy`](https://pris.ly/d/migrate-advisory-locking) must not use the pooler. See [Neon + Prisma](https://neon.com/docs/guides/prisma) and [Vercel Neon env vars](https://neon.com/docs/guides/vercel-managed-integration#environment-variables-set-by-the-integration).
3. Locally, copy the same variables into `.env` (or run `vercel env pull` if you use the Vercel CLI). [`.env.example`](.env.example) shows the split.
4. In production, set **`SUPER_ADMIN_ORG_COOKIE_SECRET`** (long random string) so the super-admin organization elevation cookie can be signed.
5. Apply migrations: `npm run db:migrate` (deploy) or `npm run db:migrate:dev` (local).

### Grant the first super admin

Use the seed script (defaults in `prisma/seed.ts`):

```bash
DATABASE_URL="postgresql://..." npx prisma db seed
```

Override email/password with `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` if needed. Then sign in and use **Super admin** in the UI to list organizations and **operate in** one. Enter/exit actions are recorded in `SuperAdminAuditLog`. The httpOnly cookie `st_super_admin_org` stores the elevated **internal** organization id (signed).

## Scripts

| Script          | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Next dev server                       |
| `npm run build` | Production build (needs env as above) |
| `npm test`      | Vitest unit tests                     |
| `npm run e2e`   | Playwright (start dev server first)   |
| `npm run db:*`  | Prisma generate / migrate / studio    |

## Before you open a PR

Run **`npm run lint`**, **`npm run typecheck`**, and **`npm test`**. If you change authentication, organization switching, invitations, or onboarding flows, also run **`npm run build`** and **`npm run e2e`** (start the dev server first for Playwright). CI runs lint, typecheck, and unit tests on every push and pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Architecture

- **Domain / application**: [`src/core`](src/core) — policies and use-cases. **Dependency rule:** no `next/*`, no `@/lib/prisma`, and no imports from `@/lib/generated/prisma` (use domain-owned types such as [`organization-membership-role.ts`](src/core/domain/organization-membership-role.ts) and map at adapters).
- **Ports**: [`src/core/ports`](src/core/ports) — interfaces for auth, session persistence, users, audit, org directory, invitations, and other side effects.
- **Adapters**: [`src/adapters`](src/adapters) — Prisma repositories, session + auth wiring, [`composition.ts`](src/adapters/composition.ts) (`makeApplicationDeps`), AI analysis adapter. **Runtime wiring:** Server Components and Server Actions use [`getApplicationDeps()`](lib/application-deps.ts) (React `cache`) for a single dependency graph per request.
- **UI**: [`components/ui`](components/ui) (atoms), [`components/molecules`](components/molecules), [`components/organisms`](components/organisms), [`components/templates`](components/templates).

**Migration note:** [`src/core`](src/core) is strict hexagonal; some routes under [`app/`](app/) still call Prisma directly while they are migrated behind ports. Prefer ports + use cases for new behavior.

## Authorization model

`resolveActorAuthorization` ([`src/core/domain/authorization-policy.ts`](src/core/domain/authorization-policy.ts)) computes:

- **`activeOrganizationId`** — super-admin elevation cookie wins when present and valid; otherwise the session’s active organization must match a membership.
- **`canManageOrganization`** — org `ADMIN` for the active tenant **or** elevated super admin for that tenant.
- **`isElevatedSuperAdmin`** — super admin with an active elevation cookie targeting the active tenant.

Use **`activeOrganizationId`** for org-scoped queries and mutations.

## Middleware

[`proxy.ts`](proxy.ts) requires a session cookie on non-public routes (sign-in, sign-up, password reset, invitations, health, webhooks, etc.) and chains **next-intl** locale handling (`fr` default, `en` optional, `localePrefix: never`).
