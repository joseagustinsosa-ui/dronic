import { apiFetch, apiUpload } from "./api";
import type { Asset } from "../types/asset";

export function getAssetsByServiceOrder(serviceOrderId: number): Promise<Asset[]> {
  return apiFetch<Asset[]>(`/service-orders/${serviceOrderId}/assets`);
}

export async function uploadAsset(
  serviceOrderId: number,
  file: File,
  assetType: string,
): Promise<Asset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("asset_type", assetType);

  return apiUpload<Asset>(
    `/service-orders/${serviceOrderId}/assets/upload`,
    formData,
  );
}
