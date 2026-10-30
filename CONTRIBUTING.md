# Contributing

## Setup

See `README.md`. Use **pnpm**. Node 24.

## Workflow

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` before a PR.
2. Schema changes: edit `src/db/schema`, then `pnpm db:generate` and `pnpm db:migrate`.
3. Mutations belong in `src/features/*/actions.ts` with Zod + `assertCan`.
4. Follow `.cursor/rules/` and `docs/DESIGN.md`.
5. Do not commit `.env`.

## Commits

Imperative, scoped: `feat:`, `fix:`, `chore:`, `docs:`. First line under 72 characters. Say why.

## Hooks

Husky runs lint-staged on staged files (Prettier, ESLint).
