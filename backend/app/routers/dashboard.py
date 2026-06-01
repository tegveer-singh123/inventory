from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.product import ProductRead

LOW_STOCK_THRESHOLD = 10

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductRead]

    model_config = ConfigDict(from_attributes=True)


@router.get("/summary", response_model=DashboardSummary, status_code=200)
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    low_stock_products = (
        db.query(Product)
        .filter(Product.quantity_in_stock < LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity_in_stock)
        .all()
    )

    return DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock_products,
    )
