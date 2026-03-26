import { apiFetch } from "./api";
import type { ServiceOrder } from "../types/serviceOrder";

export function getServiceOrders(): Promise<ServiceOrder[]> {
  return apiFetch<ServiceOrder[]>("/service-orders");
}

export function getServiceOrderById(id: number): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>(`/service-orders/${id}`);
}

export interface ServiceOrderCreate {
  client_id: number;
  rate_tier: "A" | "B" | "C";
  rate_per_ha: number;
  hectares_covered?: number;
  service_type?: string;
  field_id?: number;
}

export function createServiceOrder(payload: ServiceOrderCreate): Promise<ServiceOrder> {
  return apiFetch<ServiceOrder>("/service-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ServiceOrderUpdate {
  hectares_covered?: number;
  rate_per_ha?: number;
  status?: "planned" | "in_progress" | "done" | "canceled";
  notes?: string;
  pilot_brought_client?: boolean | null;
  scheduled_at?: string | null;
  performed_at?: string | null;
}

export function updateServiceOrder(
  id: number,
  payload: ServiceOrderUpdate,
  adminKey?: string,
): Promise<ServiceOrder> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) headers["X-Admin-Key"] = adminKey;
  return apiFetch<ServiceOrder>(`/service-orders/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}
