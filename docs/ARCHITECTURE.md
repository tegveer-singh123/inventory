# Architecture — Inventory & Order Management System

Diagrams are written in **Mermaid** and render directly on GitHub and most Markdown viewers. Companion to `IMPLEMENTATION_PLAN.md`.

---

## 1. System / Container Architecture

High-level view of the three Dockerized services and how they talk.

```mermaid
flowchart LR
    user([User / Browser])

    subgraph compose["Docker Compose network"]
        subgraph fe["frontend (container)"]
            nginx["Nginx :80<br/>serves React build (Vite)"]
        end
        subgraph be["backend (container)"]
            api["FastAPI + Uvicorn :8000<br/>routers · CRUD · validation"]
        end
        subgraph dbc["db (container)"]
            pg[("PostgreSQL :5432")]
            vol[["named volume: pgdata"]]
        end
    end

    user -->|HTTPS| nginx
    nginx -->|REST / JSON over HTTP| api
    api -->|SQLAlchemy / psycopg2| pg
    pg --- vol
```

---

## 2. Entity-Relationship Diagram

Header/line-item order model supports multiple products per order.

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced by"

    CUSTOMERS {
        int id PK
        string full_name
        string email UK "unique"
        string phone
        timestamp created_at
    }
    PRODUCTS {
        int id PK
        string name
        string sku UK "unique"
        numeric price "ge 0"
        int quantity_in_stock "ge 0 (CHECK)"
        timestamp created_at
    }
    ORDERS {
        int id PK
        int customer_id FK
        numeric total_amount "computed by backend"
        string status
        timestamp created_at
    }
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity "gt 0"
        numeric unit_price "snapshot at order time"
        numeric line_total
    }
```

---

## 3. Order Creation Sequence (with business rules)

Shows validation, the insufficient-stock guard, and the atomic stock-decrement transaction.

```mermaid
sequenceDiagram
    autonumber
    participant FE as React Frontend
    participant API as FastAPI Router
    participant SVC as Order Service / CRUD
    participant DB as PostgreSQL

    FE->>API: POST /orders { customer_id, items[] }
    API->>API: Pydantic validation (types, qty > 0)
    alt invalid payload
        API-->>FE: 422 Unprocessable Entity
    end
    API->>SVC: create_order(payload)
    SVC->>DB: SELECT customer, products
    alt customer/product not found
        SVC-->>API: NotFound
        API-->>FE: 404 Not Found
    end
    SVC->>SVC: check qty <= stock for each item
    alt insufficient stock
        SVC-->>API: InsufficientStock
        API-->>FE: 400 Bad Request (which product)
    end
    Note over SVC,DB: single transaction (atomic)
    SVC->>DB: BEGIN
    SVC->>DB: UPDATE products SET stock = stock - qty
    SVC->>SVC: total = Σ(unit_price × qty)
    SVC->>DB: INSERT order + order_items
    SVC->>DB: COMMIT
    DB-->>SVC: ok
    SVC-->>API: order
    API-->>FE: 201 Created { order, total_amount }
```

---

## 4. Request Flow / Layered Backend

How a request moves through the backend layers.

```mermaid
flowchart TD
    req["HTTP request"] --> router["Router (FastAPI)<br/>routing + status codes"]
    router --> schema["Pydantic schema<br/>validate request data"]
    schema --> svc["CRUD / Service layer<br/>business rules"]
    svc --> orm["SQLAlchemy models / ORM"]
    orm --> db[("PostgreSQL")]
    svc -. raises .-> exc["Exception handlers"]
    exc --> resp["Error response<br/>404 / 409 / 400 / 422"]
    svc --> out["Pydantic response schema"]
    out --> resp2["JSON response<br/>200 / 201 / 204"]
```

---

## 5. Deployment Topology (Production)

Free-tier hosting with managed Postgres; frontend and backend on separate platforms.

```mermaid
flowchart LR
    user([User])

    subgraph edge["Vercel / Netlify"]
        spa["React SPA (static build)<br/>VITE_API_BASE_URL → backend"]
    end

    subgraph host["Render / Railway / Fly.io"]
        api["FastAPI container<br/>(from Docker Hub image)"]
        mdb[("Managed PostgreSQL")]
    end

    hub[["Docker Hub<br/>backend image"]]

    user -->|HTTPS| spa
    spa -->|HTTPS REST + CORS| api
    api --> mdb
    hub -.pulled by.-> api
```

---

## 6. Local Dev vs Production

```mermaid
flowchart TB
    subgraph local["Local (docker compose up)"]
        L1["frontend :5173 (nginx)"]
        L2["backend :8000"]
        L3[("postgres :5432 + pgdata volume")]
        L1 --> L2 --> L3
    end
    subgraph prod["Production"]
        P1["Vercel/Netlify (SPA)"]
        P2["Render/Railway (API)"]
        P3[("Managed Postgres")]
        P1 --> P2 --> P3
    end
```

| Concern | Local | Production |
|---|---|---|
| Frontend host | nginx container `:5173` | Vercel / Netlify |
| Backend host | container `:8000` | Render / Railway / Fly |
| Database | postgres container + `pgdata` | Managed Postgres |
| API base URL | `http://localhost:8000` | live backend HTTPS URL |
| CORS origins | `http://localhost:5173` | live frontend URL |
| Secrets | root `.env` | platform env-var dashboards |
