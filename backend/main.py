from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Any, cast
import os
import uuid
import re
from sqlalchemy import func
import uvicorn

from db import SessionLocal, engine
import models
import schemas

# ─────────────────────────────────────────────────────────────
# DB init
# ─────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DRONIC Core API")

# CORS para frontend en otro Repl / dominio
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # luego lo cerramos a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_VOID_KEY = os.getenv("ADMIN_VOID_KEY", "")


def require_admin_key(x_admin_key: str | None = Header(None)):
    if not ADMIN_VOID_KEY or x_admin_key != ADMIN_VOID_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def safe_ext(filename: str) -> str:
    m = re.search(r"(\.[a-zA-Z0-9]{1,10})$", filename or "")
    return m.group(1).lower() if m else ""


def make_storage_name(original: str) -> str:
    return f"{uuid.uuid4().hex}{safe_ext(original)}"


# ─────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True, "service": "DRONIC Core API"}


# ─────────────────────────────────────────────────────────────
# Admin
# ─────────────────────────────────────────────────────────────
@app.post("/admin/verify")
def admin_verify(_: None = Depends(require_admin_key)):
    return {"ok": True}


# ─────────────────────────────────────────────────────────────
# Clients
# ─────────────────────────────────────────────────────────────
@app.post("/clients", response_model=schemas.ClientOut)
def create_client(payload: schemas.ClientCreate,
                  db: Session = Depends(get_db)):
    c = models.Client(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.get("/clients", response_model=list[schemas.ClientOut])
def list_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).order_by(models.Client.id.desc()).all()


@app.patch("/clients/{client_id}", response_model=schemas.ClientOut)
def update_client(
        client_id: int,
        payload: schemas.ClientUpdate,
        db: Session = Depends(get_db),
):
    c = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)

    db.commit()
    db.refresh(c)
    return c


