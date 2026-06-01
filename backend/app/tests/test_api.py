"""
Comprehensive API tests for the Inventory & Order Management System.
Runs against the real PostgreSQL database — each test starts with clean tables.
"""
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_product(client: TestClient, name="Widget", sku="SKU-001", price="9.99", qty=100):
    return client.post("/products", json={
        "name": name,
        "sku": sku,
        "price": price,
        "quantity_in_stock": qty,
    })


def create_customer(client: TestClient, full_name="Alice Smith", email="alice@example.com", phone="555-1234"):
    return client.post("/customers", json={
        "full_name": full_name,
        "email": email,
        "phone": phone,
    })


# ---------------------------------------------------------------------------
# Product tests
# ---------------------------------------------------------------------------

class TestProducts:

    def test_create_product_201(self, client):
        """Create product returns 201 and the created product data."""
        resp = create_product(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["sku"] == "SKU-001"
        assert data["name"] == "Widget"
        assert "id" in data
        assert "created_at" in data

    def test_duplicate_sku_409(self, client):
        """Creating a product with an existing SKU returns 409."""
        create_product(client)
        resp = create_product(client)  # same SKU
        assert resp.status_code == 409

    def test_list_products_200(self, client):
        """GET /products returns 200 and a list."""
        create_product(client, sku="SKU-001")
        create_product(client, name="Gadget", sku="SKU-002")
        resp = client.get("/products")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_get_product_200(self, client):
        """GET /products/{id} returns 200 for existing product."""
        created = create_product(client).json()
        resp = client.get(f"/products/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_get_product_404(self, client):
        """GET /products/{id} returns 404 for missing product."""
        resp = client.get("/products/99999")
        assert resp.status_code == 404

    def test_update_product_200(self, client):
        """PUT /products/{id} updates fields and returns 200."""
        created = create_product(client).json()
        resp = client.put(f"/products/{created['id']}", json={"name": "Updated Widget", "price": "19.99"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Widget"
        assert Decimal(data["price"]) == Decimal("19.99")

    def test_update_product_duplicate_sku_409(self, client):
        """PUT /products/{id} with a SKU that belongs to another product returns 409."""
        p1 = create_product(client, sku="SKU-001").json()
        create_product(client, name="Gadget", sku="SKU-002")
        resp = client.put(f"/products/{p1['id']}", json={"sku": "SKU-002"})
        assert resp.status_code == 409

    def test_delete_product_204(self, client):
        """DELETE /products/{id} returns 204 and product is gone."""
        created = create_product(client).json()
        resp = client.delete(f"/products/{created['id']}")
        assert resp.status_code == 204
        assert client.get(f"/products/{created['id']}").status_code == 404

    def test_create_product_negative_price_422(self, client):
        """Creating a product with negative price returns 422."""
        resp = client.post("/products", json={
            "name": "Bad Product",
            "sku": "BAD-001",
            "price": "-5.00",
            "quantity_in_stock": 10,
        })
        assert resp.status_code == 422

    def test_create_product_negative_quantity_422(self, client):
        """Creating a product with negative quantity returns 422."""
        resp = client.post("/products", json={
            "name": "Bad Product",
            "sku": "BAD-002",
            "price": "5.00",
            "quantity_in_stock": -1,
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Customer tests
# ---------------------------------------------------------------------------

class TestCustomers:

    def test_create_customer_201(self, client):
        """Create customer returns 201."""
        resp = create_customer(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "alice@example.com"
        assert "id" in data

    def test_duplicate_email_409(self, client):
        """Creating a customer with an existing email returns 409."""
        create_customer(client)
        resp = create_customer(client)  # same email
        assert resp.status_code == 409

    def test_list_customers_200(self, client):
        """GET /customers returns 200 and a list."""
        create_customer(client, email="alice@example.com")
        create_customer(client, full_name="Bob", email="bob@example.com")
        resp = client.get("/customers")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_customer_200(self, client):
        """GET /customers/{id} returns 200 for existing customer."""
        created = create_customer(client).json()
        resp = client.get(f"/customers/{created['id']}")
        assert resp.status_code == 200

    def test_get_customer_404(self, client):
        """GET /customers/{id} returns 404 for missing customer."""
        resp = client.get("/customers/99999")
        assert resp.status_code == 404

    def test_delete_customer_204(self, client):
        """DELETE /customers/{id} returns 204 and customer is gone."""
        created = create_customer(client).json()
        resp = client.delete(f"/customers/{created['id']}")
        assert resp.status_code == 204
        assert client.get(f"/customers/{created['id']}").status_code == 404

    def test_invalid_email_422(self, client):
        """Creating a customer with an invalid email returns 422."""
        resp = client.post("/customers", json={
            "full_name": "Bad User",
            "email": "not-an-email",
            "phone": "000",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Order tests
# ---------------------------------------------------------------------------

class TestOrders:

    def _setup(self, client):
        """Create a product and a customer for order tests."""
        product = create_product(client, sku="PROD-001", price="10.00", qty=50).json()
        customer = create_customer(client, email="buyer@example.com").json()
        return product, customer

    def test_create_order_201(self, client):
        """Create order returns 201, stock is decremented, total is correct."""
        product, customer = self._setup(client)
        resp = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 3}],
        })
        assert resp.status_code == 201
        data = resp.json()
        assert Decimal(data["total_amount"]) == Decimal("30.00")
        assert data["customer_id"] == customer["id"]
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 3
        assert Decimal(data["items"][0]["unit_price"]) == Decimal("10.00")
        assert Decimal(data["items"][0]["line_total"]) == Decimal("30.00")

        # Verify stock was decremented
        updated_product = client.get(f"/products/{product['id']}").json()
        assert updated_product["quantity_in_stock"] == 47

    def test_order_stock_decremented(self, client):
        """Stock is decremented correctly after order creation."""
        product, customer = self._setup(client)
        client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 10}],
        })
        updated = client.get(f"/products/{product['id']}").json()
        assert updated["quantity_in_stock"] == 40

    def test_order_total_calculated_correctly(self, client):
        """Total amount is calculated server-side from unit prices."""
        # Create two products
        p1 = create_product(client, sku="PROD-A", price="5.00", qty=20).json()
        p2 = create_product(client, name="Gadget", sku="PROD-B", price="15.00", qty=20).json()
        customer = create_customer(client, email="buyer2@example.com").json()

        resp = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [
                {"product_id": p1["id"], "quantity": 2},
                {"product_id": p2["id"], "quantity": 3},
            ],
        })
        assert resp.status_code == 201
        # 2 * 5.00 + 3 * 15.00 = 10.00 + 45.00 = 55.00
        assert Decimal(resp.json()["total_amount"]) == Decimal("55.00")

    def test_order_insufficient_stock_400(self, client):
        """Order with quantity exceeding stock returns 400."""
        product, customer = self._setup(client)
        resp = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 1000}],
        })
        assert resp.status_code == 400

    def test_order_missing_customer_404(self, client):
        """Order with non-existent customer returns 404."""
        product = create_product(client).json()
        resp = client.post("/orders", json={
            "customer_id": 99999,
            "items": [{"product_id": product["id"], "quantity": 1}],
        })
        assert resp.status_code == 404

    def test_order_missing_product_404(self, client):
        """Order with non-existent product returns 404."""
        customer = create_customer(client).json()
        resp = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": 99999, "quantity": 1}],
        })
        assert resp.status_code == 404

    def test_get_order_200(self, client):
        """GET /orders/{id} returns 200 for existing order."""
        product, customer = self._setup(client)
        order = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 1}],
        }).json()
        resp = client.get(f"/orders/{order['id']}")
        assert resp.status_code == 200

    def test_get_order_404(self, client):
        """GET /orders/{id} returns 404 for missing order."""
        resp = client.get("/orders/99999")
        assert resp.status_code == 404

    def test_list_orders_200(self, client):
        """GET /orders returns 200 and a list."""
        product, customer = self._setup(client)
        client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 1}],
        })
        resp = client.get("/orders")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) == 1

    def test_delete_order_restocks_products(self, client):
        """DELETE /orders/{id} returns 204 and restores product stock."""
        product, customer = self._setup(client)
        initial_stock = product["quantity_in_stock"]

        order = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 5}],
        }).json()

        # Verify stock was decremented
        mid_stock = client.get(f"/products/{product['id']}").json()["quantity_in_stock"]
        assert mid_stock == initial_stock - 5

        # Delete order
        resp = client.delete(f"/orders/{order['id']}")
        assert resp.status_code == 204

        # Verify stock was restored
        final_stock = client.get(f"/products/{product['id']}").json()["quantity_in_stock"]
        assert final_stock == initial_stock

    def test_delete_order_404(self, client):
        """DELETE /orders/{id} returns 404 for missing order."""
        resp = client.delete("/orders/99999")
        assert resp.status_code == 404

    def test_order_zero_quantity_422(self, client):
        """Order item with zero quantity returns 422."""
        product, customer = self._setup(client)
        resp = client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 0}],
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Dashboard tests
# ---------------------------------------------------------------------------

