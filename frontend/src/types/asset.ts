export interface Asset {
  id: number;
  client_id: number;
  field_id?: number | null;
  service_order_id?: number | null;
  asset_type: string;
  original_name?: string | null;
  stored_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  file_url?: string | null;
  file_path?: string | null;
  notes?: string | null;
  captured_at?: string | null;
  created_at?: string | null;
  is_deleted?: boolean;
}
