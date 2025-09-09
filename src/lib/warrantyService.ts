// Sheets-based service using Apps Script Web App
// Use runtime configuration loaded from /config.json
import { getConfig } from './config';

function getBase(): string {
  const BASE = getConfig("SHEETS_API_BASE");
  if (!BASE || !BASE.startsWith('https://script.google.com/macros/')) {
    throw new Error('SHEETS_API_BASE missing or invalid. Check runtime configuration.');
  }
  return BASE;
}

function getToken(): string {
  return getConfig("SHEETS_API_TOKEN");
}

// Safe JSON parser that detects HTML responses
async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();
  if (text.trim().startsWith('<!DOCTYPE')) {
    throw new Error(`Non-JSON response (HTML): ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }
}

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

  const url = `${getBase()}?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch warranties: ${res.status}`);
  const json = await safeJsonParse(res);
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data as any[];
};

export const updateWarrantyStatus = async (
  warrantyId: string,
  updates: { status?: string; lastRemark?: string; nextFollowUp?: string; assignedAgent?: string },
  agent: string
) => {
  const payload: Record<string, string | undefined> = {
    token: getToken() || undefined,
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

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to update warranty: ${res.status}`);
  const json = await safeJsonParse(res);
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data;
};

// New endpoint: update review completion + remarks on Master_Registration
// and trigger extended warranty card generation on the backend (Apps Script).
// Review done: write to WorkFlow_Log only; optional remark
// ---- JSON API helpers aligned with Apps Script endpoints ----
async function apiPostJson<T = any>(payload: Record<string, any>): Promise<T> {
  // Send payload as form-encoded to avoid preflight
  const body = new URLSearchParams();
  body.append("token", getToken());
  Object.entries(payload).forEach(([key, value]) => {
    // Preserve field names; stringify non-primitives
    body.append(key, typeof value === "string" ? value : JSON.stringify(value));
  });
  const res = await fetch(getBase(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  });
  if (!res.ok) throw new Error(`API POST failed: ${res.status}`);
  return (await safeJsonParse(res)) as T;
}

async function apiGetJson<T = any>(params: Record<string, any>): Promise<T> {
  const search = new URLSearchParams();
  Object.entries({ token: getToken() || undefined, ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.append(k, String(v));
  });
  const url = `${getBase()}?${search.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`API GET failed: ${res.status}`);
  return (await safeJsonParse(res)) as T;
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
  body.append("token", getToken());
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

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to log follow-up: ${res.status}`);
  const json = await safeJsonParse(res);
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
  body.append("token", getToken());
  body.append("action", "updateReviewAndTriggerCard");
  body.append("warrantyId", warrantyId);
  body.append("reviewDone", "true");
  body.append("extendedWarrantySent", "true");
  if (reviewRemark) body.append("remarks", reviewRemark);
  body.append("updatedBy", updatedBy);

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to mark review done: ${res.status}`);
  const json = await safeJsonParse(res);
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
  body.append("token", getToken());
  body.append("action", "updateBooleanFlags");
  body.append("warrantyId", warrantyId);
  if (flags.WarrantyCardSent !== undefined) body.append("WarrantyCardSent", String(flags.WarrantyCardSent));
  if (flags.FeedbackReceived !== undefined) body.append("FeedbackReceived", String(flags.FeedbackReceived));
  if (flags.ExtendedWarrantySent !== undefined) body.append("ExtendedWarrantySent", String(flags.ExtendedWarrantySent));
  body.append("updatedBy", agent);

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to update flags: ${res.status}`);
  const json = await safeJsonParse(res);
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json.data;
};

// Fetch workflow history entries from WorkFlow_Log for a warranty
export const getWorkflowHistory = async (
  warrantyId: string
): Promise<any[]> => {
  return apiGetJson({ action: 'getHistory', warrantyId }) as Promise<any[]>;
};

