from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_all(db: Session) -> List[Product]:
    return db.query(Product).order_by(Product.id).all()


def get_by_id(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return product


def create(db: Session, data: ProductCreate) -> Product:
    product = Product(
        name=data.name,
        sku=data.sku,
        price=data.price,
        quantity_in_stock=data.quantity_in_stock,
    )
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"A product with SKU '{data.sku}' already exists",
        )
    return product


def update(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_by_id(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"A product with SKU '{data.sku}' already exists",
        )
    return product


def update_stock(db: Session, product_id: int, quantity: int) -> Product:
    if quantity < 0:
        raise HTTPException(status_code=422, detail="Stock quantity cannot be negative")
    product = get_by_id(db, product_id)
    product.quantity_in_stock = quantity
    db.commit()
    db.refresh(product)
    return product


def delete(db: Session, product_id: int) -> None:
    product = get_by_id(db, product_id)
    db.delete(product)
    db.commit()
