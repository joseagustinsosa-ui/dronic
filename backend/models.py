from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    BigInteger,
    Boolean,
)
from sqlalchemy.orm import relationship
from db import Base


# ─────────────────────────────────────────
# Clients
# ─────────────────────────────────────────
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, index=True, nullable=False)
    contact_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    status = Column(String, default="active")  # active/inactive
    notes = Column(Text, nullable=True)

    fields = relationship("Field",
                          back_populates="client",
                          cascade="all, delete-orphan")
    service_orders = relationship("ServiceOrder",
                                  back_populates="client",
                                  cascade="all, delete-orphan")
    payments = relationship("Payment",
                            back_populates="client",
                            cascade="all, delete-orphan")


# ─────────────────────────────────────────
# Fields
# ─────────────────────────────────────────
class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)

    name = Column(String, index=True, nullable=False)
    location_text = Column(String, nullable=True)

    area_ha_registered = Column(Float, nullable=True)
    polygon_geojson = Column(Text, nullable=True)

    external_source = Column(String, nullable=True)
    external_field_number = Column(String, nullable=True)
    last_mapping_at = Column(DateTime, nullable=True)
    last_mapping_area_ha = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)

    client = relationship("Client", back_populates="fields")
    service_orders = relationship("ServiceOrder", back_populates="field")
    assets = relationship("Asset", back_populates="field")


# ─────────────────────────────────────────
# Service Orders
# ─────────────────────────────────────────
class ServiceOrder(Base):
    __tablename__ = "service_orders"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)

    service_type = Column(String, default="fumigacion")
    status = Column(String, default="planned")

    scheduled_at = Column(DateTime, nullable=True)
    performed_at = Column(DateTime, nullable=True)

    crop_type = Column(String, nullable=True)

    hectares_covered = Column(Float, default=0.0)

    rate_tier = Column(String, nullable=False)
    rate_per_ha = Column(Float, nullable=False)

    distance_km = Column(Float, nullable=True)
    volume_commitment_ha = Column(Float, nullable=True)

    total_amount = Column(Float, default=0.0)

    currency = Column(String, default="MXN")

    client_paid_total = Column(Float, nullable=False, default=0.0)
    dronic_received_total = Column(Float, nullable=False, default=0.0)
    pilot_brought_client = Column(Boolean, nullable=True)
    pilot_fee = Column(Float, nullable=True)
    dronic_receipt_verified_at = Column(DateTime(timezone=True), nullable=True)
    dronic_receipt_verified_by = Column(String, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    client = relationship("Client", back_populates="service_orders")
    field = relationship("Field", back_populates="service_orders")

    flights = relationship("Flight",
                           back_populates="service_order",
                           cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="service_order")
    reports = relationship("Report",
                           back_populates="service_order",
                           cascade="all, delete-orphan")
    payment_events = relationship("PaymentEvent",
                                  back_populates="service_order",
                                  cascade="all, delete-orphan")
    expenses = relationship("OrderExpense",
                            back_populates="service_order",
                            cascade="all, delete-orphan")


# ─────────────────────────────────────────
# Flights
# ─────────────────────────────────────────
class Flight(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=False)

    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    pilot_name = Column(String, nullable=True)
    drone_id = Column(String, nullable=True)

    flight_log_ref = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    service_order = relationship("ServiceOrder", back_populates="flights")


# ─────────────────────────────────────────
# Payments
# ─────────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=True)

    amount = Column(Float, nullable=False)

    status = Column(String, nullable=False, default="posted")

    paid_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    posted_at = Column(DateTime(timezone=True), nullable=True)

    method = Column(String, default="transfer")
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    client = relationship("Client", back_populates="payments")


# ─────────────────────────────────────────
# Payment Events
# ─────────────────────────────────────────
class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=False)

    # allowed values: customer_payment | operator_handover | dronic_receipt
    event_type = Column(String, nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="MXN")
    method = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    from_label = Column(String, nullable=True)
    to_label = Column(String, nullable=True)

    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    recorded_by = Column(String, nullable=True)

    is_voided = Column(Boolean, nullable=False, default=False)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    voided_by = Column(String, nullable=True)
    void_reason = Column(Text, nullable=True)

    service_order = relationship("ServiceOrder", back_populates="payment_events")


# ─────────────────────────────────────────
# Order Expenses
# ─────────────────────────────────────────
class OrderExpense(Base):
    __tablename__ = "order_expenses"

    id = Column(Integer, primary_key=True, index=True)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=False)

    # allowed values: fuel | toll | labor | other
    expense_type = Column(String, nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="MXN")
    liters = Column(Float, nullable=True)
    reference = Column(String, nullable=True)
    description = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    recorded_by = Column(String, nullable=True)

    is_voided = Column(Boolean, nullable=False, default=False)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    voided_by = Column(String, nullable=True)
    void_reason = Column(Text, nullable=True)

    service_order = relationship("ServiceOrder", back_populates="expenses")


# ─────────────────────────────────────────
# Assets
# ─────────────────────────────────────────
class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=True)

    asset_type = Column(String, nullable=False)

    original_name = Column(String, nullable=True)
    stored_name = Column(String, nullable=True, unique=True)
    mime_type = Column(String, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    file_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)

    captured_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    metadata_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)

    field = relationship("Field", back_populates="assets")
    service_order = relationship("ServiceOrder", back_populates="assets")


# ─────────────────────────────────────────
# Reports
# ─────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    service_order_id = Column(Integer,
                              ForeignKey("service_orders.id"),
                              nullable=False)

    status = Column(String, default="queued")
    report_json = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)

    generated_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    service_order = relationship("ServiceOrder", back_populates="reports")


# ─────────────────────────────────────────
# Billing Profile
# ─────────────────────────────────────────
class BillingProfile(Base):
    __tablename__ = "billing_profiles"

    id = Column(Integer, primary_key=True, index=True)

    legal_name = Column(String, nullable=False)
    rfc = Column(String, nullable=False)
    tax_regime = Column(String, default="RESICO")
    address = Column(String, nullable=True)
    default_currency = Column(String, default="MXN")
