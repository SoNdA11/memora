# Implementation Plan: Repository Gate (`make check`)

## Ordered Steps

### Step 1: Update `Makefile`

Edit targets `.PHONY`, `lint`, `test`; add `check` target.

### Step 2: Create `AGENTS.md` at repository root

New file with required sections.

### Step 3: Verify each target independently, then `make check`

---

## Exact Edits

### File: `Makefile` (before → after)

**Before** (current lines 1–32):

```makefile
.PHONY: up down logs test build pshell seed lint backup restore

up:
 docker compose up -d --build

down:
 docker compose down

logs:
 docker compose logs -f api

test:
 docker compose up -d pgsql redis
 docker compose exec pgsql psql -U memora -d memora -c "CREATE DATABASE memora_testing" || true
 docker compose run --rm -e DB_DATABASE=memora_testing api sh -c "composer install --no-interaction --ignore-platform-reqs -q && php artisan migrate:fresh --force && php artisan test"

pshell:
 docker compose exec pgsql psql -U memora -d memora

seed:
 curl -X POST localhost:8080/api/phrasal-verbs/seed
 curl -X POST localhost:8080/api/edital/seed

lint:
 docker compose run --rm api ./vendor/bin/pint --test
 cd web && npx tsc --noEmit

backup:
 docker compose exec pgsql pg_dump -U memora memora > backup-$$(date +%F).sql

restore:
 psql "postgresql://memora:memora@localhost:5432/memora" < $$(ls -t backup-*.sql | head -n 1)
```

**After** (replace entire file):

```makefile
.PHONY: up down logs test lint check pshell seed backup restore

up:
 docker compose up -d --build

down:
 docker compose down

logs:
 docker compose logs -f api

test:
 docker compose up -d pgsql redis
 docker compose exec pgsql psql -U memora -d memora -c "CREATE DATABASE memora_testing" || true
 docker compose run --rm --user root -e DB_DATABASE=memora_testing api sh -c "composer install --no-interaction --ignore-platform-reqs -q && cp -n .env.example .env && php artisan migrate:fresh --force && php artisan test"

pshell:
 docker compose exec pgsql psql -U memora -d memora

seed:
 curl -X POST localhost:8080/api/phrasal-verbs/seed
 curl -X POST localhost:8080/api/edital/seed

lint:
 docker compose run --rm --user root api sh -c "composer install --no-interaction --ignore-platform-reqs -q && ./vendor/bin/pint --test"
 cd web && npx tsc --noEmit

check: lint test

backup:
 docker compose exec pgsql pg_dump -U memora memora > backup-$$(date +%F).sql

restore:
 psql "postgresql://memora:memora@localhost:5432/memora" < $$(ls -t backup-*.sql | head -n 1)
```

**Key changes**:

- `.PHONY`: add `check`, remove `build` (unused).
- `test`: add `--user root`; insert `cp -n .env.example .env &&` before `php artisan migrate:fresh`.
- `lint`: add `--user root`; wrap in `sh -c "composer install ... && ./vendor/bin/pint --test"`.
- `check`: new target depending on `lint` then `test`.

---

### File: `AGENTS.md` (new, at repository root)

```markdown
# AGENTS.md — Memora Repository Guide

## Stack
- **API**: Laravel 12 (PHP 8.4), PostgreSQL, Redis
- **Web**: React 18 + TypeScript, Vite, Tailwind CSS
- **Orchestration**: Docker Compose (services: `api`, `queue`, `pgsql`, `redis`, `web`, `backup`)

## Repository Layout
```

memora/
├── api/              # Laravel application
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   ├── composer.json
│   └── .env.example  (not committed; copy to .env for local dev)
├── web/              # React/TS frontend
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
├── specs/            # Specs (spec-driven workflow)
│   └── inbox/
├── docs/             # Plans, screenshots, assets
│   └── plans/
├── conc/             # Portuguese study materials
└── AGENTS.md         # This file

```

## Key Commands
| Command | Description |
|---------|-------------|
| `make up` | Start all services (builds images) |
| `make down` | Stop and remove containers |
| `make logs` | Follow API logs |
| `make test` | Run PHPUnit tests (23 tests, 61 assertions) in ephemeral container |
| `make lint` | Run Pint (PHP) + `tsc --noEmit` (TypeScript) |
| `make check` | **Gate**: runs `lint` then `test`; must pass before PR/merge |
| `make pshell` | Open `psql` on primary database |
| `make seed` | Seed phrasal verbs and edital data via API |
| `make backup` | Dump primary DB to `backup-YYYY-MM-DD.sql` |
| `make restore` | Restore latest backup |

## Conventions
- **No secrets in code**: `.env` files are gitignored; use `.env.example` as template.
- **Gate**: `make check` is the single local verification command. CI runs its checks as individual steps and does not invoke `make check`.

## Gate: `make check`
```bash
make check
```

Runs `lint` (Pint + TypeScript) then `test` (PHPUnit). Expected: exit 0, `23 passed (61 assertions)`, no warnings.

## Verification Command

```bash
make check
```

---

## Verification Order

| Step | Command | Expected Result |
| ------ | --------- | ----------------- |
| 1 | `make lint` | Exit 0. Output shows `pint` style check passing, then `tsc --noEmit` exit 0. |
| 2 | `make test` | Exit 0. Output: `23 passed (61 assertions)`, no `file_get_contents(/app/.env)` warnings. |
| 3 | `make check` | Exit 0. Runs `lint` then `test` sequentially; same results as above. |
| 4 | `cat AGENTS.md` | File exists at repo root with all sections above. |

---

## Risks & Rollback

| Risk | Mitigation | Rollback |
| ------ | ------------ | ---------- |
| `--user root` in ephemeral containers | Containers are `--rm`; no persisted state. Limited to `lint` and `test` only. | Revert `Makefile` to before state (git checkout). |
| `cp -n .env.example .env` no-op if file missing | Tests rely on `docker-compose.yml` env vars; Laravel falls back gracefully. | No rollback needed; behavior is safe. |
| `composer install` in `lint` adds latency | ~5–10s per run; acceptable for local gate. | Revert `lint` target to original (will fail without `pint`). |
| `check` target breaks existing workflows | `lint` and `test` remain independently invocable. | Remove `check` from `.PHONY` and delete target. |

**Rollback command** (if needed):

```bash
git checkout HEAD -- Makefile
rm -f AGENTS.md
```
