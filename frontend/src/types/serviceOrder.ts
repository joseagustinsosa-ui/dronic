export interface ServiceOrder {
  id: number;
  client_id: number;
  field_id?: number | null;
  service_type?: string | null;
  status: string;
  hectares_covered: number;
  rate_per_ha: number;
  total_amount: number;
  currency?: string | null;
  scheduled_at?: string | null;
  performed_at?: string | null;
  created_at?: string | null;
  client_paid_total?: number | null;
  dronic_received_total?: number | null;
  pilot_brought_client?: boolean | null;
  pilot_fee?: number | null;
  dronic_receipt_verified_at?: string | null;
  dronic_receipt_verified_by?: string | null;
  notes?: string | null;
}
