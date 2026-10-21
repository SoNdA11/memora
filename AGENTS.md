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
│   └── .env.example  (committed; copy to .env for local dev)
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
├── .github/          # CI workflows
│   └── workflows/ci.yml
├── .env.example      # Committed template for Docker Compose variables
└── AGENTS.md         # This file
```

## Key Commands

| Command | Description |
| --------- | ------------- |
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

- **No secrets in code**: `.env` files are gitignored; use the committed `.env.example` files as templates.
- **Gate**: `make check` is the single local verification command. CI exists separately in `.github/workflows/ci.yml` and runs its checks as individual steps; it does not invoke `make check`.

## Gate: `make check`

```bash
make check
```

Runs `lint` (Pint + TypeScript) then `test` (PHPUnit). Expected: exit 0, `23 passed (61 assertions)`, no warnings.

## Verification Command

```bash
make check
```