# ─────────────────────────────────────────────────────────────
# Fields
# ─────────────────────────────────────────────────────────────
@app.post("/fields", response_model=schemas.FieldOut)
def create_field(payload: schemas.FieldCreate, db: Session = Depends(get_db)):
    client = db.query(
        models.Client).filter(models.Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    f = models.Field(**payload.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@app.get("/clients/{client_id}/fields", response_model=list[schemas.FieldOut])
def list_fields(client_id: int, db: Session = Depends(get_db)):
    return (db.query(
        models.Field).filter(models.Field.client_id == client_id).order_by(
            models.Field.id.desc()).all())


# ─────────────────────────────────────────────────────────────
# Service Orders
# ─────────────────────────────────────────────────────────────
@app.post("/service-orders", response_model=schemas.ServiceOrderOut)
def create_service_order(payload: schemas.ServiceOrderCreate,
                         db: Session = Depends(get_db)):
    client = db.query(
        models.Client).filter(models.Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if payload.field_id is not None:
        field = db.query(
            models.Field).filter(models.Field.id == payload.field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        if cast(Any, field).client_id != payload.client_id:
            raise HTTPException(status_code=400,
                                detail="Field does not belong to client")

    if payload.hectares_covered < 0:
        raise HTTPException(status_code=400,
                            detail="hectares_covered cannot be negative")

    if payload.rate_per_ha <= 0:
        raise HTTPException(status_code=400, detail="rate_per_ha must be > 0")

    total_amount = float(payload.hectares_covered) * float(payload.rate_per_ha)

    so = models.ServiceOrder(**payload.model_dump(), total_amount=total_amount)
    db.add(so)
    db.commit()
    db.refresh(so)
    return so


@app.get("/service-orders", response_model=list[schemas.ServiceOrderOut])
def list_all_service_orders(
        status: str | None = None,
        client_id: int | None = None,
        db: Session = Depends(get_db),
):
    query = db.query(models.ServiceOrder)

    if status:
        query = query.filter(models.ServiceOrder.status == status)

    if client_id is not None:
        query = query.filter(models.ServiceOrder.client_id == client_id)

    return query.order_by(models.ServiceOrder.id.desc()).all()


@app.get("/service-orders/{service_order_id}",
         response_model=schemas.ServiceOrderOut)
def get_service_order(service_order_id: int, db: Session = Depends(get_db)):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")
    return so


@app.patch("/service-orders/{service_order_id}",
           response_model=schemas.ServiceOrderOut)
def update_service_order(
        service_order_id: int,
        payload: schemas.ServiceOrderUpdate,
        db: Session = Depends(get_db),
        x_admin_key: str | None = Header(None),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    data = payload.model_dump(exclude_unset=True)

    if "hectares_covered" in data or "rate_per_ha" in data or "pilot_brought_client" in data:
        if not ADMIN_VOID_KEY or x_admin_key != ADMIN_VOID_KEY:
            raise HTTPException(status_code=403, detail="Forbidden")

    if "field_id" in data and data["field_id"] is not None:
        field = db.query(
            models.Field).filter(models.Field.id == data["field_id"]).first()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        if cast(Any, field).client_id != cast(Any, so).client_id:
            raise HTTPException(
                status_code=400,
                detail="Field does not belong to service order's client",
            )

    if "hectares_covered" in data and data["hectares_covered"] is not None:
        if data["hectares_covered"] < 0:
            raise HTTPException(status_code=400,
                                detail="hectares_covered cannot be negative")

    if "rate_per_ha" in data and data["rate_per_ha"] is not None:
        if data["rate_per_ha"] <= 0:
            raise HTTPException(status_code=400,
                                detail="rate_per_ha must be > 0")

    for k, v in data.items():
        setattr(so, k, v)

    if "status" in data and data["status"] == "done" and getattr(
            so, "performed_at", None) is None:
        setattr(so, "performed_at", datetime.now(timezone.utc))

    if ("hectares_covered" in data) or ("rate_per_ha" in data):
        hectares = float(cast(Any, so).hectares_covered)
        rate = float(cast(Any, so).rate_per_ha)
        setattr(so, "total_amount", hectares * rate)

    if "pilot_brought_client" in data or "hectares_covered" in data:
        pbc = cast(Any, so).pilot_brought_client
        hc = cast(Any, so).hectares_covered
        if pbc is not None and hc is not None:
            pilot_rate = 100.0 if pbc else 50.0
            setattr(so, "pilot_fee", float(hc) * pilot_rate)
        else:
            setattr(so, "pilot_fee", None)

    db.commit()
    db.refresh(so)
    return so


@app.get("/clients/{client_id}/service-orders",
         response_model=list[schemas.ServiceOrderOut])
def list_service_orders(client_id: int, db: Session = Depends(get_db)):
    return (db.query(models.ServiceOrder).filter(
        models.ServiceOrder.client_id == client_id).order_by(
            models.ServiceOrder.id.desc()).all())


# ─────────────────────────────────────────────────────────────
# Payments
# ─────────────────────────────────────────────────────────────
@app.post("/payments", response_model=schemas.PaymentOut)
def create_payment(payload: schemas.PaymentCreate,
                   db: Session = Depends(get_db)):
    client = db.query(
        models.Client).filter(models.Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")

    if payload.service_order_id is not None:
        so = db.query(models.ServiceOrder).filter(
            models.ServiceOrder.id == payload.service_order_id).first()
        if not so:
            raise HTTPException(status_code=404,
                                detail="Service order not found")
        if cast(Any, so).client_id != payload.client_id:
            raise HTTPException(
                status_code=400,
                detail="Service order does not belong to client")

    p = models.Payment(**payload.model_dump())

    if getattr(p, "status", "posted") == "posted" and getattr(
            p, "posted_at", None) is None:
        setattr(p, "posted_at", datetime.now(timezone.utc))

    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ─────────────────────────────────────────────────────────────
# Payment Events
# ─────────────────────────────────────────────────────────────
VALID_EVENT_TYPES = {"customer_payment", "operator_handover", "dronic_receipt", "direct_payment"}


@app.post("/service-orders/{service_order_id}/payment-events",
          response_model=schemas.PaymentEventOut)
def create_payment_event(
        service_order_id: int,
        payload: schemas.PaymentEventCreate,
        db: Session = Depends(get_db),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")

    event = models.PaymentEvent(
        service_order_id=service_order_id,
        **payload.model_dump(),
    )
    db.add(event)

    # Keep service_order financial summary in sync
    if payload.event_type == "customer_payment":
        current = float(cast(Any, so).client_paid_total or 0.0)
        setattr(so, "client_paid_total", current + payload.amount)
    elif payload.event_type == "direct_payment":
        current_paid = float(cast(Any, so).client_paid_total or 0.0)
        current_dronic = float(cast(Any, so).dronic_received_total or 0.0)
        setattr(so, "client_paid_total", current_paid + payload.amount)
        setattr(so, "dronic_received_total", current_dronic + payload.amount)
    elif payload.event_type == "dronic_receipt":
        client_paid = float(cast(Any, so).client_paid_total or 0.0)
        current_dronic = float(cast(Any, so).dronic_received_total or 0.0)
        if current_dronic + payload.amount > client_paid:
            raise HTTPException(status_code=400, detail="El monto excede lo cobrado al cliente disponible para entregar a DRONIC")
        setattr(so, "dronic_received_total", current_dronic + payload.amount)

    db.commit()
    db.refresh(event)
    return event


@app.get("/service-orders/{service_order_id}/payment-events",
         response_model=list[schemas.PaymentEventOut])
def list_payment_events(
        service_order_id: int,
        include_voided: bool = False,
        db: Session = Depends(get_db),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    query = db.query(models.PaymentEvent).filter(
        models.PaymentEvent.service_order_id == service_order_id)
    if not include_voided:
        query = query.filter(models.PaymentEvent.is_voided.is_(False))
    return query.order_by(models.PaymentEvent.recorded_at.desc()).all()


@app.post(
    "/service-orders/{service_order_id}/payment-events/{event_id}/void",
    response_model=schemas.PaymentEventOut,
)
def void_payment_event(
        service_order_id: int,
        event_id: int,
        payload: schemas.VoidPayload,
        db: Session = Depends(get_db),
        _: None = Depends(require_admin_key),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    event = db.query(models.PaymentEvent).filter(
        models.PaymentEvent.id == event_id,
        models.PaymentEvent.service_order_id == service_order_id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Payment event not found")
    if cast(Any, event).is_voided:
        raise HTTPException(status_code=400, detail="Payment event already voided")

    setattr(event, "is_voided", True)
    setattr(event, "voided_at", datetime.now(timezone.utc))
    setattr(event, "voided_by", payload.voided_by)
    setattr(event, "void_reason", payload.void_reason)

    # Flush writes is_voided=True to SQLite before the SUM queries run.
    # Required because autoflush=False in SessionLocal.
    db.flush()

    # Recalculate both totals from non-voided events
    new_client_paid = (db.query(
        func.coalesce(func.sum(models.PaymentEvent.amount), 0.0)).filter(
            models.PaymentEvent.service_order_id == service_order_id,
            models.PaymentEvent.event_type.in_(["customer_payment", "direct_payment"]),
            models.PaymentEvent.is_voided.is_(False),
        ).scalar())
    setattr(so, "client_paid_total", float(new_client_paid or 0.0))

    new_dronic_received = (db.query(
        func.coalesce(func.sum(models.PaymentEvent.amount), 0.0)).filter(
            models.PaymentEvent.service_order_id == service_order_id,
            models.PaymentEvent.event_type.in_(["dronic_receipt", "direct_payment"]),
            models.PaymentEvent.is_voided.is_(False),
        ).scalar())
    setattr(so, "dronic_received_total", float(new_dronic_received or 0.0))

    db.commit()
    db.refresh(event)
    return event


# ─────────────────────────────────────────────────────────────
# Order Expenses
# ─────────────────────────────────────────────────────────────
@app.post("/service-orders/{service_order_id}/expenses",
          response_model=schemas.OrderExpenseOut)
def create_expense(
        service_order_id: int,
        payload: schemas.OrderExpenseCreate,
        db: Session = Depends(get_db),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")

    if payload.liters is not None and payload.liters <= 0:
        raise HTTPException(status_code=400, detail="liters must be > 0")

    expense = models.OrderExpense(
        service_order_id=service_order_id,
        **payload.model_dump(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/service-orders/{service_order_id}/expenses",
         response_model=schemas.ServiceOrderExpensesOut)
def list_expenses(
        service_order_id: int,
        include_voided: bool = False,
        db: Session = Depends(get_db),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    query = db.query(models.OrderExpense).filter(
        models.OrderExpense.service_order_id == service_order_id)
    if not include_voided:
        query = query.filter(models.OrderExpense.is_voided.is_(False))
    items = query.order_by(models.OrderExpense.recorded_at.desc()).all()

    total = sum(float(cast(Any, e).amount) for e in items)

    return schemas.ServiceOrderExpensesOut(
        service_order_id=service_order_id,
        total_expenses=total,
        items=items,
    )


@app.post(
    "/service-orders/{service_order_id}/expenses/{expense_id}/void",
    response_model=schemas.OrderExpenseOut,
)
def void_expense(
        service_order_id: int,
        expense_id: int,
        payload: schemas.VoidPayload,
        db: Session = Depends(get_db),
        _: None = Depends(require_admin_key),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    expense = db.query(models.OrderExpense).filter(
        models.OrderExpense.id == expense_id,
        models.OrderExpense.service_order_id == service_order_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if cast(Any, expense).is_voided:
        raise HTTPException(status_code=400, detail="Expense already voided")

    setattr(expense, "is_voided", True)
    setattr(expense, "voided_at", datetime.now(timezone.utc))
    setattr(expense, "voided_by", payload.voided_by)
    setattr(expense, "void_reason", payload.void_reason)

    db.commit()
    db.refresh(expense)
    return expense


# ─────────────────────────────────────────────────────────────
# Assets
# ─────────────────────────────────────────────────────────────
@app.post("/assets", response_model=schemas.AssetOut)
def create_asset(payload: schemas.AssetCreate, db: Session = Depends(get_db)):
    client = db.query(
        models.Client).filter(models.Client.id == payload.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if payload.field_id is not None:
        field = db.query(
            models.Field).filter(models.Field.id == payload.field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        if cast(Any, field).client_id != payload.client_id:
            raise HTTPException(status_code=400,
                                detail="Field does not belong to client")

    if payload.service_order_id is not None:
        so = db.query(models.ServiceOrder).filter(
            models.ServiceOrder.id == payload.service_order_id).first()
        if not so:
            raise HTTPException(status_code=404,
                                detail="Service order not found")
        if cast(Any, so).client_id != payload.client_id:
            raise HTTPException(
                status_code=400,
                detail="Service order does not belong to client")

    file_url = getattr(payload, "file_url", None)
    file_path = getattr(payload, "file_path", None)
    if file_url is None and file_path is None:
        raise HTTPException(status_code=400,
                            detail="Provide file_url or file_path")

    a = models.Asset(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@app.get("/service-orders/{service_order_id}/assets",
         response_model=list[schemas.AssetOut])
def list_service_order_assets(service_order_id: int,
                              db: Session = Depends(get_db)):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    return (db.query(models.Asset).filter(
        models.Asset.service_order_id == service_order_id,
        models.Asset.is_deleted.is_(False),
    ).order_by(models.Asset.id.desc()).all())


@app.post("/service-orders/{service_order_id}/assets/upload",
          response_model=schemas.AssetOut)
def upload_asset_to_service_order(
        service_order_id: int,
        asset_type: str = Form(...),
        notes: str | None = Form(None),
        captured_at: datetime | None = Form(None),
        metadata_json: str | None = Form(None),
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
):
    so = db.query(models.ServiceOrder).filter(
        models.ServiceOrder.id == service_order_id).first()
    if not so:
        raise HTTPException(status_code=404, detail="Service order not found")

    original_name = file.filename or "upload.bin"
    stored_name = make_storage_name(original_name)

    rel_path = stored_name
    abs_path = os.path.join(UPLOAD_DIR, rel_path)

    try:
        with open(abs_path, "wb") as f:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
    finally:
        file.file.close()

    size_bytes = os.path.getsize(abs_path)

    a = models.Asset(
        client_id=cast(Any, so).client_id,
        field_id=cast(Any, so).field_id,
        service_order_id=cast(Any, so).id,
        asset_type=asset_type,
        original_name=original_name,
        stored_name=stored_name,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        file_path=rel_path,
        notes=notes,
        captured_at=captured_at,
        metadata_json=metadata_json,
    )

    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@app.get("/assets/{asset_id}/file")
def get_asset_file(asset_id: int, db: Session = Depends(get_db)):
    a = (db.query(models.Asset).filter(
        models.Asset.id == asset_id,
        models.Asset.is_deleted.is_(False),
    ).first())
    if a is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    file_path = cast(Any, a).file_path
    if not file_path:
        raise HTTPException(status_code=404, detail="Asset has no file_path")

    abs_path = os.path.join(UPLOAD_DIR, file_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=410, detail="File missing on server")

    mime_type = cast(Any, a).mime_type
    original_name = cast(Any, a).original_name

    return FileResponse(
        abs_path,
        media_type=mime_type or "application/octet-stream",
        filename=original_name or os.path.basename(abs_path),
    )


@app.delete("/assets/{asset_id}")
def soft_delete_asset(asset_id: int, db: Session = Depends(get_db)):
    a = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if a is None or cast(Any, a).is_deleted:
        raise HTTPException(status_code=404, detail="Asset not found")

    setattr(a, "is_deleted", True)
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────────────────────────
# Client Overview
# ─────────────────────────────────────────────────────────────
@app.get("/clients/{client_id}/overview",
         response_model=schemas.ClientOverviewOut)
def client_overview(client_id: int, db: Session = Depends(get_db)):
    client = db.query(
        models.Client).filter(models.Client.id == client_id).first()
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    total_orders = (db.query(func.count(models.ServiceOrder.id)).filter(
        models.ServiceOrder.client_id == client_id).scalar() or 0)

    done_orders = (db.query(func.count(models.ServiceOrder.id)).filter(
        models.ServiceOrder.client_id == client_id,
        models.ServiceOrder.status == "done",
    ).scalar() or 0)

    open_orders = (db.query(func.count(models.ServiceOrder.id)).filter(
        models.ServiceOrder.client_id == client_id,
        models.ServiceOrder.status.notin_(["done", "canceled"]),
    ).scalar() or 0)

    total_billed = (db.query(
        func.coalesce(func.sum(models.ServiceOrder.total_amount), 0.0)).filter(
            models.ServiceOrder.client_id == client_id,
            models.ServiceOrder.status != "canceled",
        ).scalar() or 0.0)

    total_paid = (db.query(func.coalesce(func.sum(
        models.Payment.amount), 0.0)).filter(
            models.Payment.client_id == client_id,
            models.Payment.status == "posted",
        ).scalar() or 0.0)

    last_service_at = (db.query(func.max(
        models.ServiceOrder.performed_at)).filter(
            models.ServiceOrder.client_id == client_id,
            models.ServiceOrder.status == "done",
        ).scalar())

    assets_count = (db.query(func.count(models.Asset.id)).filter(
        models.Asset.client_id == client_id,
        models.Asset.is_deleted.is_(False),
    ).scalar() or 0)

    balance_due = float(total_billed) - float(total_paid)

    return schemas.ClientOverviewOut(
        client_id=client_id,
        client_name=getattr(client, "name", ""),
        total_service_orders=int(total_orders),
        open_orders_count=int(open_orders),
        done_orders_count=int(done_orders),
        total_billed=float(total_billed),
        total_paid=float(total_paid),
        balance_due=float(balance_due),
        last_service_at=last_service_at,
        assets_count=int(assets_count),
    )


# ─────────────────────────────────────────────────────────────
# Client Timeline
# ─────────────────────────────────────────────────────────────
@app.get("/clients/{client_id}/timeline",
         response_model=schemas.ClientTimelineOut)
def client_timeline(
        client_id: int,
        limit: int = 50,
        before: datetime | None = None,
        types: str | None = None,
        db: Session = Depends(get_db),
):
    client = db.query(
        models.Client).filter(models.Client.id == client_id).first()
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be 1..100")

    before_dt = before or datetime.now(timezone.utc)

    allowed = {"service_order", "payment", "asset"}
    if types:
        req_types = {t.strip() for t in types.split(",") if t.strip()}
        req_types = req_types & allowed
        if not req_types:
            raise HTTPException(status_code=400, detail="Invalid types")
    else:
        req_types = allowed

    per_table = limit
    items: list[dict[str, Any]] = []

    type_priority = {"payment": 3, "service_order": 2, "asset": 1}

    if "service_order" in req_types:
        so_rows = (db.query(models.ServiceOrder).filter(
            models.ServiceOrder.client_id == client_id).filter(
                func.coalesce(models.ServiceOrder.performed_at, models.
                              ServiceOrder.created_at) < before_dt).order_by(
                                  func.coalesce(
                                      models.ServiceOrder.performed_at,
                                      models.ServiceOrder.created_at).desc(),
                                  models.ServiceOrder.id.desc(),
                              ).limit(per_table).all())

        for so in so_rows:
            sox = cast(Any, so)
            occurred_at = sox.performed_at or sox.created_at
            total_amount = float(sox.total_amount or 0.0)

            items.append({
                "id": f"service_order:{sox.id}",
                "type": "service_order",
                "occurred_at": occurred_at,
                "title": f"Service #{sox.id} — {sox.status}",
                "summary":
                f"{sox.service_type} | Total {total_amount:.2f} {sox.currency}",
                "ref": {
                    "entity": "service_order",
                    "id": sox.id
                },
                "data": {
                    "service_order_id": sox.id,
                    "status": sox.status,
                    "service_type": sox.service_type,
                    "field_id": sox.field_id,
                    "scheduled_at": sox.scheduled_at,
                    "performed_at": sox.performed_at,
                    "created_at": sox.created_at,
                    "total_amount": total_amount,
                    "currency": sox.currency,
                },
            })

    if "payment" in req_types:
        pay_rows = (db.query(models.Payment).filter(
            models.Payment.client_id == client_id).filter(
                func.coalesce(models.Payment.posted_at, models.Payment.paid_at)
                < before_dt).order_by(
                    func.coalesce(models.Payment.posted_at,
                                  models.Payment.paid_at).desc(),
                    models.Payment.id.desc(),
                ).limit(per_table).all())

        for p in pay_rows:
            px = cast(Any, p)
            occurred_at = px.posted_at or px.paid_at
            amount = float(px.amount or 0.0)

            items.append({
                "id": f"payment:{px.id}",
                "type": "payment",
                "occurred_at": occurred_at,
                "title": "Payment",
                "summary": f"{amount:.2f} | {px.method} | {px.status}",
                "ref": {
                    "entity": "payment",
                    "id": px.id
                },
                "data": {
                    "payment_id": px.id,
                    "amount": amount,
                    "status": px.status,
                    "method": px.method,
                    "reference": px.reference,
                    "service_order_id": px.service_order_id,
                    "paid_at": px.paid_at,
                    "posted_at": px.posted_at,
                },
            })

    if "asset" in req_types:
        asset_rows = (db.query(
            models.Asset).filter(models.Asset.client_id == client_id).filter(
                models.Asset.is_deleted.is_(False)).filter(
                    func.coalesce(models.Asset.captured_at, models.Asset.
                                  created_at) < before_dt).order_by(
                                      func.coalesce(
                                          models.Asset.captured_at,
                                          models.Asset.created_at).desc(),
                                      models.Asset.id.desc(),
                                  ).limit(per_table).all())

        for a in asset_rows:
            ax = cast(Any, a)
            occurred_at = ax.captured_at or ax.created_at
            download_url = f"/assets/{ax.id}/file" if ax.file_path else None

            items.append({
                "id":
                f"asset:{ax.id}",
                "type":
                "asset",
                "occurred_at":
                occurred_at,
                "title":
                f"Asset — {ax.asset_type}",
                "summary": (ax.original_name or ax.file_url or ax.file_path),
                "ref": {
                    "entity": "asset",
                    "id": ax.id
                },
                "data": {
                    "asset_id": ax.id,
                    "asset_type": ax.asset_type,
                    "service_order_id": ax.service_order_id,
                    "field_id": ax.field_id,
                    "original_name": ax.original_name,
                    "stored_name": ax.stored_name,
                    "mime_type": ax.mime_type,
                    "size_bytes": ax.size_bytes,
                    "file_url": ax.file_url,
                    "file_path": ax.file_path,
                    "download_url": download_url,
                    "captured_at": ax.captured_at,
                    "created_at": ax.created_at,
                    "notes": ax.notes,
                },
            })

    items.sort(
        key=lambda x: (
            x["occurred_at"],
            type_priority.get(x["type"], 0),
            x["ref"]["id"],
        ),
        reverse=True,
    )

    items = items[:limit]
    next_before = items[-1]["occurred_at"] if items else None

    return schemas.ClientTimelineOut(
        client_id=client_id,
        items=[schemas.TimelineItem(**i) for i in items],
        next_before=next_before,
    )


# ─────────────────────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────────────────────
@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    open_orders = (db.query(func.count(models.ServiceOrder.id)).filter(
        models.ServiceOrder.status.notin_(["done", "canceled"])).scalar() or 0)

    done_orders = (db.query(func.count(models.ServiceOrder.id)).filter(
        models.ServiceOrder.status == "done").scalar() or 0)

    total_billed = (db.query(
        func.coalesce(func.sum(models.ServiceOrder.total_amount), 0.0)).filter(
            models.ServiceOrder.status != "canceled").scalar() or 0.0)

    total_paid = (db.query(func.coalesce(
        func.sum(models.Payment.amount),
        0.0)).filter(models.Payment.status == "posted").scalar() or 0.0)

    clients_count = db.query(func.count(models.Client.id)).scalar() or 0

    return {
        "open_orders": int(open_orders),
        "done_orders": int(done_orders),
        "clients_count": int(clients_count),
        "total_billed": float(total_billed),
        "total_paid": float(total_paid),
        "balance_due": float(total_billed) - float(total_paid),
    }


_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
