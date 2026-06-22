---
name: code-quality
description: >-
  Run before declaring feature/fix complete — verifies hexagonal boundaries,
  atomic design, IDOR, Zod, tests, KISS/DRY, and quality gates for sales-time.
disable-model-invocation: false
---

# Code quality gate (sales-time)

Apply after substantive edits to `src/`, `lib/`, `app/`, or `components/`.

## 1. Hexagonal architecture

| Layer | Rule |
|-------|------|
| `src/core/domain` | Pure — no Next, Prisma, React, adapters |
| `src/core/application` | Ports + domain only; deps injected |
| `src/core/ports` | Interfaces only |
| `src/adapters` | Implement ports |
| `app/` + delivery `lib/` | Zod, compose deps, call application |

- Dependencies point **inward**.
- No `after()` / cron triggers / `revalidatePath` inside application layer.

## 2. Atomic design (frontend)

- `app/` → organisms/templates only (no `components/ui/`).
- **Molecules**: no server actions.
- **Organisms**: feature UI + client actions.
- Extract duplicate markup on **second** copy.

## 3. IDOR & authorization

- Scope all tenant reads/writes with **session `activeOrganizationId`**.
- Use `*ForOrg` repository methods; reuse access helpers (`lib/meeting-mutation-access.ts`).
- Validate IDs with Zod at boundaries.

## 4. Validation

- Parse **`unknown`** with Zod before core.
- Export `z.infer` types with schemas.

## 5. KISS & DRY

- One clear path; no premature abstraction.
- Extract repeated **auth/org checks** and **markup**, not accidental similarity.

## 6. Clean code

- Small functions; verb/noun naming; preserve error `cause`; focused diffs.

## 7. Tests & verify

- Colocate `*.test.ts` for behavior changes.
- Run **`npm run verify`** (typecheck → lint → jest).
- Coverage **`npm run test:coverage`** on logic-heavy paths (≥75% aggregate on `collectCoverageFrom`).

## Output checklist

Reply with pass/fail:

| Area | Pass? |
|------|-------|
| Hexagonal boundaries | |
| Atomic design / no molecule actions | |
| IDOR / org scope | |
| Zod at boundaries | |
| KISS / DRY | |
| Tests + verify | |

List commands actually run.
