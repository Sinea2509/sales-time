# Cursor agents (optional manual presets)

Cursor UI lets you define **custom agents** with prompts + tools in-app (may vary by Cursor plan).

Suggested presets mirroring this repo’s `.cursor/rules/`:

| Agent name | System hint |
|------------|-------------|
| **Hexagonal auditor** | Enforce dependency rules from `.cursor/rules/hexagonal-*.mdc`; cite violating imports if present. |
| **Boundary schemas** | Require Zod for unknown/external input per `.cursor/rules/zod-validation.mdc`. |
| **Test coverage** | Demand matching tests and coverage implications per `.cursor/rules/unit-testing.mdc`; enforce running `npm run verify`. |

Paste those prompts into Cursor → Agents → New custom agent, and attach this workspace.
