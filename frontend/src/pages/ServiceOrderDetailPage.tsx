import React, { useEffect, useState } from "react";
import { getServiceOrderById, updateServiceOrder, type ServiceOrderUpdate } from "../services/serviceOrders";
import { getAssetsByServiceOrder, uploadAsset } from "../services/assets";
import { getClients, type Client } from "../services/clients";
import { getPaymentEvents, createPaymentEvent, voidPaymentEvent } from "../services/paymentEvents";
import { getOrderExpenses, createOrderExpense, voidOrderExpense } from "../services/orderExpenses";
import type { ServiceOrder } from "../types/serviceOrder";
import type { Asset } from "../types/asset";
import type { PaymentEvent } from "../types/paymentEvent";
import type { OrderExpense } from "../types/orderExpense";

type Props = {
  orderId: number;
  onBack: () => void;
  isAdmin: boolean;
  adminKey: string;
};

export default function ServiceOrderDetailPage({ orderId, onBack, isAdmin, adminKey }: Props) {
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState<string>("");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetType, setAssetType] = useState("evidence");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Payment events state
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [eventType, setEventType] = useState<"customer_payment" | "operator_handover" | "dronic_receipt" | "direct_payment">("customer_payment");
  const [eventAmount, setEventAmount] = useState("");
  const [eventFromLabel, setEventFromLabel] = useState("");
  const [eventToLabel, setEventToLabel] = useState("");
  const [eventRecordedBy, setEventRecordedBy] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventSuccess, setEventSuccess] = useState<string | null>(null);

  // Order expenses state
  const [expenses, setExpenses] = useState<OrderExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState("");
  const [expenseType, setExpenseType] = useState<"fuel" | "toll" | "labor" | "other">("fuel");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseLiters, setExpenseLiters] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseRecordedBy, setExpenseRecordedBy] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

  // Edit order state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editHectares, setEditHectares] = useState("");
  const [editRatePerHa, setEditRatePerHa] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPilotBroughtClient, setEditPilotBroughtClient] = useState<"__no_change__" | "true" | "false" | "">("__no_change__");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editPerformedAt, setEditPerformedAt] = useState("");

  async function loadAssets() {
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const data = await getAssetsByServiceOrder(orderId);
      setAssets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar archivos";
      setAssetsError(message);
    } finally {
      setAssetsLoading(false);
    }
  }

  async function loadPaymentEvents() {
    setEventsLoading(true);
    setEventsError("");
    try {
      const data = await getPaymentEvents(orderId);
      setPaymentEvents(data);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "Error al cargar movimientos de pago");
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadExpenses() {
    setExpensesLoading(true);
    setExpensesError("");
    try {
      const data = await getOrderExpenses(orderId);
      setExpenses(data.items);
      setTotalExpenses(data.total_expenses);
    } catch (err) {
      setExpensesError(err instanceof Error ? err.message : "Error al cargar gastos");
    } finally {
      setExpensesLoading(false);
    }
  }

  async function refreshOrder() {
    const updated = await getServiceOrderById(orderId);
    setOrder(updated);
  }

  useEffect(() => {
    async function loadOrderDetail() {
      try {
        setLoading(true);
        setError("");
        setClientName("");

        const serviceOrder = await getServiceOrderById(orderId);
        setOrder(serviceOrder);

        const clients = await getClients();
        const matchedClient = clients.find(
          (client: Client) => client.id === serviceOrder.client_id,
        );

        if (matchedClient) {
          setClientName(matchedClient.name);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "Error al cargar la orden");
        } else {
          setError("Error al cargar la orden");
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrderDetail();
  }, [orderId]);

  useEffect(() => {
    loadAssets();
  }, [orderId]);

  useEffect(() => {
    loadPaymentEvents();
  }, [orderId]);

  useEffect(() => {
    loadExpenses();
  }, [orderId]);

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError("Primero selecciona un archivo");
      setUploadSuccess(null);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      await uploadAsset(orderId, selectedFile, assetType);
      await loadAssets();

      setUploadSuccess("Archivo subido correctamente");
      setSelectedFile(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al subir el archivo";
      setUploadError(message);
      setUploadSuccess(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateEvent() {
    const amount = parseFloat(eventAmount);
    if (!eventAmount || isNaN(amount) || amount <= 0) {
      setEventError("Monto inválido");
      return;
    }
    try {
      setSubmittingEvent(true);
      setEventError(null);
      setEventSuccess(null);
      await createPaymentEvent(orderId, {
        event_type: eventType,
        amount,
        from_label: eventFromLabel || undefined,
        to_label: eventToLabel || undefined,
        recorded_by: eventRecordedBy || undefined,
      });
      await Promise.all([loadPaymentEvents(), refreshOrder()]);
      setEventSuccess("Evento registrado");
      setEventAmount("");
      setEventFromLabel("");
      setEventToLabel("");
      setEventRecordedBy("");
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Error al registrar evento");
    } finally {
      setSubmittingEvent(false);
    }
  }

  async function handleCreateExpense() {
    const amount = parseFloat(expenseAmount);
    if (!expenseAmount || isNaN(amount) || amount <= 0) {
      setExpenseError("Monto inválido");
      return;
    }
    const liters = expenseLiters ? parseFloat(expenseLiters) : undefined;
    if (liters !== undefined && (isNaN(liters) || liters <= 0)) {
      setExpenseError("Litros inválido");
      return;
    }
    try {
      setSubmittingExpense(true);
      setExpenseError(null);
      setExpenseSuccess(null);
      await createOrderExpense(orderId, {
        expense_type: expenseType,
        amount,
        liters,
        description: expenseDescription || undefined,
        recorded_by: expenseRecordedBy || undefined,
      });
      await loadExpenses();
      setExpenseSuccess("Gasto registrado");
      setExpenseAmount("");
      setExpenseLiters("");
      setExpenseDescription("");
      setExpenseRecordedBy("");
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Error al registrar gasto");
    } finally {
      setSubmittingExpense(false);
    }
  }

  async function handleVoidEvent(eventId: number) {
    const reason = window.prompt("Motivo de anulación (pago):");
    if (!reason || !reason.trim()) return;
    const adminKey = window.prompt("Clave admin:");
    if (adminKey === null) return;
    try {
      await voidPaymentEvent(orderId, eventId, { void_reason: reason.trim() }, adminKey);
      await Promise.all([refreshOrder(), loadPaymentEvents(), loadExpenses()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al anular";
      if (msg.includes("Forbidden") || msg.includes("403")) {
        alert("Clave admin incorrecta o no configurada (403)");
      } else if (msg.includes("400") || msg.includes("already voided")) {
        alert("Registro ya anulado o petición inválida (400)");
      } else {
        alert(`Error al anular pago: ${msg}`);
      }
    }
  }

  async function handleUpdateOrder() {
    if (!order) return;
    const hectares = editHectares ? parseFloat(editHectares) : undefined;
    const ratePerHa = editRatePerHa ? parseFloat(editRatePerHa) : undefined;
    if (isAdmin && hectares !== undefined && (isNaN(hectares) || hectares < 0)) {
      setEditError("Hectáreas inválidas (deben ser >= 0)");
      return;
    }
    if (isAdmin && ratePerHa !== undefined && (isNaN(ratePerHa) || ratePerHa <= 0)) {
      setEditError("Tarifa debe ser > 0");
      return;
    }
    const payload: ServiceOrderUpdate = {};
    if (isAdmin && hectares !== undefined) payload.hectares_covered = hectares;
    if (isAdmin && ratePerHa !== undefined) payload.rate_per_ha = ratePerHa;
    if (editStatus) payload.status = editStatus as ServiceOrderUpdate["status"];
    if (editNotes.trim()) payload.notes = editNotes.trim();
    if (editScheduledAt) payload.scheduled_at = editScheduledAt;
    if (editPerformedAt && (order.status === "done" || editStatus === "done")) payload.performed_at = editPerformedAt;
    if (isAdmin && editPilotBroughtClient !== "__no_change__") {
      payload.pilot_brought_client =
        editPilotBroughtClient === "true" ? true
        : editPilotBroughtClient === "false" ? false
        : null;
    }
    if (Object.keys(payload).length === 0) {
      setEditError("No hay cambios que guardar");
      return;
    }
    try {
      setSubmittingEdit(true);
      setEditError(null);
      await updateServiceOrder(orderId, payload, isAdmin ? adminKey : undefined);
      await refreshOrder();
      setShowEditForm(false);
      setEditHectares("");
      setEditRatePerHa("");
      setEditStatus("");
      setEditNotes("");
      setEditPilotBroughtClient("__no_change__");
      setEditScheduledAt("");
      setEditPerformedAt("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar orden");
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleVoidExpense(expenseId: number) {
    const reason = window.prompt("Motivo de anulación (gasto):");
    if (!reason || !reason.trim()) return;
    const adminKey = window.prompt("Clave admin:");
    if (adminKey === null) return;
    try {
      await voidOrderExpense(orderId, expenseId, { void_reason: reason.trim() }, adminKey);
      await Promise.all([refreshOrder(), loadPaymentEvents(), loadExpenses()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al anular";
      if (msg.includes("Forbidden") || msg.includes("403")) {
        alert("Clave admin incorrecta o no configurada (403)");
      } else if (msg.includes("400") || msg.includes("already voided")) {
        alert("Registro ya anulado o petición inválida (400)");
      } else {
        alert(`Error al anular gasto: ${msg}`);
      }
    }
  }

  if (loading) {
    return <div style={{ padding: "24px" }}>Cargando detalle...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "24px", color: "#b91c1c" }}>Error: {error}</div>
    );
  }

  if (!order) {
    return <div style={{ padding: "24px" }}>No se encontró la orden.</div>;
  }

  const margen = !expensesError && !expensesLoading
    ? order.total_amount - totalExpenses
    : null;
  const pendienteCliente = order.total_amount - (order.client_paid_total ?? 0);
  const pendienteDronic = (order.client_paid_total ?? 0) - (order.dronic_received_total ?? 0);

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        background: "#f7f8fa",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      <button onClick={onBack} style={backButtonStyle}>
        ← Volver
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Orden #{order.id}</h1>
        <button
          onClick={() => {
            const opening = !showEditForm;
            if (opening) {
              setEditScheduledAt(order.scheduled_at ? order.scheduled_at.slice(0, 16) : "");
              setEditPerformedAt(order.performed_at ? order.performed_at.slice(0, 16) : "");
            }
            setShowEditForm(opening);
            setEditError(null);
          }}
          style={editToggleButtonStyle}
        >
          {showEditForm ? "Cancelar edición" : "Editar orden"}
        </button>
      </div>

      {/* Detalle de la orden */}
      <div style={cardStyle}>
        <Row
          label="Cliente"
          value={clientName || `Cliente #${order.client_id}`}
        />
        <Row
          label="Campo"
          value={order.field_id != null ? String(order.field_id) : "-"}
        />
        <Row label="Tipo" value={order.service_type ?? "-"} />
        <Row label="Estado" value={labelStatus(order.status)} />
        <Row label="Hectáreas" value={String(order.hectares_covered)} />
        <Row label="Tarifa" value={String(order.rate_per_ha)} />
        <Row label="Total" value={String(order.total_amount)} />
        <Row label="Fecha programada" value={formatDate(order.scheduled_at)} />
        <Row label="Fecha realizada" value={formatDate(order.performed_at)} />
        <Row label="Creada" value={formatDate(order.created_at)} />
      </div>

      {/* Formulario edición */}
      {showEditForm && (
        <div style={{ ...cardStyle, marginTop: "16px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Editar orden</h3>
          {isAdmin && (
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>Hectáreas cubiertas</label>
              <input type="number" value={editHectares}
                onChange={(e) => setEditHectares(e.target.value)}
                style={inputStyle} placeholder={String(order.hectares_covered)}
                min="0" step="0.1" />
            </div>
          )}
          {isAdmin && (
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>Tarifa por ha (MXN)</label>
              <input type="number" value={editRatePerHa}
                onChange={(e) => setEditRatePerHa(e.target.value)}
                style={inputStyle} placeholder={String(order.rate_per_ha)}
                min="0.01" step="0.01" />
            </div>
          )}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Estado</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={inputStyle}>
              <option value="">— sin cambio —</option>
              <option value="planned">Planeada</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Completada</option>
              <option value="canceled">Cancelada</option>
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Fecha planeada</label>
            <input type="datetime-local" value={editScheduledAt}
              onChange={(e) => setEditScheduledAt(e.target.value)}
              style={inputStyle} />
          </div>
          {(order.status === "done" || editStatus === "done") && (
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>Fecha realizada</label>
              <input type="datetime-local" value={editPerformedAt}
                onChange={(e) => setEditPerformedAt(e.target.value)}
                style={inputStyle} />
            </div>
          )}
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Notas</label>
            <input type="text" value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              style={inputStyle} placeholder={order.notes ?? "sin notas"} />
          </div>
          {isAdmin && (
            <div style={{ marginBottom: "10px" }}>
              <label style={labelStyle}>¿Cliente traído por piloto?</label>
              <select
                value={editPilotBroughtClient}
                onChange={(e) => setEditPilotBroughtClient(e.target.value as "__no_change__" | "true" | "false" | "")}
                style={inputStyle}
              >
                <option value="__no_change__">— sin cambio —</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
                <option value="">No definido</option>
              </select>
            </div>
          )}
          {editError && <div style={errorMsgStyle}>{editError}</div>}
          <button onClick={handleUpdateOrder} disabled={submittingEdit}
            style={submitButtonStyle(submittingEdit)}>
            {submittingEdit ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Resumen financiero */}
      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Resumen financiero</h2>
        <Row
          label="Total de la orden"
          value={`$${order.total_amount.toFixed(2)} ${order.currency ?? "MXN"}`}
        />
        <Row
          label="Cobrado al cliente"
          value={`$${(order.client_paid_total ?? 0).toFixed(2)}`}
        />
        <Row
          label={pendienteCliente >= 0 ? "Pendiente de cobro" : "Saldo a favor del cliente"}
          value={`$${Math.abs(pendienteCliente).toFixed(2)}`}
        />
        <Row
          label="Recibido por DRONIC"
          value={`$${(order.dronic_received_total ?? 0).toFixed(2)}`}
        />
        <Row
          label={
            pendienteDronic < 0
              ? "Exceso recibido por DRONIC"
              : "Pendiente de recepción DRONIC"
          }
          value={`$${Math.abs(pendienteDronic).toFixed(2)}`}
        />
        {isAdmin && (
          <>
            <Row
              label="Cliente traído por piloto"
              value={order.pilot_brought_client == null ? "No definido" : order.pilot_brought_client ? "Sí" : "No"}
            />
            <Row
              label="Tarifa piloto por ha"
              value={order.pilot_brought_client == null ? "No definido" : order.pilot_brought_client ? "100 MXN/ha" : "50 MXN/ha"}
            />
            <Row
              label="Adeudo al piloto"
              value={order.pilot_fee != null ? `$${order.pilot_fee.toFixed(2)}` : "No disponible"}
            />
          </>
        )}
        <Row
          label="Total gastos"
          value={expensesError ? "Error al cargar" : expensesLoading ? "Cargando..." : `$${totalExpenses.toFixed(2)}`}
        />
        <Row
          label="Margen estimado"
          value={margen !== null ? `$${margen.toFixed(2)}` : "No disponible"}
        />
      </div>

      {/* Pagos */}
      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Pagos</h2>

        <div style={subCardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Registrar evento de pago
          </h3>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Tipo
            </label>
            <select
              value={eventType}
              onChange={(e) =>
                setEventType(
                  e.target.value as typeof eventType,
                )
              }
              style={inputStyle}
            >
              <option value="customer_payment">Cobro al cliente</option>
              <option value="operator_handover">Entrega piloto-socio</option>
              <option value="dronic_receipt">Recepción DRONIC</option>
              <option value="direct_payment">Pago directo a DRONIC</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Monto
            </label>
            <input
              type="number"
              value={eventAmount}
              onChange={(e) => setEventAmount(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              De (opcional)
            </label>
            <input
              type="text"
              value={eventFromLabel}
              onChange={(e) => setEventFromLabel(e.target.value)}
              style={inputStyle}
              placeholder={fromLabelPlaceholder(eventType)}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Para (opcional)
            </label>
            <input
              type="text"
              value={eventToLabel}
              onChange={(e) => setEventToLabel(e.target.value)}
              style={inputStyle}
              placeholder={toLabelPlaceholder(eventType)}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Registrado por (opcional)
            </label>
            <input
              type="text"
              value={eventRecordedBy}
              onChange={(e) => setEventRecordedBy(e.target.value)}
              style={inputStyle}
              placeholder="nombre o rol"
            />
          </div>

          <button
            onClick={handleCreateEvent}
            disabled={submittingEvent}
            style={submitButtonStyle(submittingEvent)}
          >
            {submittingEvent ? "Registrando..." : "Registrar"}
          </button>

          {eventError && (
            <div style={errorMsgStyle}>{eventError}</div>
          )}
          {eventSuccess && (
            <div style={successMsgStyle}>{eventSuccess}</div>
          )}
        </div>

        {eventsLoading && <div>Cargando pagos...</div>}

        {!eventsLoading && eventsError && (
          <div style={errorMsgStyle}>Error: {eventsError}</div>
        )}

        {!eventsLoading && !eventsError && paymentEvents.length === 0 && (
          <div>No hay eventos de pago.</div>
        )}

        {!eventsLoading && !eventsError && paymentEvents.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Monto</th>
                  <th style={thStyle}>De</th>
                  <th style={thStyle}>Para</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {paymentEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td style={tdStyle}>{labelEventType(ev.event_type)}</td>
                    <td style={tdStyle}>{ev.amount.toFixed(2)}</td>
                    <td style={tdStyle}>{ev.from_label ?? "-"}</td>
                    <td style={tdStyle}>{ev.to_label ?? "-"}</td>
                    <td style={tdStyle}>{formatDate(ev.recorded_at)}</td>
                    <td style={tdStyle}>
                      {ev.is_voided ? (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Anulado</span>
                      ) : (
                        <button onClick={() => handleVoidEvent(ev.id)} style={voidButtonStyle}>
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gastos */}
      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Gastos</h2>

        <div style={subCardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Registrar gasto
          </h3>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Tipo
            </label>
            <select
              value={expenseType}
              onChange={(e) =>
                setExpenseType(e.target.value as typeof expenseType)
              }
              style={inputStyle}
            >
              <option value="fuel">Gasolina</option>
              <option value="toll">Caseta</option>
              <option value="labor">Mano de obra</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Monto
            </label>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          {expenseType === "fuel" && (
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
                Litros (opcional)
              </label>
              <input
                type="number"
                value={expenseLiters}
                onChange={(e) => setExpenseLiters(e.target.value)}
                style={inputStyle}
                placeholder="0.0"
                min="0"
                step="0.1"
              />
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              style={inputStyle}
              placeholder="gasolina ruta, caseta..."
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 700 }}>
              Registrado por (opcional)
            </label>
            <input
              type="text"
              value={expenseRecordedBy}
              onChange={(e) => setExpenseRecordedBy(e.target.value)}
              style={inputStyle}
              placeholder="nombre o rol"
            />
          </div>

          <button
            onClick={handleCreateExpense}
            disabled={submittingExpense}
            style={submitButtonStyle(submittingExpense)}
          >
            {submittingExpense ? "Registrando..." : "Registrar"}
          </button>

          {expenseError && (
            <div style={errorMsgStyle}>{expenseError}</div>
          )}
          {expenseSuccess && (
            <div style={successMsgStyle}>{expenseSuccess}</div>
          )}
        </div>

        {expensesLoading && <div>Cargando gastos...</div>}

        {!expensesLoading && expensesError && (
          <div style={errorMsgStyle}>Error: {expensesError}</div>
        )}

        {!expensesLoading && !expensesError && expenses.length === 0 && (
          <div>No hay gastos registrados.</div>
        )}

        {!expensesLoading && !expensesError && expenses.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Monto</th>
                  <th style={thStyle}>Litros</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={tdStyle}>{labelExpenseType(exp.expense_type)}</td>
                    <td style={tdStyle}>{exp.amount.toFixed(2)}</td>
                    <td style={tdStyle}>
                      {exp.liters != null ? exp.liters : "-"}
                    </td>
                    <td style={tdStyle}>{exp.description ?? "-"}</td>
                    <td style={tdStyle}>{formatDate(exp.recorded_at)}</td>
                    <td style={tdStyle}>
                      {exp.is_voided ? (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Anulado</span>
                      ) : (
                        <button onClick={() => handleVoidExpense(exp.id)} style={voidButtonStyle}>
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assets / Evidencias — sin cambios */}
      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
          Evidencias de la orden
        </h2>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            background: "#fafafa",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Subir nueva evidencia
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              Categoría
            </label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                minWidth: "220px",
              }}
            >
              <option value="evidence">Evidencia</option>
              <option value="photo">Foto</option>
              <option value="report">Reporte</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              Archivo
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
                setUploadError(null);
                setUploadSuccess(null);
              }}
            />
          </div>

          {selectedFile && (
            <div style={{ marginBottom: "12px" }}>
              Archivo seleccionado: <strong>{selectedFile.name}</strong>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: uploading ? "#e5e7eb" : "white",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Subiendo..." : "Subir evidencia"}
          </button>

          {uploadError && (
            <div style={{ color: "#b91c1c", marginTop: "12px" }}>
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div style={{ color: "#15803d", marginTop: "12px" }}>
              {uploadSuccess}
            </div>
          )}
        </div>

        {assetsLoading && <div>Cargando archivos...</div>}

        {!assetsLoading && assetsError && (
          <div style={{ color: "#b91c1c" }}>Error: {assetsError}</div>
        )}

        {!assetsLoading && !assetsError && assets.length === 0 && (
          <div>No hay archivos para esta orden.</div>
        )}

        {!assetsLoading && !assetsError && assets.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Archivo</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const fileHref = asset.file_path
                    ? `${import.meta.env.VITE_API_BASE_URL}/assets/${asset.id}/file`
                    : asset.file_url || null;

                  return (
                    <tr key={asset.id}>
                      <td style={tdStyle}>{asset.id}</td>
                      <td style={tdStyle}>{labelAssetType(asset.asset_type)}</td>
                      <td style={tdStyle}>
                        {asset.original_name || asset.stored_name || "-"}
                      </td>
                      <td style={tdStyle}>
                        {formatDate(asset.captured_at || asset.created_at)}
                      </td>
                      <td style={tdStyle}>
                        {fileHref ? (
                          <a href={fileHref} target="_blank" rel="noreferrer">
                            Ver archivo
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function fromLabelPlaceholder(eventType: string): string {
  if (eventType === "customer_payment") return "ej. Cliente Juan García";
  if (eventType === "operator_handover") return "ej. Piloto Pedro";
  if (eventType === "dronic_receipt") return "ej. Socio Luis";
  return "";
}

function toLabelPlaceholder(eventType: string): string {
  if (eventType === "customer_payment") return "ej. Piloto Pedro";
  if (eventType === "operator_handover") return "ej. Socio Luis";
  if (eventType === "dronic_receipt") return "ej. DRONIC";
  return "";
}

function labelEventType(type: string): string {
  const map: Record<string, string> = {
    customer_payment: "Cobro al cliente",
    operator_handover: "Entrega piloto-socio",
    dronic_receipt: "Recepción DRONIC",
    direct_payment: "Pago directo a DRONIC",
  };
  return map[type] ?? type;
}

function labelExpenseType(type: string): string {
  const map: Record<string, string> = {
    fuel: "Gasolina",
    toll: "Caseta",
    labor: "Mano de obra",
    other: "Otro",
  };
  return map[type] ?? type;
}

function labelAssetType(type: string): string {
  const map: Record<string, string> = {
    evidence: "Evidencia",
    photo: "Foto",
    report: "Reporte",
    other: "Otro",
  };
  return map[type] ?? type;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function labelStatus(status: string): string {
  const map: Record<string, string> = {
    planned: "Planeada",
    in_progress: "En progreso",
    done: "Completada",
    canceled: "Cancelada",
  };
  return map[status] ?? status;
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  maxWidth: "900px",
};

const subCardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
  background: "#fafafa",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: "16px",
  padding: "10px 0",
  borderBottom: "1px solid #f0f0f0",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  minWidth: "220px",
  fontSize: "14px",
};

function submitButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: disabled ? "#e5e7eb" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
  };
}

const errorMsgStyle: React.CSSProperties = {
  color: "#b91c1c",
  marginTop: "10px",
  fontSize: "14px",
};

const successMsgStyle: React.CSSProperties = {
  color: "#15803d",
  marginTop: "10px",
  fontSize: "14px",
};

const backButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
};

const editToggleButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: "14px",
};

const voidButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid #fca5a5",
  background: "#fef2f2",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "12px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  background: "#f3f4f6",
  fontSize: "14px",
  color: "#111",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  fontSize: "14px",
  color: "#111",
};
