# Inventory & Order Management System — Implementation Plan

A full-stack, containerized Inventory & Order Management System.

**Stack:** React (frontend) · FastAPI / Python (backend) · PostgreSQL (database) · Docker + Docker Compose · deployed to Render/Railway (backend) and Vercel/Netlify (frontend).

---

## 1. Tech Stack & Key Decisions

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 (Vite, JavaScript) | Vite for fast builds + small image; Axios for API calls; React Router for pages |
| Backend | FastAPI + Uvicorn | Auto OpenAPI docs at `/docs`, Pydantic validation, async-ready |
| ORM | SQLAlchemy 2.x + Alembic | Models + versioned migrations |
| DB | PostgreSQL 16 | Named volume for persistence |
| Validation | Pydantic v2 | Request/response schemas, type-safe |
| Containers | Docker (multi-stage) | Slim base images (`python:3.12-slim`, `node:20-alpine`, `nginx:alpine`) |
| Orchestration | Docker Compose | 3 services: `frontend`, `backend`, `db` |
| Config | `.env` files | No hardcoded credentials anywhere |

**Backend dependency**: FastAPI is chosen over Flask for built-in validation (Pydantic) and auto-generated interactive docs, which directly satisfy the "validate all request data" and "proper HTTP status codes" requirements with less code.

---

## 2. Repository Structure

```
inventory-order-system/
├── docker-compose.yml
├── .env.example                 # template; real .env is git-ignored
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── migrations/              # Alembic migration scripts
│   └── app/
│       ├── main.py              # FastAPI app + router includes + CORS
│       ├── core/
│       │   ├── config.py        # reads env vars via pydantic-settings
│       │   └── database.py      # engine, SessionLocal, get_db dependency
│       ├── models/              # SQLAlchemy ORM models
│       │   ├── product.py
│       │   ├── customer.py
│       │   ├── order.py
│       │   └── order_item.py
│       ├── schemas/             # Pydantic request/response schemas
│       │   ├── product.py
│       │   ├── customer.py
│       │   └── order.py
│       ├── crud/                # DB operations (separation of concerns)
│       ├── routers/             # API route handlers
│       │   ├── products.py
│       │   ├── customers.py
│       │   ├── orders.py
│       │   └── dashboard.py
│       └── tests/               # pytest
│
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf               # serves build + proxies /api (prod)
    ├── package.json
    ├── .env.example             # VITE_API_BASE_URL
    └── src/
        ├── main.jsx
        ├── App.jsx              # routes
        ├── api/client.js        # axios instance w/ base URL
        ├── components/          # shared UI (Table, Modal, Form, Toast)
        └── pages/
            ├── Dashboard.jsx
            ├── Products.jsx
            ├── Customers.jsx
            └── Orders.jsx
```

---

## 3. Data Model

Four tables. Orders use a header/line-item pattern so an order can reference **multiple products**.

| Table | Key fields | Constraints |
|---|---|---|
| `products` | id, name, sku, price, quantity_in_stock, created_at | `sku` UNIQUE; `quantity_in_stock >= 0` (CHECK); `price >= 0` |
| `customers` | id, full_name, email, phone, created_at | `email` UNIQUE |
| `orders` | id, customer_id (FK), total_amount, status, created_at | FK → customers; `total_amount` computed by backend |
| `order_items` | id, order_id (FK), product_id (FK), quantity, unit_price, line_total | FK → orders (cascade delete), FK → products; `quantity > 0` |

Notes:
- `unit_price` is snapshotted onto `order_items` at order time so historical orders stay correct if product price later changes.
- `quantity_in_stock >= 0` enforced both in DB (CHECK constraint) and in application logic.

---

## 4. API Design

Base prefix: `/` (FastAPI auto-docs at `/docs`). All endpoints return JSON and use appropriate status codes.

### Products
| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/products` | 201 Created | 409 (duplicate SKU), 422 (validation) |
| GET | `/products` | 200 | — |
| GET | `/products/{id}` | 200 | 404 |
| PUT | `/products/{id}` | 200 | 404, 409, 422 |
| DELETE | `/products/{id}` | 204 | 404 |

### Customers
| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/customers` | 201 | 409 (duplicate email), 422 |
| GET | `/customers` | 200 | — |
| GET | `/customers/{id}` | 200 | 404 |
| DELETE | `/customers/{id}` | 204 | 404 |

### Orders
| Method | Path | Success | Errors |
|---|---|---|---|
| POST | `/orders` | 201 | 400 (insufficient stock), 404 (bad customer/product ref), 422 |
| GET | `/orders` | 200 | — |
| GET | `/orders/{id}` | 200 | 404 |
| DELETE | `/orders/{id}` | 204 | 404 |

### Dashboard
| Method | Path | Returns |
|---|---|---|
| GET | `/dashboard/summary` | `{ total_products, total_customers, total_orders, low_stock_products[] }` |

Standard error body: `{ "detail": "human-readable message" }` (FastAPI default).

---

## 5. Business Logic Rules

These are implemented in the `crud`/service layer, not the routers:

1. **Unique SKU** — DB UNIQUE constraint; on violation return `409 Conflict`.
2. **Unique customer email** — DB UNIQUE constraint; `409` on conflict.
3. **Non-negative stock** — CHECK constraint + Pydantic `ge=0`.
4. **Insufficient inventory blocks orders** — before committing an order, verify every requested `quantity <= product.quantity_in_stock`; otherwise `400` with which product failed.
5. **Order creation reduces stock** — within a **single DB transaction**: decrement each product's stock, insert order + order_items. Rollback on any failure (atomic).
6. **Total computed server-side** — `total_amount = Σ (unit_price × quantity)`; client-supplied totals are ignored.
7. **Validation before processing** — Pydantic schemas validate types, required fields, email format, positive quantities.
8. **Proper error handling** — central exception handlers map domain errors → correct HTTP codes.

