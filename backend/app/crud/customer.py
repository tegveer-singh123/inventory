from typing import List

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_all(db: Session) -> List[Customer]:
    return db.query(Customer).order_by(Customer.id).all()


def get_by_id(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
    return customer


def create(db: Session, data: CustomerCreate) -> Customer:
    customer = Customer(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
    )
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"A customer with email '{data.email}' already exists",
        )
    return customer


def update(db: Session, customer_id: int, data: CustomerUpdate) -> Customer:
    customer = get_by_id(db, customer_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Email '{data.email}' is already in use")
    return customer


def delete(db: Session, customer_id: int) -> None:
    customer = get_by_id(db, customer_id)
    db.delete(customer)
    db.commit()
