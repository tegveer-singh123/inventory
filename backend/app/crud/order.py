from decimal import Decimal
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


def get_all(db: Session) -> List[Order]:
    return (
        db.query(Order)
        .options(selectinload(Order.items))
        .order_by(Order.id)
        .all()
    )


def get_by_id(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


def create_order(db: Session, data: OrderCreate) -> Order:
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if customer is None:
        raise HTTPException(
            status_code=404, detail=f"Customer {data.customer_id} not found"
        )

    # Validate all products and check stock within one transaction
    order_items_data: list[dict] = []
    total_amount = Decimal("0.00")

    for item_in in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == item_in.product_id)
            .with_for_update()
            .first()
        )
        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item_in.product_id} not found",
            )
        if product.quantity_in_stock < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {item_in.quantity}, available: {product.quantity_in_stock}"
                ),
            )
        unit_price = Decimal(str(product.price))
        quantity = item_in.quantity
        line_total = unit_price * quantity
        total_amount += line_total

        order_items_data.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )

    # Create order
    order = Order(
        customer_id=data.customer_id,
        total_amount=total_amount,
        status="active",
    )
    db.add(order)
    db.flush()  # get order.id before creating items

    # Create order items and decrement stock
    for item_data in order_items_data:
        product: Product = item_data["product"]
        product.quantity_in_stock -= item_data["quantity"]

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=item_data["line_total"],
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)

    # Reload with items
    return get_by_id(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Restock products atomically
    for item in order.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )
        if product is not None:
            product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
