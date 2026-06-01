# Inventory OS

> A professional Inventory & Order Management system — track products, manage customers, and process orders from a sleek dark-mode dashboard.

![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

---

## Overview

Inventory OS is a full-stack web application for small-to-medium businesses to manage their product catalogue, customer base, and order pipeline. It provides real-time stock signals, customer order histories, and a live operations dashboard — all served from a containerised three-service Docker setup.

---

## Tech Stack

| Layer      | Technology             | Notes                                      |
|------------|------------------------|--------------------------------------------|
| Backend    | FastAPI                | Python 3.12, async-capable ASGI            |
| ORM        | SQLAlchemy 2.x         | Declarative models, `Mapped` type hints    |
| Validation | Pydantic v2            | Schema validation with `model_dump`        |
| Database   | PostgreSQL 16          | Alpine image, health-checked               |
| Frontend   | React 18 + Vite        | JSX only, no TypeScript                    |
| Styling    | Custom CSS             | CSS variables, no UI library               |
| Auth       | JWT (python-jose)      | Bearer token, `AuthContext` on frontend    |
| Container  | Docker Compose         | Three services: db, backend, frontend      |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Docker Compose                          │
│                                                              │
│  ┌─────────────┐    HTTP     ┌─────────────────────────┐    │
│  │  frontend   │ ──────────► │       backend           │    │
│  │  React 18   │  :8000      │  FastAPI + SQLAlchemy   │    │
│  │  Vite dev   │             │  Pydantic v2 schemas    │    │
│  │  :5173      │             └────────────┬────────────┘    │
│  └─────────────┘                          │ psycopg2         │
│                                           ▼                  │
│                              ┌────────────────────────┐     │
│                              │          db             │     │
│                              │  PostgreSQL 16 Alpine   │     │
│                              │  pgdata volume          │     │
│                              └────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## Features

### Products
- List, create, edit, and delete products
- SKU-based deduplication (409 on conflict)
- Direct stock adjustment via `PATCH /products/{id}/stock`
- Visual stock signals: CRITICAL / LOW / OK / HIGH

### Customers
- List, create, edit, and delete customers
- Customer profile page with total orders, total spent, and average order value
- Full order history per customer
- Email uniqueness enforced (409 on conflict)

### Orders
- Create orders with multiple line items; unit price captured at order time
- Order detail page with full item breakdown and grand total
- Status badge (active / pending / completed / cancelled)
- Delete order with confirmation

### Dashboard
- Live counts: total products, customers, orders
- Low-stock alert table with stock signal pills (OUT / CRITICAL / LOW)
- Real-time clock

### Auth
- JWT login (`POST /auth/login`)
- Token stored in `localStorage`; axios interceptor attaches Bearer header
- `GET /auth/me` to verify session; protected routes redirect to `/login`

---

## Quick Start (Docker)

```bash
git clone <repo-url>
cd inventory
cp .env.example .env          # fill in POSTGRES_USER, POSTGRES_PASSWORD, SECRET_KEY
docker compose up -d --build
```

| Service      | URL                            |
|--------------|-------------------------------|
| Frontend     | http://localhost:5173          |
| Backend API  | http://localhost:8000          |
| API Docs     | http://localhost:8000/docs     |
| Demo login   | admin@example.com / admin123   |

---

## Makefile Commands

| Target             | Description                                          |
|--------------------|------------------------------------------------------|
| `make up`          | Start all services (detached)                        |
| `make up-build`    | Build images and start all services                  |
| `make build`       | Build/rebuild images only                            |
| `make down`        | Stop and remove containers                           |
| `make down-v`      | Stop containers and remove volumes (wipes DB)        |
| `make logs`        | Tail logs for all services                           |
| `make logs-backend`| Tail backend logs only                               |
| `make ps`          | Show running containers                              |
| `make restart`     | Restart all services                                 |
| `make restart-backend` | Restart backend only                             |
| `make shell-backend`   | Open a shell inside the backend container        |
| `make shell-db`    | Open psql in the database container                  |
| `make migrate`     | Run Alembic migrations inside the backend container  |
| `make test`        | Run pytest in a fresh container (SQLite)             |
| `make test-local`  | Run pytest locally (requires active venv)            |
| `make sync`        | Copy local backend code into running container       |
| `make lint`        | Run ruff linter on the backend                       |
| `make install`     | Install backend Python deps into local venv          |
| `make clean`       | Remove Python cache files                            |

---

## API Reference

### Products

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/products`                   | List all products                    |
| POST   | `/products`                   | Create a product                     |
| GET    | `/products/{id}`              | Get product by ID                    |
| PUT    | `/products/{id}`              | Update product                       |
| PATCH  | `/products/{id}/stock`        | Set stock to an absolute quantity    |
| DELETE | `/products/{id}`              | Delete product                       |

### Customers

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/customers`                  | List all customers                   |
| POST   | `/customers`                  | Create a customer                    |
| GET    | `/customers/{id}`             | Get customer by ID                   |
| PUT    | `/customers/{id}`             | Update customer                      |
| GET    | `/customers/{id}/orders`      | Get all orders for a customer        |
| DELETE | `/customers/{id}`             | Delete customer                      |

### Orders

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/orders`                     | List all orders                      |
| POST   | `/orders`                     | Create an order                      |
| GET    | `/orders/{id}`                | Get order by ID                      |
| DELETE | `/orders/{id}`                | Delete order                         |

### Dashboard

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/dashboard/summary`          | Counts + low-stock product list      |

### Auth

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/auth/login`                 | Login; returns JWT access token      |
| GET    | `/auth/me`                    | Return current authenticated user    |

---

## Data Model

**products** — Catalogue items. Fields: `id`, `name`, `sku` (unique), `price` (Numeric 10,2), `quantity_in_stock`, `created_at`.

**customers** — Buyers. Fields: `id`, `full_name`, `email` (unique), `phone` (nullable), `created_at`.

**orders** — Purchase records linked to a customer. Fields: `id`, `customer_id` (FK), `total_amount` (Numeric 10,2), `status` (active/pending/completed/cancelled), `created_at`.

**order_items** — Line items within an order. Fields: `id`, `order_id` (FK), `product_id` (FK), `quantity`, `unit_price` (price captured at order time), `line_total`.

**users** — System accounts for authentication. Fields: `id`, `email` (unique), `hashed_password`, `is_active`, `created_at`.

---

## Business Rules

1. SKUs must be unique across all products; duplicate SKU on create or update returns HTTP 409.
2. Customer email addresses must be unique; duplicate email returns HTTP 409.
3. `quantity_in_stock` cannot be set to a negative value; attempts return HTTP 422.
4. Product price cannot be negative; attempts return HTTP 422.
5. Orders must contain at least one line item with a quantity greater than zero.
6. Unit price on an order item is captured from the product's current price at the time of order creation and is not affected by future price changes.
7. Deleting an order cascades to all its order items.
8. Accessing any protected route without a valid JWT redirects to the login page.

---

## Environment Variables

| Variable            | Required | Description                                       |
|---------------------|----------|---------------------------------------------------|
| `POSTGRES_USER`     | Yes      | PostgreSQL username                               |
| `POSTGRES_PASSWORD` | Yes      | PostgreSQL password                               |
| `POSTGRES_DB`       | Yes      | PostgreSQL database name                          |
| `DATABASE_URL`      | Yes      | Full connection string (set automatically in Compose) |
| `SECRET_KEY`        | Yes      | JWT signing secret (min 32 chars recommended)     |
| `ALGORITHM`         | No       | JWT algorithm (default: `HS256`)                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token TTL in minutes (default: 60)          |
| `CORS_ORIGINS`      | No       | Comma-separated allowed origins (default: `http://localhost:5173`) |
| `VITE_API_BASE_URL` | No       | Backend URL used by the frontend (default: `http://localhost:8000`) |

---

## Project Structure

```
inventory/
├── docker-compose.yml
├── Makefile
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app factory, router registration
│       ├── core/
│       │   ├── database.py       # SQLAlchemy engine, session, Base
│       │   ├── security.py       # JWT creation & verification
│       │   └── config.py         # Settings via pydantic-settings
│       ├── models/
│       │   ├── product.py
│       │   ├── customer.py
│       │   ├── order.py
│       │   ├── order_item.py
│       │   └── user.py
│       ├── schemas/
│       │   ├── product.py        # ProductCreate, ProductUpdate, StockUpdate, ProductRead
│       │   ├── customer.py       # CustomerCreate, CustomerUpdate, CustomerRead
│       │   └── order.py          # OrderCreate, OrderRead, OrderItemRead
│       ├── crud/
│       │   ├── product.py
│       │   ├── customer.py
│       │   └── order.py
│       ├── routers/
│       │   ├── products.py
│       │   ├── customers.py
│       │   ├── orders.py
│       │   ├── dashboard.py
│       │   └── auth.py
│       └── tests/
│           └── test_products.py
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── DataTable.jsx
        │   ├── Modal.jsx
        │   ├── Toast.jsx
        │   ├── StatusBadge.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Products.jsx
            ├── Customers.jsx
            ├── CustomerProfile.jsx
            ├── Orders.jsx
            ├── OrderDetail.jsx
            └── Login.jsx
```

---

## Deployment

### Render / Railway (Backend)
1. Push the `backend/` directory as a Python web service.
2. Set all environment variables from the table above in the service dashboard.
3. Set the start command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Attach a managed PostgreSQL database and set `DATABASE_URL` accordingly.

### Vercel / Netlify (Frontend)
1. Set the build command to `npm run build` and publish directory to `dist`.
2. Set `VITE_API_BASE_URL` to your deployed backend URL.
3. Add a rewrite rule so all paths (`/*`) serve `index.html` for client-side routing.

### Docker Hub

The backend image is published at:
* **Docker Hub Repository**: [amannc2721/inventory-backend](https://hub.docker.com/r/amannc2721/inventory-backend)
* **Image**: `amannc2721/inventory-backend:latest`

#### Commands:
1. Build and tag the backend image:
   ```bash
   docker build -t amannc2721/inventory-backend:latest ./backend
   ```
2. Push:
   ```bash
   docker push amannc2721/inventory-backend:latest
   ```
3. Update `docker-compose.yml` to reference the published image instead of the local build context.
