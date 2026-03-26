import { apiFetch } from "./api";

export type Client = {
  id: number;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  notes?: string | null;
};

export function getClients(): Promise<Client[]> {
  return apiFetch<Client[]>("/clients");
}

export function createClient(payload: {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<Client> {
  return apiFetch<Client>("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
