<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## UI components (atomic design)

| Layer | Path | Role |
|-------|------|------|
| Atoms | `components/atoms/` | Small presentational pieces (bullet lists, markdown preview, table empty row) |
| Primitives | `components/ui/` | shadcn/Radix building blocks |
| Molecules | `components/molecules/` | Composed UI (KPI tile, page header, section subnav) |
| Organisms | `components/organisms/` | Feature sections with behavior |
| Templates | `components/templates/` | Page shells and layout frames |

`app/` routes must not import `components/ui/` directly (use atoms/molecules/organisms/templates). Root layout providers are the exception.

Prefer reusing atoms/molecules before duplicating markup in organisms or `app/` routes.

<!-- END:nextjs-agent-rules -->

## Architecture (hexagonal)

| Layer | Path | Responsibility |
|-------|------|----------------|
| Domain | `src/core/domain/` | Pure rules — no Prisma, Next, adapters, or framework APIs |
| Ports | `src/core/ports/` | Interfaces only — persistence/auth/analysis contracts |
| Application | `src/core/application/` | Use cases — orchestrate ports + domain with injected deps |
| Adapters | `src/adapters/` | Implementations — Prisma, session auth, Vercel AI, etc. |
| Delivery | `app/` (and thin helpers in `lib/` wired from routes) | HTTP/UI — validate input (Zod), compose deps, call application |

**Rule**: Dependencies point inward. Outer layers implement interfaces declared inward — never import adapters into domain.

Delivery-only concerns (`after()`, `revalidatePath`, cron routes) stay in `app/` or delivery helpers — not in `src/core/application/`. Meeting analysis runs in-process via `after()` (`scheduleAnalysisJobsAfterResponse`) with a daily cron backup at `/api/cron/process-analysis-jobs`.

## Authorization (IDOR)

- Never load org-owned rows by ID alone — always pass **`activeOrganizationId`** from session into `*ForOrg` repository methods.
- Reuse shared access helpers (e.g. `lib/meeting-mutation-access.ts`) instead of copy-pasting seller/manager checks in server actions.
- See `.cursor/rules/idor-authorization.mdc`.

## UI (atomic design)

- **Molecules** — presentation only; no server actions.
- **Organisms** — feature blocks; client components may call server actions.
- **`app/` routes** — thin; pass props to organisms/templates; do not import `components/ui/` (root layout exception).

See `.cursor/rules/atomic-design.mdc`, `.cursor/rules/kiss-dry.mdc`.

## Validation

Validate **`unknown`** at boundaries with **Zod** (`safeParse` + structured errors for UX where applicable). Prefer collocated `*.ts` schemas exporting `z.infer`.

## Testing and coverage

- Unit tests: `*.test.ts` colocated or under `tests/` as established.
- Default gate: `npm run verify` (`typecheck` → `lint` → `jest`).
- Coverage report: `npm run test:coverage`. Maintain **≥75% line coverage** (aggregate) on paths listed under `collectCoverageFrom` in `jest.config.js`. Automated thresholds are not enabled globally yet — SWC/Jest coverage is often inaccurate until tooling improves.

## Cursor tooling

Project rules live in `.cursor/rules/` (`*.mdc`). Invoke the **code-quality** skill from `.cursor/skills/code-quality/SKILL.md` before declaring substantive work complete. Optional agent presets are documented in `.cursor/agents/README.md`.
