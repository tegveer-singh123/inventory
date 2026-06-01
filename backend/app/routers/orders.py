from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import order as crud
from app.schemas.order import OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderCreate, db: Session = Depends(get_db)) -> OrderRead:
    return crud.create_order(db, data)


@router.get("", response_model=List[OrderRead], status_code=status.HTTP_200_OK)
def list_orders(db: Session = Depends(get_db)) -> List[OrderRead]:
    return crud.get_all(db)


@router.get("/{order_id}", response_model=OrderRead, status_code=status.HTTP_200_OK)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderRead:
    return crud.get_by_id(db, order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
    crud.delete_order(db, order_id)
