from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.crud import customer as crud
from app.models.order import Order
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.schemas.order import OrderRead

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)) -> CustomerRead:
    return crud.create(db, data)


@router.get("", response_model=List[CustomerRead], status_code=status.HTTP_200_OK)
def list_customers(db: Session = Depends(get_db)) -> List[CustomerRead]:
    return crud.get_all(db)


@router.get("/{customer_id}", response_model=CustomerRead, status_code=status.HTTP_200_OK)
def get_customer(customer_id: int, db: Session = Depends(get_db)) -> CustomerRead:
    return crud.get_by_id(db, customer_id)


@router.put("/{customer_id}", response_model=CustomerRead, status_code=status.HTTP_200_OK)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)) -> CustomerRead:
    return crud.update(db, customer_id, data)


@router.get("/{customer_id}/orders", response_model=List[OrderRead])
def get_customer_orders(customer_id: int, db: Session = Depends(get_db)) -> List[OrderRead]:
    crud.get_by_id(db, customer_id)  # validates customer exists → 404 if not
    orders = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)) -> None:
    crud.delete(db, customer_id)
