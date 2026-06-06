---
name: code-quality
description: >-
  Run before declaring feature/fix complete — verifies hexagonal boundaries,
  Zod usage, tests, and quality gates for sales-time.
disable-model-invocation: false
---

# Code quality gate (sales-time)

Apply after substantive edits to `src/`, `lib/`, or `app/`.

## 1. Architecture (hexagonal)

- **`src/core/domain`**: No adapters, Next, Prisma, React.
- **`src/core/application`**: Use ports + domain only — deps injected.
- **`src/adapters`**: Implements ports; maps IO shapes ↔ domain/port types.
- **`app/`**: Thin delivery — Zod-parse boundaries then call application with composed deps.

## 2. Validation

- Unknown/external payloads parsed with **Zod** before entering core.
- Prefer exported `z.infer` types paired with schemas.

## 3. Tests and coverage

- Add/update **`*.test.ts`** for behavior changes.
- Run **`npm run verify`** (typecheck + lint + Jest).
- Run **`npm run test:coverage`** when touching logic-heavy modules; aim **≥75% lines** on `jest.config.js` → `collectCoverageFrom` paths (aggregate).

## 4. Clean code quick scan

- No scope creep in diff; clear naming; meaningful errors with cause where applicable.

## Output

Reply with a short checklist table — pass/fail per section — and list commands actually run.
