# AGENTS.md

Guidance for agentic coding assistants working in this repository.

## Project Snapshot

- Stack: Vite + React 19 + TypeScript (ES modules).
- Entry points: `index.tsx`, `App.tsx`.
- Main folders:
  - `components/` (UI screens and app behavior)
  - `data/` (kana/kanji datasets and selection utilities)
  - `types.ts` (shared domain types)
- Styling: Tailwind via CDN config in `index.html` (no `tailwind.config.*` file).
- Build output: `dist/`.

## Commands

Run from repo root: `/Users/jacob/dev/projects/kana-master`.
Use `pnpm` as the package manager for install, scripts, and one-off tooling.

### Install

- `pnpm install`

### Dev

- `pnpm dev`
  - Starts Vite dev server (configured for host `0.0.0.0`, port `3000`).

### Build

- `pnpm build`
  - Runs production Vite build to `dist/`.

### Preview

- `pnpm preview`
  - Serves the built app locally.

### Lint / Typecheck

- There is currently **no lint script** and no ESLint config committed.
- Prettier is configured via package scripts:
  - `pnpm format` (write formatting)
  - `pnpm format:check` (verify formatting)
- Recommended quality gate currently available:
  - `pnpm exec tsc --noEmit`

### Tests

- There is currently **no test runner configured** and no committed test files.
- `package.json` has no `test` script.

### Single Test Execution (important)

- Current status: not available until a test framework is added.
- If Vitest is introduced, prefer these patterns:
  - Single file: `pnpm exec vitest run components/QuizScreen.test.tsx`
  - Single test name: `pnpm exec vitest run -t "should validate romaji prefix"`
  - File + name: `pnpm exec vitest run components/QuizScreen.test.tsx -t "handles Escape"`

## Rules Sources Check

- Checked `.cursor/rules/`: not present.
- Checked `.cursorrules`: not present.
- Checked `.github/copilot-instructions.md`: not present.
- Therefore, no external Cursor/Copilot rule files currently constrain behavior.

## Code Style and Conventions

Follow existing conventions in each touched file. Avoid broad reformatting.

### Imports

- Use ESM imports only.
- Ordering convention used in this repo:
  1. React and React hooks
  2. Internal types/utilities/data
  3. Third-party UI libs/icons (`lucide-react`, `framer-motion`, etc.)
- Internal imports are usually relative (`../types`, `./components/...`).
- Path alias `@/*` exists in `tsconfig.json`, but most current code uses relative paths; stay consistent with local file style.

### Formatting

- Preserve the file's existing quote style and spacing (repo is mixed single/double quotes).
- Keep semicolon usage consistent with the file you edit.
- Use trailing commas where already used by surrounding code.
- Keep JSX props readable; wrap long className/template literals across lines.
- Do not do repo-wide formatting churn as part of feature/bugfix changes.

### Types and TypeScript

- Prefer explicit domain types from `types.ts`.
- Use string literal unions for bounded modes/options (existing pattern).
- Type component props with dedicated `...Props` interfaces.
- Prefer narrow types over `any`; if forced to use `any`, keep usage isolated.
- Keep `noEmit` TypeScript compatibility.
- `allowJs` is enabled, but new logic should still be written in TypeScript.

### Naming

- Components: `PascalCase` file and symbol names (`QuizScreen`, `StatsScreen`).
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for fixed values (`STORAGE_KEY`, color constants).
- Event handlers: `handleX` naming (`handleSubmit`, `handleKeyDown`).
- Boolean state flags: `isX`, `hasX`, `didX` prefixes.

### React Patterns

- Use functional components with hooks.
- Derive memoized display state with `useMemo` when it avoids repeated branching.
- Use `useEffect` cleanup for timers/listeners/timeouts.
- Prefer guard clauses for invalid state (`if (!currentCard) return ...`).
- Keep state localized to screen component unless shared app-wide.

### State and Persistence

- Local storage keys are versioned constants (e.g., `kana-master-config-v7`).
- When changing persisted payload shape, include backward-compatible merge/fallback logic.
- Defensive parse pattern is expected around `JSON.parse` with fallback defaults.

### Error Handling

- Fail fast for impossible bootstrapping errors (e.g., missing root DOM node).
- In user-flow logic, prefer graceful fallback over crashes:
  - return early
  - call recovery callbacks (`onExit`)
  - warn for non-fatal issues (`console.warn`)
- Validate user input before processing (example: romaji regex filtering).

### Data and Algorithms

- Keep kana/kanji datasets in `data/` modules, not inline in components.
- Keep helper functions pure where practical (`getWeightedRandomItem`, subset builders).
- Document non-obvious domain rules with concise comments (e.g., pronunciation/group edge cases).
- Preserve gameplay invariants when editing generation logic:
  - selected groups filtering
  - script balancing
  - yoon handling
  - timed vs untimed completion behavior

### UI and Accessibility Expectations

- Keep keyboard interactions intact (`Enter`, `Escape`, arrow keys, etc.).
- Preserve focus management for typing flow.
- Maintain both light/dark behavior (class-based dark mode on `<html>`).
- Avoid regressions in responsive layouts (`min-h`, `max-w`, overflow handling).

## Change Scope Guidelines

- Make focused edits tied to the requested task.
- Do not rename files/symbols broadly unless required.
- Do not introduce new dependencies unless necessary.
- If adding scripts (lint/test/typecheck), update this file accordingly.
- If Cursor/Copilot rule files are added later, mirror key instructions here.

## Verification Checklist for Agents

Before finishing a change, run what is applicable:

- `pnpm build`
- `pnpm exec tsc --noEmit` (recommended until lint/test scripts exist)
- If tests are added later: run the smallest targeted test first, then broader suite.

If you cannot run a command, state exactly what was not run and why.

## Extra

- Keep this `## Extra` section as the final section at the bottom of this file.
- Never make styling-only changes to existing code when patching.
- Always run Prettier on files after patching them.