// Get follow-up state for a warranty
export const getFollowupState = async (
  warrantyId: string
): Promise<{
  warrantyId: string;
  followUp1: { done: boolean; timestamp: string; remark: string };
  followUp2: { done: boolean; date: string; remark: string };
  followUp3: { done: boolean; date: string; remark: string };
  followupsDone: number;
}> => {
  return apiGetJson({ action: 'getFollowupState', warrantyId });
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

// Lightweight in-memory cache + request de-duplication for follow-up summaries
const FOLLOWUP_SUMMARY_TTL_MS = 60_000; // 1 minute TTL to avoid stale UI
const followupSummaryCache = new Map<string, { value: FollowUpSummary; expires: number }>();
const inflightBatchRequests = new Map<string, Promise<Record<string, FollowUpSummary>>>();

export const getFollowupSummaryBatch = async (ids: string[]): Promise<Record<string, FollowUpSummary>> => {
  if (ids.length === 0) return {};

  // Split into cache hits and misses based on TTL
  const now = Date.now();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const cachedPart: Record<string, FollowUpSummary> = {};
  const missingIds: string[] = [];

  uniqueIds.forEach((id) => {
    const entry = followupSummaryCache.get(id);
    if (entry && entry.expires > now) {
      cachedPart[id] = entry.value;
    } else {
      missingIds.push(id);
    }
  });

  if (missingIds.length === 0) {
    return cachedPart;
  }

  // Use a stable key for de-duplicating concurrent batch requests
  const key = missingIds.slice().sort().join(',');
  let pending = inflightBatchRequests.get(key);
  if (!pending) {
    pending = apiGetJson({ action: 'summaryBatch', ids: missingIds.join(',') }) as Promise<Record<string, FollowUpSummary>>;
    inflightBatchRequests.set(key, pending);
  }

  try {
    const fetched = await pending;
    // Populate cache with fresh results
    const expiry = Date.now() + FOLLOWUP_SUMMARY_TTL_MS;
    Object.entries(fetched || {}).forEach(([id, summary]) => {
      followupSummaryCache.set(id, { value: summary as FollowUpSummary, expires: expiry });
    });
    // Merge cachedPart with fetched subset for requested ids only
    const result: Record<string, FollowUpSummary> = { ...cachedPart };
    missingIds.forEach((id) => {
      if (fetched && fetched[id]) {
        result[id] = fetched[id] as FollowUpSummary;
      }
    });
    return result;
  } finally {
    inflightBatchRequests.delete(key);
  }
};

export const getFollowupSummary = async (warrantyId: string): Promise<FollowUpSummary> => {
  const map = await getFollowupSummaryBatch([warrantyId]);
  return map[warrantyId] || { count: 0, stages: [], latest: null, nextDue: null };
};

// Get first follow-up KPI data
export const getFirstFollowupKpi = async (): Promise<{ count: number; asOf: string }> => {
  return apiGetJson({ action: 'firstFollowupKpi' });
};

// Get list of first follow-ups
export const getFirstFollowups = async (): Promise<any[]> => {
  const response = await apiGetJson({ action: 'listFirstFollowups' });
  return response.success ? response.data : [];
};

// Evaluate 24h NRY (fire-and-forget)
export const evaluate24NRY = async (): Promise<void> => {
  try {
    await apiGetJson({ action: 'evaluate24NRY' });
  } catch (error) {
    console.warn('24h NRY evaluation failed:', error);
  }
};

// Get today's follow-ups KPI data
export const getTodaysFollowupsKpi = async (): Promise<{ count: number; asOf: string }> => {
  return apiGetJson({ action: 'todaysFollowupsKpi' });
};

// Get list of today's follow-ups
export const getTodaysFollowups = async (): Promise<any[]> => {
  const response = await apiGetJson({ action: 'listTodaysFollowups' });
  return response.success ? response.data : [];
};

// New function: Update follow-up status with automatic timestamp detection
export const updateFollowUpStatus = async (
  data: {
    warrantyId: string;
    followUp1Remark?: string;
  }
): Promise<{ 
  success: boolean; 
  alreadyDone?: boolean; 
  followupsDone: number; 
  f1Timestamp?: string; 
  f1Remark?: string; 
  followUp2Date?: string; 
  followUp3Date?: string; 
}> => {
  const body = new URLSearchParams();
  body.append("token", getToken());
  body.append("action", "updateFollowUpStatus");
  body.append("warrantyId", data.warrantyId);
  if (data.followUp1Remark) body.append("followUp1Remark", data.followUp1Remark);
  body.append("updatedBy", "Dashboard");

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to update follow-up status: ${res.status}`);
  const json = await safeJsonParse(res);
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json;
};

// New function: Mark follow-up as done
export const markFollowUp = async (
  warrantyId: string,
  followUpNo: 2 | 3,
  remark: string
): Promise<{ 
  success: boolean; 
  alreadyDone?: boolean; 
  followupsDone: number; 
  f1Timestamp?: string; 
  f1Remark?: string; 
  followUp2Date?: string; 
  followUp3Date?: string; 
}> => {
  const body = new URLSearchParams();
  body.append("token", getToken());
  body.append("action", "markFollowUp");
  body.append("warrantyId", warrantyId);
  body.append("followUpNo", String(followUpNo));
  body.append("remark", remark);
  body.append("updatedBy", "Dashboard");

  const res = await fetch(getBase(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  if (!res.ok) throw new Error(`Failed to mark follow-up: ${res.status}`);
  const json = await safeJsonParse(res);
  if (!json?.success) throw new Error(json?.error || "Unknown API error");
  return json;
};
