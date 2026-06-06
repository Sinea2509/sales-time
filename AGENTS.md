<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

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

## Validation

Validate **`unknown`** at boundaries with **Zod** (`safeParse` + structured errors for UX where applicable). Prefer collocated `*.ts` schemas exporting `z.infer`.

## Testing and coverage

- Unit tests: `*.test.ts` colocated or under `tests/` as established.
- Default gate: `npm run verify` (`typecheck` → `lint` → `jest`).
- Coverage report: `npm run test:coverage`. Maintain **≥75% line coverage** (aggregate) on paths listed under `collectCoverageFrom` in `jest.config.js`. Automated thresholds are not enabled globally yet — SWC/Jest coverage is often inaccurate until tooling improves.

## Cursor tooling

Project rules live in `.cursor/rules/` (`*.mdc`). Invoke the **code-quality** skill from `.cursor/skills/code-quality/SKILL.md` before declaring substantive work complete. Optional agent presets are documented in `.cursor/agents/README.md`.
