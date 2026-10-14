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
