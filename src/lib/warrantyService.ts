// Sheets-based service using Apps Script Web App
const BASE = (import.meta as any).env?.VITE_SHEETS_API_BASE || "";
const TOKEN = (import.meta as any).env?.VITE_SHEETS_API_TOKEN || "";

export const getWarranties = async (filters?: {
  brand?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}) => {
  const params = new URLSearchParams({ action: "warranties" });
  if (filters?.brand && filters.brand !== "All") params.set("brand", String(filters.brand));
  if (filters?.startDate) params.set("start", filters.startDate);
  if (filters?.endDate) params.set("end", filters.endDate);

  const url = `${BASE}?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch warranties: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data as any[];
};

export const updateWarrantyStatus = async (
  warrantyId: string,
  updates: { status?: string; lastRemark?: string; nextFollowUp?: string; assignedAgent?: string },
  agent: string
) => {
  const payload: Record<string, string | undefined> = {
    token: TOKEN || undefined,
    warrantyId,
    status: updates.status,
    remark: updates.lastRemark,
    nextFollowUp: updates.nextFollowUp,
    assignedTo: updates.assignedAgent,
    updatedBy: agent,
  };

  // Use form-encoded body to avoid CORS preflight issues with Apps Script
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) body.append(k, String(v));
  });

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to update warranty: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data;
};
