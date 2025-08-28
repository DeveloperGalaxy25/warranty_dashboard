// Sheets-based service using Apps Script Web App
const BASE = (import.meta as any).env?.VITE_SHEETS_API_BASE || "";
const TOKEN = (import.meta as any).env?.VITE_SHEETS_API_TOKEN || "";

export const getWarranties = async (filters?: {
  brand?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}) => {
  // NOTE: Backend must expose an action to list warranties. If missing, this will 400.
  const params = new URLSearchParams({ action: "listWarranties" });
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

// New endpoint: update review completion + remarks on Master_Registration
// and trigger extended warranty card generation on the backend (Apps Script).
// Review done: write to WorkFlow_Log only; optional remark
// ---- JSON API helpers aligned with Apps Script endpoints ----
async function apiPostJson<T = any>(payload: Record<string, any>): Promise<T> {
  const body = { token: TOKEN || undefined, ...payload };
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST failed: ${res.status}`);
  return (await res.json()) as T;
}

async function apiGetJson<T = any>(params: Record<string, any>): Promise<T> {
  const search = new URLSearchParams();
  Object.entries({ token: TOKEN || undefined, ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.append(k, String(v));
  });
  const url = `${BASE}?${search.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`API GET failed: ${res.status}`);
  return (await res.json()) as T;
}

// Apps Script-backed: Append a row into WorkFlow_Log
export const logFollowUpAction = async (
  warrantyId: string,
  customerName: string,
  brand: string,
  followUpNo: number,
  followUpDate: string,
  nextDueDate: string | null,
  status: string,
  remark: string,
  assignedTo: string = "",
  updatedBy: string = "Dashboard"
): Promise<{ success: boolean }> => {
  const body = new URLSearchParams();
  body.append("token", TOKEN);
  body.append("action", "logFollowUpAction");
  body.append("warrantyId", warrantyId);
  body.append("customerName", customerName);
  body.append("brand", brand);
  body.append("followUpNo", String(followUpNo));
  body.append("followUpDate", followUpDate);
  if (nextDueDate) body.append("nextDueDate", nextDueDate);
  body.append("status", status);
  body.append("remark", remark);
  body.append("assignedTo", assignedTo);
  body.append("updatedBy", updatedBy);

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to log follow-up: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return { success: true };
};

// Apps Script-backed: mark review done and trigger extended card flow
export const markReviewDone = async (
  warrantyId: string,
  reviewRemark: string,
  updatedBy: string = "Dashboard"
): Promise<{ success: boolean }> => {
  const body = new URLSearchParams();
  body.append("token", TOKEN);
  body.append("action", "updateReviewAndTriggerCard");
  body.append("warrantyId", warrantyId);
  body.append("reviewDone", "true");
  if (reviewRemark) body.append("remarks", reviewRemark);
  body.append("updatedBy", updatedBy);

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to mark review done: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return { success: true };
};

// Optional: Endpoint to update boolean flags directly, e.g., after async processing
export const updateBooleanFlags = async (
  warrantyId: string,
  flags: Partial<{ WarrantyCardSent: boolean; FeedbackReceived: boolean; ExtendedWarrantySent: boolean }>,
  agent: string
) => {
  const body = new URLSearchParams();
  body.append("token", TOKEN);
  body.append("action", "updateBooleanFlags");
  body.append("warrantyId", warrantyId);
  if (flags.WarrantyCardSent !== undefined) body.append("WarrantyCardSent", String(flags.WarrantyCardSent));
  if (flags.FeedbackReceived !== undefined) body.append("FeedbackReceived", String(flags.FeedbackReceived));
  if (flags.ExtendedWarrantySent !== undefined) body.append("ExtendedWarrantySent", String(flags.ExtendedWarrantySent));
  body.append("updatedBy", agent);

  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to update flags: ${res.status}`);
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data;
};

// Fetch workflow history entries from WorkFlow_Log for a warranty
export const getWorkflowHistory = async (
  warrantyId: string
): Promise<any[]> => {
  return apiGetJson({ action: 'getHistory', warrantyId }) as Promise<any[]>;
};

export const getCustomerDetails = async (warrantyId: string): Promise<any> => {
  return apiGetJson({ action: 'getCustomerDetails', warrantyId });
};

export type FollowUpSummary = {
  count: number;
  stages: number[];
  latest: string | null;
  nextDue: string | null | string;
};

export const getFollowupSummaryBatch = async (ids: string[]): Promise<Record<string, FollowUpSummary>> => {
  if (ids.length === 0) return {};
  return apiGetJson({ action: 'summaryBatch', ids: ids.join(',') }) as Promise<Record<string, FollowUpSummary>>;
};

export const getFollowupSummary = async (warrantyId: string): Promise<FollowUpSummary> => {
  const map = await getFollowupSummaryBatch([warrantyId]);
  return map[warrantyId] || { count: 0, stages: [], latest: null, nextDue: null };
};
