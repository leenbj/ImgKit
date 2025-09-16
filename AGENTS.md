# Repository Guidelines


全程对话必须使用中文

## Project Structure & Module Organization
- Root: project config and this guide.
- `docs/`: user/developer documentation and specs (existing).
- `src/`: application/library source code (create when adding code).
- `tests/`: automated tests mirroring `src/` structure.
- `scripts/`: helper scripts for local tasks (bash or node).
- `assets/`: static files (images, fixtures, mock data).

Example
```
src/module_a/
tests/module_a/test_module_a.spec.<ext>
scripts/dev.sh  scripts/test.sh
```

## Build, Test, and Development Commands
- `make setup`: install toolchain and dependencies (wraps language‑specific installers).
- `make dev`: run the app or docs locally with hot reload.
- `make test`: execute the test suite with coverage output.
- `make lint`: run formatters/linters; auto‑fix where safe.
- `make build`: produce a production build or distribution artifacts.

If `make` is unavailable, run the equivalent scripts under `scripts/` (e.g., `./scripts/test.sh`). Keep commands idempotent.

## Coding Style & Naming Conventions
- Indentation: 2 spaces for Markdown/JSON/YAML; follow language defaults for code.
- Filenames: kebab-case for scripts (`generate-report.sh`), snake_case for Python, camelCase for JS/TS variables, PascalCase for classes.
- Formatting: prefer an autoformatter (e.g., Prettier for markdown/json) and an `.editorconfig` to normalize whitespace and EOF newlines.

## Testing Guidelines
- Framework: choose the dominant framework of the language used (e.g., PyTest/Jest/Vitest). Place tests in `tests/` and mirror `src/` paths.
- Naming: `test_<module>.py` or `<name>.spec.ts`/`.js`.
- Coverage: aim for ≥80% line coverage; include regression tests for fixed bugs.
- Run: `make test` or `./scripts/test.sh`.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (e.g., `feat: add parser`, `fix(core): handle nil ids`). Write imperative, present‑tense messages with a concise body when needed.
- PRs: include a clear description, linked issues (`Closes #123`), screenshots/logs for UI/CLI changes, and notes on testing/impact. Keep PRs small and focused.

## Security & Configuration Tips
- Never commit secrets. Store env vars in `.env.local`; provide `.env.example`.
- Validate inputs and sanitize external data; avoid shelling out without quoting.

## Agent‑Specific Instructions
- This AGENTS.md governs the whole repo. If you introduce new directories, update this file and any `Makefile`/scripts to keep commands consistent.

