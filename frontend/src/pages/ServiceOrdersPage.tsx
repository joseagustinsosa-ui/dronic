import React, { useEffect, useState } from "react";
import { getServiceOrders, createServiceOrder } from "../services/serviceOrders";
import type { ServiceOrderCreate } from "../services/serviceOrders";
import { getClients, createClient, type Client } from "../services/clients";
import type { ServiceOrder } from "../types/serviceOrder";

type Props = {
  onSelectOrder: (id: number) => void;
  isAdmin: boolean;
};

export default function ServiceOrdersPage({ onSelectOrder, isAdmin }: Props) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Nuevo cliente
  const [showClientForm, setShowClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [submittingClient, setSubmittingClient] = useState(false);
  const [clientFormError, setClientFormError] = useState<string | null>(null);

  // Nueva orden
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newOrderClientId, setNewOrderClientId] = useState("");
  const [newOrderRateTier, setNewOrderRateTier] = useState<"A" | "B" | "C">("A");
  const [newOrderRatePerHa, setNewOrderRatePerHa] = useState("");
  const [newOrderHectares, setNewOrderHectares] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderFormError, setOrderFormError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [ordersData, clientsData] = await Promise.all([
        getServiceOrders(),
        getClients(),
      ]);

      setOrders(ordersData);
      setClients(clientsData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error loading service orders");
      } else {
        setError("Error loading service orders");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getClientName(clientId: number) {
    const matchedClient = clients.find((client) => client.id === clientId);
    return matchedClient?.name || `Cliente #${clientId}`;
  }

  async function handleCreateClient() {
    if (!newClientName.trim()) {
      setClientFormError("El nombre es requerido");
      return;
    }
    try {
      setSubmittingClient(true);
      setClientFormError(null);
      await createClient({ name: newClientName.trim() });
      await loadData();
      setNewClientName("");
      setShowClientForm(false);
    } catch (err) {
      setClientFormError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setSubmittingClient(false);
    }
  }

  async function handleCreateOrder() {
    const clientId = parseInt(newOrderClientId);
    const ratePerHa = parseFloat(newOrderRatePerHa);
    const hectares = newOrderHectares ? parseFloat(newOrderHectares) : undefined;

    if (!newOrderClientId || isNaN(clientId)) {
      setOrderFormError("Selecciona un cliente");
      return;
    }
    if (!newOrderRatePerHa || isNaN(ratePerHa) || ratePerHa <= 0) {
      setOrderFormError("Tarifa por ha debe ser > 0");
      return;
    }
    if (hectares !== undefined && (isNaN(hectares) || hectares < 0)) {
      setOrderFormError("Hectáreas inválidas");
      return;
    }

    const payload: ServiceOrderCreate = {
      client_id: clientId,
      rate_tier: newOrderRateTier,
      rate_per_ha: ratePerHa,
      ...(hectares !== undefined && { hectares_covered: hectares }),
    };

    try {
      setSubmittingOrder(true);
      setOrderFormError(null);
      const newOrder = await createServiceOrder(payload);
      await loadData();
      setNewOrderClientId("");
      setNewOrderRatePerHa("");
      setNewOrderHectares("");
      setShowOrderForm(false);
      onSelectOrder(newOrder.id);
    } catch (err) {
      setOrderFormError(err instanceof Error ? err.message : "Error al crear orden");
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "24px" }}>Cargando órdenes...</div>;
  }

  if (error) {
    return <div style={{ padding: "24px" }}>Error: {error}</div>;
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#111",
        background: "#f7f8fa",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Órdenes de servicio</h1>
      <p style={{ marginTop: 0, color: "#666" }}>
        Vista operativa inicial de DRONIC
      </p>

      {/* Acciones */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => { setShowClientForm(!showClientForm); setShowOrderForm(false); }}
          style={actionButtonStyle}
        >
          {showClientForm ? "Cancelar" : "+ Nuevo cliente"}
        </button>
        <button
          onClick={() => { setShowOrderForm(!showOrderForm); setShowClientForm(false); }}
          style={actionButtonStyle}
        >
          {showOrderForm ? "Cancelar" : "+ Nueva orden"}
        </button>
      </div>

      {/* Formulario nuevo cliente */}
      {showClientForm && (
        <div style={formCardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Nuevo cliente</h3>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Nombre *</label>
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              style={inputStyle}
              placeholder="Nombre del cliente"
            />
          </div>
          {clientFormError && <div style={errorStyle}>{clientFormError}</div>}
          <button
            onClick={handleCreateClient}
            disabled={submittingClient}
            style={submitStyle(submittingClient)}
          >
            {submittingClient ? "Guardando..." : "Guardar cliente"}
          </button>
        </div>
      )}

      {/* Formulario nueva orden */}
      {showOrderForm && (
        <div style={formCardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Nueva orden</h3>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Cliente *</label>
            <select
              value={newOrderClientId}
              onChange={(e) => setNewOrderClientId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Tier de tarifa *</label>
            <select
              value={newOrderRateTier}
              onChange={(e) => setNewOrderRateTier(e.target.value as "A" | "B" | "C")}
              style={inputStyle}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Tarifa por ha (MXN) *</label>
            <input
              type="number"
              value={newOrderRatePerHa}
              onChange={(e) => setNewOrderRatePerHa(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelStyle}>Hectáreas cubiertas</label>
            <input
              type="number"
              value={newOrderHectares}
              onChange={(e) => setNewOrderHectares(e.target.value)}
              style={inputStyle}
              placeholder="0.0 (opcional)"
              min="0"
              step="0.1"
            />
          </div>
          {orderFormError && <div style={errorStyle}>{orderFormError}</div>}
          <button
            onClick={handleCreateOrder}
            disabled={submittingOrder}
            style={submitStyle(submittingOrder)}
          >
            {submittingOrder ? "Guardando..." : "Guardar orden"}
          </button>
        </div>
      )}

      {/* Balance admin */}
      {isAdmin && (() => {
        const totalFacturado = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
        const pendientePorCobrar = orders.reduce((sum, o) => sum + ((o.total_amount ?? 0) - (o.client_paid_total ?? 0)), 0);
        const porEntregarDronic = orders.reduce((sum, o) => sum + ((o.client_paid_total ?? 0) - (o.dronic_received_total ?? 0)), 0);
        const adeudoPiloto = orders
          .filter(o => o.status === "in_progress" || o.status === "done")
          .reduce((sum, o) => sum + (o.pilot_fee ?? 0), 0);
        return (
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={metricCardStyle}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Total de órdenes</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>${totalFacturado.toFixed(2)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Pendiente por cobrar</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>${pendientePorCobrar.toFixed(2)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Por entregar a DRONIC</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>${porEntregarDronic.toFixed(2)}</div>
            </div>
            <div style={metricCardStyle}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Adeudo total al piloto</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>${adeudoPiloto.toFixed(2)}</div>
            </div>
          </div>
        );
      })()}

      {/* Tabla de órdenes */}
      <div
        style={{
          overflowX: "auto",
          background: "white",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Campo</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Hectáreas</th>
              <th style={thStyle}>Tarifa</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={tdStyle}>{order.id}</td>
                <td style={tdStyle}>{getClientName(order.client_id)}</td>
                <td style={tdStyle}>{order.field_id ?? "-"}</td>
                <td style={tdStyle}>{order.service_type ?? "-"}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      background:
                        order.status === "done" ? "#dcfce7" : "#fef3c7",
                      color: order.status === "done" ? "#166534" : "#92400e",
                    }}
                  >
                    {labelStatus(order.status)}
                  </span>
                </td>
                <td style={tdStyle}>{order.hectares_covered}</td>
                <td style={tdStyle}>{order.rate_per_ha}</td>
                <td style={tdStyle}>{order.total_amount}</td>
                <td style={tdStyle}>{formatDate(getOrderDate(order))}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => onSelectOrder(order.id)}
                    style={buttonStyle}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "white",
  cursor: "pointer",
};

const metricCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px 20px",
  minWidth: "180px",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  fontSize: "14px",
};

const formCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "20px",
  maxWidth: "480px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontWeight: 700,
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  width: "100%",
  fontSize: "14px",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: "14px",
  marginBottom: "10px",
};

function submitStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: disabled ? "#e5e7eb" : "#111827",
    color: disabled ? "#6b7280" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function getOrderDate(order: ServiceOrder): string | null | undefined {
  if (order.status === "done") {
    return order.performed_at ?? order.scheduled_at;
  }
  return order.scheduled_at;
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
