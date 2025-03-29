PROJECT_NAME=messenger
DEV_COMPOSE_FILE=docker-compose.dev.yml
TEST_COMPOSE_FILE=docker-compose.test.yml

network:
	docker network inspect messenger >/dev/null 2>&1 || docker network create messenger

env:
	@if [ ! -f .env ]; then \
		cp .env.sample .env; \
	fi

up: env network
	docker compose -f $(DEV_COMPOSE_FILE) -p $(PROJECT_NAME) up --build

down:
	docker compose -f $(DEV_COMPOSE_FILE) -p $(PROJECT_NAME) down

restart: down up

unit-tests:
	docker compose -f $(TEST_COMPOSE_FILE) run --rm --build messenger-server-unit-test

e2e-tests:
	docker compose -f $(TEST_COMPOSE_FILE) run --rm --build messenger-server-e2e-test --remove-orphans
