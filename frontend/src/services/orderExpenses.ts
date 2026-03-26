import { apiFetch } from "./api";
import type { OrderExpense, OrderExpenseCreate, OrderExpensesResponse } from "../types/orderExpense";

export function getOrderExpenses(serviceOrderId: number): Promise<OrderExpensesResponse> {
  return apiFetch<OrderExpensesResponse>(`/service-orders/${serviceOrderId}/expenses`);
}

export function createOrderExpense(
  serviceOrderId: number,
  payload: OrderExpenseCreate,
): Promise<OrderExpense> {
  return apiFetch<OrderExpense>(`/service-orders/${serviceOrderId}/expenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function voidOrderExpense(
  serviceOrderId: number,
  expenseId: number,
  payload: { void_reason: string; voided_by?: string },
  adminKey: string,
): Promise<OrderExpense> {
  return apiFetch<OrderExpense>(
    `/service-orders/${serviceOrderId}/expenses/${expenseId}/void`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      body: JSON.stringify(payload),
    },
  );
}
