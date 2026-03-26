import { apiFetch } from "./api";
import type { PaymentEvent, PaymentEventCreate } from "../types/paymentEvent";

export function getPaymentEvents(serviceOrderId: number): Promise<PaymentEvent[]> {
  return apiFetch<PaymentEvent[]>(`/service-orders/${serviceOrderId}/payment-events`);
}

export function createPaymentEvent(
  serviceOrderId: number,
  payload: PaymentEventCreate,
): Promise<PaymentEvent> {
  return apiFetch<PaymentEvent>(`/service-orders/${serviceOrderId}/payment-events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function voidPaymentEvent(
  serviceOrderId: number,
  eventId: number,
  payload: { void_reason: string; voided_by?: string },
  adminKey: string,
): Promise<PaymentEvent> {
  return apiFetch<PaymentEvent>(
    `/service-orders/${serviceOrderId}/payment-events/${eventId}/void`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    },
  );
}