> **Order deletion policy** (decide one and document it): either (a) hard-delete the order and restock products, or (b) mark `status='cancelled'` and restock. Plan assumes **hard delete + restock** for simplicity; cascade removes `order_items`.

---

## 6. Implementation Steps (Build Order)

### Phase 0 — Project setup
1. `git init`; create repo structure and `.gitignore` (ignore `.env`, `node_modules`, `__pycache__`, `dist`).
2. Add `.env.example` files for root, backend, frontend.

### Phase 1 — Backend foundation
3. `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy, psycopg2-binary, alembic, pydantic-settings, pytest, httpx.
4. `core/config.py` — load `DATABASE_URL`, `CORS_ORIGINS`, etc. via `pydantic-settings`.
5. `core/database.py` — SQLAlchemy engine + `get_db` dependency.
6. Define ORM models (product, customer, order, order_item) with constraints.
7. Initialize Alembic; generate first migration; verify tables.

### Phase 2 — Backend features
8. Pydantic schemas (Create / Update / Read variants).
9. CRUD/service functions per entity + business rules (Section 5).
10. Routers for products, customers, orders, dashboard; wire into `main.py` with CORS.
11. Central exception handlers (NotFound→404, Conflict→409, InsufficientStock→400).
12. `pytest` tests: unique constraints, stock decrement, insufficient-stock rejection, total calc.

### Phase 3 — Frontend
13. Scaffold Vite React app; install axios, react-router-dom.
14. `api/client.js` axios instance reading `VITE_API_BASE_URL`.
15. Shared components: data Table, Modal form, Toast/alert, form validation helpers.
16. Pages: Products (CRUD), Customers (CRD), Orders (create + list + detail), Dashboard (summary cards + low-stock list).
17. Responsive styling (CSS framework or plain CSS grid/flexbox); success/error toasts; client-side form validation.

### Phase 4 — Containerization
18. Backend `Dockerfile` (multi-stage, `python:3.12-slim`, non-root user, runs migrations then uvicorn).
19. Frontend `Dockerfile` (multi-stage: `node:20-alpine` build → `nginx:alpine` serve).
20. `.dockerignore` for each.
21. `docker-compose.yml` — `db`, `backend`, `frontend`; named volume `pgdata`; healthchecks; `depends_on`; env from `.env`.
22. `docker compose up --build` and smoke-test the full stack locally.

### Phase 5 — Deployment
23. Push image to Docker Hub: `docker build`, `docker tag`, `docker push`.
24. Deploy backend (Render/Railway/Fly) + managed Postgres; set env vars.
25. Deploy frontend (Vercel/Netlify); set `VITE_API_BASE_URL` to live backend URL.
26. Set backend `CORS_ORIGINS` to the live frontend URL; verify end-to-end.

### Phase 6 — Submission
27. Finalize README with all URLs; verify deliverables checklist (Section 9).

---

## 7. Docker Setup

### docker-compose.yml (shape)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      retries: 5

  backend:
    build: ./backend
    env_file: .env
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    depends_on:
      - backend
    ports:
      - "5173:80"

volumes:
  pgdata:
```

### Backend Dockerfile (shape)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN adduser --disabled-password appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
USER appuser
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

### Frontend Dockerfile (shape)
```dockerfile
# build stage
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# serve stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**Mandatory Docker requirements covered:** slim/alpine base images ✓, no hardcoded credentials (all via `.env`) ✓, named volume `pgdata` for Postgres persistence ✓, `.dockerignore` per service ✓.

---

## 8. Environment Variables

All config lives in `.env` (git-ignored). `.env.example` is committed as a template.

**Root / Compose `.env`**
```
POSTGRES_USER=app
POSTGRES_PASSWORD=change_me
POSTGRES_DB=inventory
VITE_API_BASE_URL=http://localhost:8000
```

**Backend** (also reads from compose)
```
DATABASE_URL=postgresql://app:change_me@db:5432/inventory
CORS_ORIGINS=http://localhost:5173
```

**Frontend (build-time)**
```
VITE_API_BASE_URL=http://localhost:8000
```

For deployment, the same keys are set in the host platform's dashboard with production values (managed DB URL, live frontend/backend URLs).

---

## 9. Submission Checklist

- [ ] GitHub repo with both `frontend/` and `backend/`
- [ ] Docker Hub image link for the backend image
- [ ] Live frontend URL (Vercel/Netlify) — publicly accessible
- [ ] Live backend URL (Render/Railway/Fly) — `/docs` reachable
- [ ] Frontend ↔ backend communicate (CORS + env vars correct)
- [ ] All env vars configured on both platforms
- [ ] README documents local run (`docker compose up`) + all live URLs

---

## 10. Suggested Timeline

| Phase | Effort |
|---|---|
| 0–1 Setup + backend foundation | ~0.5 day |
| 2 Backend features + tests | ~1 day |
| 3 Frontend | ~1.5 days |
| 4 Containerization | ~0.5 day |
| 5 Deployment | ~0.5 day |
| 6 Docs/submission | ~0.25 day |

See `ARCHITECTURE.md` for system, ER, sequence, and deployment diagrams.
