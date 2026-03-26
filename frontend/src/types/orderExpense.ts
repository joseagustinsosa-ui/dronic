export interface OrderExpense {
  id: number;
  service_order_id: number;
  expense_type: string;
  amount: number;
  currency: string;
  liters?: number | null;
  reference?: string | null;
  description?: string | null;
  notes?: string | null;
  recorded_at: string;
  recorded_by?: string | null;
  is_voided: boolean;
  voided_at?: string | null;
  voided_by?: string | null;
  void_reason?: string | null;
}

export interface OrderExpenseCreate {
  expense_type: "fuel" | "toll" | "labor" | "other";
  amount: number;
  currency?: string;
  liters?: number;
  reference?: string;
  description?: string;
  notes?: string;
  recorded_by?: string;
}

export interface OrderExpensesResponse {
  service_order_id: number;
  total_expenses: number;
  items: OrderExpense[];
}