class TestDashboard:

    def test_dashboard_summary_counts(self, client):
        """Dashboard summary returns correct product, customer, and order counts."""
        # Create 2 products
        p1 = create_product(client, sku="DASH-001", qty=50).json()
        create_product(client, name="Gadget", sku="DASH-002", qty=5).json()
        # Create 1 customer
        customer = create_customer(client, email="dash@example.com").json()
        # Create 1 order
        client.post("/orders", json={
            "customer_id": customer["id"],
            "items": [{"product_id": p1["id"], "quantity": 2}],
        })

        resp = client.get("/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_products"] == 2
        assert data["total_customers"] == 1
        assert data["total_orders"] == 1

    def test_dashboard_low_stock_products(self, client):
        """Dashboard summary correctly identifies products with stock < 10."""
        # qty=5 is below threshold (10)
        create_product(client, sku="LOW-001", qty=5)
        # qty=50 is above threshold
        create_product(client, name="Plentiful", sku="HIGH-001", qty=50)
        # qty=9 is below threshold
        create_product(client, name="Almost Gone", sku="LOW-002", qty=9)
        # qty=10 is NOT below threshold (strictly less than 10)
        create_product(client, name="Exactly Ten", sku="EXACT-010", qty=10)

        resp = client.get("/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()

        low_skus = {p["sku"] for p in data["low_stock_products"]}
        assert "LOW-001" in low_skus
        assert "LOW-002" in low_skus
        assert "HIGH-001" not in low_skus
        assert "EXACT-010" not in low_skus

    def test_dashboard_empty_state(self, client):
        """Dashboard summary works with empty database."""
        resp = client.get("/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_products"] == 0
        assert data["total_customers"] == 0
        assert data["total_orders"] == 0
        assert data["low_stock_products"] == []
