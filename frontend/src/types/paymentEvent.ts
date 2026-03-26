export interface PaymentEvent {
  id: number;
  service_order_id: number;
  event_type: string;
  amount: number;
  currency: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  from_label?: string | null;
  to_label?: string | null;
  recorded_at: string;
  recorded_by?: string | null;
  is_voided: boolean;
  voided_at?: string | null;
  voided_by?: string | null;
  void_reason?: string | null;
}

export interface PaymentEventCreate {
  event_type: "customer_payment" | "operator_handover" | "dronic_receipt" | "direct_payment";
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
  notes?: string;
  from_label?: string;
  to_label?: string;
  recorded_by?: string;
}
