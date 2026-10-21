## Goal
Establish a single `make check` gate that runs `lint` then `test`, create a root `AGENTS.md` documenting the repository, and fix two pre-existing gate defects so that `make check` exits 0 with 23 passing tests.

## Context
**Repository**: Laravel 12 (API) + React/TypeScript (web), Docker Compose orchestration.

**Current `Makefile`** (lines 1–32):
- `test` target (line 12–15): runs `docker compose run --rm -e DB_DATABASE=memora_testing api sh -c "composer install ... && php artisan migrate:fresh --force && php artisan test"` — runs as `www-data` inside the container; `/app/vendor` is root-owned → composer fails creating `/app/vendor/fakerphp`.
- `lint` target (line 24–26): runs `docker compose run --rm api ./vendor/bin/pint --test` — production image built with `composer install --no-dev` (Dockerfile line 19) so `pint` is absent → exit 127.
- No `check` target exists.

**Baseline evidence**:
- `make lint` → exit 127, `./vendor/bin/pint: not found`.
- `make test` → exit 1, composer error on `/app/vendor/fakerphp`.
- Fixed test command (with `--user root` + `cp -n .env.example .env`) → `23 passed (61 assertions)`, exit 0, no PHPUnit warnings.
- `cd web && npx tsc --noEmit` → exit 0.

**Dockerfile** (`api/Dockerfile` line 19): `composer install --no-dev --no-interaction --prefer-dist --no-scripts` — dev dependencies (including `pint`) not installed in production image.

**No `AGENTS.md` exists** at repository root.

## Proposed changes
1. `Makefile` — Add `check` target that depends on `lint` then `test`; fix `test` target to use `--user root`; fix `lint` target to run `composer install --no-interaction --ignore-platform-reqs -q` inside the ephemeral container before `./vendor/bin/pint --test`, also with `--user root`; in `test` target, add `cp -n .env.example .env` before `php artisan test` to silence 13 PHPUnit warnings about `file_get_contents(/app/.env)`.
2. `AGENTS.md` (new file at repo root) — Document stack (Laravel 12, React/TS, Docker Compose), repository layout (`api/`, `web/`, `docker-compose.yml`), key commands (`make up`, `make down`, `make test`, `make lint`, `make check`, `make pshell`, `make seed`, `make backup`, `make restore`), conventions (no secrets in code, `make check` as the gate), and the `make check` gate. Language and workflow rules are intentionally kept out of the repository file; they live in the maintainer's local OpenCode configuration.
3. `specs/inbox/repo-gate.md` — This spec (already being written).
4. `docs/plans/repo-gate.md` — Plan derived from this spec (to be written after spec approval).

## Acceptance criteria
- [ ] `make check` exists and runs `lint` then `test` in sequence.
- [ ] `make lint` exits 0 (runs `composer install --no-interaction --ignore-platform-reqs -q` then `./vendor/bin/pint --test` inside ephemeral container as root; then `cd web && npx tsc --noEmit`).
- [ ] `make test` exits 0 (runs as root via `--user root`, copies `.env.example` to `.env` with `cp -n`, runs migrations and tests; output shows `23 passed (61 assertions)`).
- [ ] `make check` exits 0 with the same 23 passing tests and no PHPUnit warnings.
- [ ] `make lint` and `make test` remain independently invocable.
- [ ] `AGENTS.md` exists at repository root with required sections (stack, layout, commands, conventions, gate).
- [ ] No changes to CI, Dockerfile, app code, tests, or README.

## Risks
- **Permission drift**: Using `--user root` in ephemeral containers is safe because containers are `--rm` and don't persist; mitigated by limiting `--user root` only to `lint` and `test` targets.
- **Missing `.env.example`**: `cp -n .env.example .env` is a no-op if source missing; tests still pass because Laravel falls back to env vars from `docker-compose.yml`. No regression.
- **Composer install in `lint`**: Runs on every `make lint`; adds ~5–10s. Acceptable for local gate. No production image change.

## Out of scope
- CI/CD pipeline changes (GitHub Actions, etc.).
- `Dockerfile` modifications (production image stays `--no-dev`).
- Application code, test code, or test count changes.
- README or existing Portuguese documentation translation.
- Frontend linting beyond `npx tsc --noEmit` (no ESLint/Prettier configured).

## Verification
```bash
make check
```
Expected: exit 0, `23 passed (61 assertions)` printed, no PHPUnit warnings, `pint` and `tsc` succeed.