from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel

class ServiceOrderStatus(str, Enum):
    planned = "planned"
    in_progress = "in_progress"
    done = "done"
    canceled = "canceled"


RateTier = Literal["A", "B", "C"]


# ---------------- Clients ----------------
class ClientCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ClientOut(BaseModel):
    id: int
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------- Fields (Predios) ----------------
class FieldCreate(BaseModel):
    client_id: int
    name: str
    location_text: Optional[str] = None
    area_ha_registered: Optional[float] = None
    polygon_geojson: Optional[str] = None
    external_source: Optional[str] = None
    external_field_number: Optional[str] = None
    last_mapping_at: Optional[datetime] = None
    last_mapping_area_ha: Optional[float] = None
    notes: Optional[str] = None


class FieldOut(BaseModel):
    id: int
    client_id: int
    name: str
    location_text: Optional[str] = None
    area_ha_registered: Optional[float] = None
    polygon_geojson: Optional[str] = None
    external_source: Optional[str] = None
    external_field_number: Optional[str] = None
    last_mapping_at: Optional[datetime] = None
    last_mapping_area_ha: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------- Service Orders (Servicios) ----------------
class ServiceOrderCreate(BaseModel):
    client_id: int
    field_id: Optional[int] = None

    service_type: str = "fumigacion"
    status: ServiceOrderStatus = ServiceOrderStatus.planned

    scheduled_at: Optional[datetime] = None

    crop_type: Optional[str] = None

    hectares_covered: float = 0.0

    rate_tier: RateTier
    rate_per_ha: float

    distance_km: Optional[float] = None
    volume_commitment_ha: Optional[float] = None

    currency: str = "MXN"
    notes: Optional[str] = None


class ServiceOrderUpdate(BaseModel):
    field_id: Optional[int] = None
    service_type: Optional[str] = None
    status: Optional[ServiceOrderStatus] = None

    scheduled_at: Optional[datetime] = None
    performed_at: Optional[datetime] = None

    crop_type: Optional[str] = None

    hectares_covered: Optional[float] = None
    rate_tier: Optional[RateTier] = None
    rate_per_ha: Optional[float] = None

    distance_km: Optional[float] = None
    volume_commitment_ha: Optional[float] = None

    currency: Optional[str] = None
    notes: Optional[str] = None
    pilot_brought_client: Optional[bool] = None


class ServiceOrderOut(BaseModel):
    id: int
    client_id: int
    field_id: Optional[int] = None
    service_type: str
    status: str
    scheduled_at: Optional[datetime] = None
    performed_at: Optional[datetime] = None
    crop_type: Optional[str] = None

    hectares_covered: float
    rate_tier: str
    rate_per_ha: float
    distance_km: Optional[float] = None
    volume_commitment_ha: Optional[float] = None

    total_amount: float
    currency: str

    client_paid_total: float = 0.0
    dronic_received_total: float = 0.0
    dronic_receipt_verified_at: Optional[datetime] = None
    dronic_receipt_verified_by: Optional[str] = None

    notes: Optional[str] = None
    pilot_brought_client: Optional[bool] = None
    pilot_fee: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- Payments ----------------
class PaymentCreate(BaseModel):
    client_id: int
    service_order_id: int | None = None
    amount: float
    status: str = "posted"
    method: str = "transfer"
    reference: str | None = None
    notes: str | None = None


class PaymentOut(BaseModel):
    id: int
    client_id: int
    service_order_id: int | None = None
    amount: float
    status: str
    paid_at: datetime
    posted_at: datetime | None = None
    method: str
    reference: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True


# ---------------- Payment Events ----------------
class PaymentEventCreate(BaseModel):
    event_type: Literal["customer_payment", "operator_handover", "dronic_receipt", "direct_payment"]
    amount: float
    currency: str = "MXN"
    method: str | None = None
    reference: str | None = None
    notes: str | None = None
    from_label: str | None = None
    to_label: str | None = None
    recorded_by: str | None = None


class PaymentEventOut(BaseModel):
    id: int
    service_order_id: int
    event_type: str
    amount: float
    currency: str
    method: str | None = None
    reference: str | None = None
    notes: str | None = None
    from_label: str | None = None
    to_label: str | None = None
    recorded_at: datetime
    recorded_by: str | None = None
    is_voided: bool = False
    voided_at: datetime | None = None
    voided_by: str | None = None
    void_reason: str | None = None

    class Config:
        from_attributes = True


class VoidPayload(BaseModel):
    void_reason: str
    voided_by: str | None = None


# ---------------- Order Expenses ----------------
class OrderExpenseCreate(BaseModel):
    expense_type: Literal["fuel", "toll", "labor", "other"]
    amount: float
    currency: str = "MXN"
    liters: float | None = None
    reference: str | None = None
    description: str | None = None
    notes: str | None = None
    recorded_by: str | None = None


class OrderExpenseOut(BaseModel):
    id: int
    service_order_id: int
    expense_type: str
    amount: float
    currency: str
    liters: float | None = None
    reference: str | None = None
    description: str | None = None
    notes: str | None = None
    recorded_at: datetime
    recorded_by: str | None = None
    is_voided: bool = False
    voided_at: datetime | None = None
    voided_by: str | None = None
    void_reason: str | None = None

    class Config:
        from_attributes = True


class ServiceOrderExpensesOut(BaseModel):
    service_order_id: int
    total_expenses: float
    items: list[OrderExpenseOut]


# ---------------- Balance ----------------
from pydantic import BaseModel


class ClientBalanceOut(BaseModel):
    client_id: int
    total_billed: float
    total_paid: float
    balance_due: float
    done_orders_count: int = 0
    open_orders_count: int = 0


# ---------------- Assets ----------------
class AssetCreate(BaseModel):
    client_id: int
    field_id: int | None = None
    service_order_id: int | None = None

    asset_type: str
    file_url: str | None = None
    file_path: str | None = None  # solo si ya existe en disco (caso admin/dev)
    captured_at: datetime | None = None
    metadata_json: str | None = None
    notes: str | None = None


class AssetOut(BaseModel):
    id: int
    client_id: int
    field_id: int | None = None
    service_order_id: int | None = None

    asset_type: str

    original_name: str | None = None
    stored_name: str | None = None
    mime_type: str | None = None
    size_bytes: int | None = None

    file_url: str | None = None
    file_path: str | None = None

    captured_at: datetime | None = None
    created_at: datetime | None = None

    metadata_json: str | None = None
    notes: str | None = None
    is_deleted: bool | None = None

    class Config:
        from_attributes = True

class ClientOverviewOut(BaseModel):
    client_id: int
    client_name: str

    total_service_orders: int
    open_orders_count: int
    done_orders_count: int

    total_billed: float
    total_paid: float
    balance_due: float

    last_service_at: datetime | None = None
    assets_count: int



# ---------------- Timeline ----------------
TimelineEventType = Literal["service_order", "payment", "asset"]


class TimelineRef(BaseModel):
    entity: str
    id: int


class TimelineItem(BaseModel):
    id: str
    type: TimelineEventType
    occurred_at: datetime
    title: str
    summary: str | None = None
    ref: TimelineRef
    data: dict[str, Any]


class ClientTimelineOut(BaseModel):
    client_id: int
    items: list[TimelineItem]
    next_before: datetime | None = None