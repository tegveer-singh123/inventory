from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import product as crud
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate, StockUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db)) -> ProductRead:
    return crud.create(db, data)


@router.get("", response_model=List[ProductRead], status_code=status.HTTP_200_OK)
def list_products(db: Session = Depends(get_db)) -> List[ProductRead]:
    return crud.get_all(db)


@router.get("/{product_id}", response_model=ProductRead, status_code=status.HTTP_200_OK)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductRead:
    return crud.get_by_id(db, product_id)


@router.put("/{product_id}", response_model=ProductRead, status_code=status.HTTP_200_OK)
def update_product(
    product_id: int, data: ProductUpdate, db: Session = Depends(get_db)
) -> ProductRead:
    return crud.update(db, product_id, data)


@router.patch("/{product_id}/stock", response_model=ProductRead, status_code=status.HTTP_200_OK)
def update_stock(product_id: int, data: StockUpdate, db: Session = Depends(get_db)) -> ProductRead:
    return crud.update_stock(db, product_id, data.quantity_in_stock)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    crud.delete(db, product_id)
