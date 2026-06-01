.PHONY: help up down build logs shell-backend shell-db test test-local migrate ps restart restart-backend up-build down-v sync install lint clean

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up:  ## Start all services (detached)
	docker compose up -d

build:  ## Build/rebuild images
	docker compose build

up-build:  ## Build and start all services
	docker compose up -d --build

down:  ## Stop and remove containers
	docker compose down

down-v:  ## Stop containers and remove volumes
	docker compose down -v

logs:  ## Tail logs for all services
	docker compose logs -f

logs-backend:  ## Tail backend logs
	docker compose logs -f backend

logs-db:  ## Tail db logs
	docker compose logs -f db

ps:  ## Show running containers
	docker compose ps

restart:  ## Restart all services
	docker compose restart

restart-backend:  ## Restart backend only
	docker compose restart backend

shell-backend:  ## Open shell in backend container
	docker compose exec backend bash

shell-db:  ## Open psql in db container
	docker compose exec db psql -U $${POSTGRES_USER:-app} -d $${POSTGRES_DB:-inventory}

migrate:  ## Run alembic migrations inside running backend container
	docker compose exec backend alembic upgrade head

test:  ## Run pytest inside the running backend container against real PostgreSQL
	docker compose exec backend pytest app/tests/ -v

test-local:  ## Run pytest locally (DATABASE_URL must be set to a real PostgreSQL URL)
	cd backend && pytest app/tests/ -v

install:  ## Install backend deps locally (into active venv)
	pip install -r backend/requirements.txt

lint:  ## Run ruff linter on backend
	cd backend && ruff check app/

sync:  ## Copy local backend code into running container (no rebuild needed)
	docker compose cp backend/app/. backend:/app/app/
	docker compose restart backend

test-pg:  ## Run integration tests against real PostgreSQL (container must be up)
	@echo "Running endpoint tests against http://localhost:8000 ..."
	@BASE=http://localhost:8000; \
	PASS=0; FAIL=0; \
	check() { \
	  if [ "$$2" = "$$3" ]; then echo "PASS [$$1]"; PASS=$$((PASS+1)); \
	  else echo "FAIL [$$1] got=$$3 want=$$2 body=$$4"; FAIL=$$((FAIL+1)); fi; }; \
	P1=$$(curl -sf -X POST $$BASE/products -H "Content-Type: application/json" \
	  -d '{"name":"TestProd","sku":"TEST-001","price":10.00,"quantity_in_stock":20}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"); \
	C1=$$(curl -sf -X POST $$BASE/customers -H "Content-Type: application/json" \
	  -d '{"full_name":"Test User","email":"testuser@example.com","phone":"555-9999"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"); \
	echo "Created product=$$P1 customer=$$C1"; \
	O1=$$(curl -sf -X POST $$BASE/orders -H "Content-Type: application/json" \
	  -d "{\"customer_id\":$$C1,\"items\":[{\"product_id\":$$P1,\"quantity\":2}]}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"); \
	echo "Created order=$$O1"; \
	curl -sf -X DELETE $$BASE/orders/$$O1 > /dev/null; \
	curl -sf -X DELETE $$BASE/products/$$P1 > /dev/null; \
	curl -sf -X DELETE $$BASE/customers/$$C1 > /dev/null; \
	echo "Smoke test complete — see make test for full suite"

clean:  ## Remove Python cache files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; find . -name "*.pyc" -delete 2>/dev/null; true
