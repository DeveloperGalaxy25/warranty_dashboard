import React, { useMemo, useState } from "react";
import { KPICards } from "./dashboard/KPICards";
import { DateRangePicker } from "./dashboard/DateRangePicker";
import { CustomerTable } from "./dashboard/CustomerTable";
import { StatusUpdateModal } from "./dashboard/StatusUpdateModal";
import { useWarrantyData, type WarrantyRecord } from "@/hooks/useWarrantyData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DateRange = { from: Date; to: Date };

// Customer shape consumed by dashboard subcomponents.
// Includes both lower-case and UpperCase keys to be compatible with
// components that were authored with different naming conventions.
export interface Customer {
  id: string;
  WarrantyID: string;
  Timestamp: string | number | Date;
  timestamp?: string | number | Date;
  Brand: string;
  brand?: string;
  CustomerName: string;
  Email: string;
  Mobile: string;
  Product: string;
  Status: string;
  status?: string;
  LastRemark: string;
  NextFollowUp?: string | number | Date;
  AssignedTo?: string;
  PurchasedFrom?: string;
  purchasedFrom?: string;
  WarrantyCardSent?: boolean;
  FeedbackReceived?: boolean;
  ExtendedWarrantySent?: boolean;
  FollowUpStatus?: 'Pending' | 'Completed' | 'Overdue';
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // Firestore Timestamp compatibility
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as Record<string, unknown>) &&
    typeof (value as any).toDate === "function"
  ) {
    const d = (value as any).toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const defaultRange: DateRange = {
  // default to last ~2 years so older rows (e.g., 2024) appear immediately
  from: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
  to: new Date(),
};

const WarrantyDashboard: React.FC = () => {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [selected, setSelected] = useState<WarrantyRecord | null>(null);
  const [brand, setBrand] = useState<string>("All");
  const [refreshVersion, setRefreshVersion] = useState<number>(0);
  const [searchId, setSearchId] = useState<string>("");
  const [activeWarrantyFilter, setActiveWarrantyFilter] = useState<string>("");
  const [showReviewPendingOnly, setShowReviewPendingOnly] = useState<boolean>(false);
  const [showTodayDueOnly, setShowTodayDueOnly] = useState<boolean>(false);

  const { data, loading, error } = useWarrantyData({
    brand: brand === "All" ? undefined : brand,
    startDate: range.from.toISOString(),
    endDate: range.to.toISOString(),
    // include refreshVersion so refetch occurs after save
    // (the hook stringifies filters; adding this will change the key)
    // @ts-ignore
    refreshVersion,
  } as any);

  const customers: Customer[] = useMemo(() => {
    return (data || []).map((w) => {
      const ts = w.timestamp || (w as any).Timestamp;
      const nf = w.nextFollowUp || (w as any).NextFollowUp;
      const tsDate = toDate(ts);
      const nfDate = toDate(nf);
      return {
        id: w.id,
        WarrantyID: w.warrantyId || (w as any).WarrantyID || w.id,
        Timestamp: tsDate ? tsDate.toISOString() : "",
        timestamp: tsDate ? tsDate.toISOString() : "",
        Brand: w.brand || (w as any).Brand || "",
        brand: w.brand || "",
        CustomerName: w.customerName || (w as any).CustomerName || "",
        Email: w.email || (w as any).Email || "",
        Mobile: w.phone || (w as any).Mobile || "",
        Product: w.product || (w as any).Product || "",
        WarrantyCardSent: (w as any).warrantyCardSent ?? (w as any).WarrantyCardSent ?? false,
        FeedbackReceived: (w as any).feedbackReceived ?? (w as any).FeedbackReceived ?? false,
        ExtendedWarrantySent: (w as any).extendedWarrantySent ?? (w as any).ExtendedWarrantySent ?? false,
        FollowUpStatus: (w as any).followUpStatus ?? (w as any).FollowUpStatus ?? 'Pending',
        NextFollowUp: nfDate ? nfDate.toISOString() : "",
        AssignedTo: w.assignedAgent || (w as any).AssignedTo || "",
        PurchasedFrom: w.purchasedFrom || (w as any).PurchasedFrom || "",
        purchasedFrom: w.purchasedFrom || (w as any).PurchasedFrom || "",
      } as Customer;
    });
  }, [data]);

  const dateFilteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const d = toDate(c.Timestamp) || toDate(c.timestamp);
      if (!d) return true;
      return d >= range.from && d <= range.to;
    });
  }, [customers, range]);

  // Keep the brand list static so options are always visible regardless of filters/date range
  const brandOptions = useMemo(() => {
    return ["Baybee", "Drogo", "Domestica"];
  }, []);

  const filteredCustomers = useMemo(() => {
    if (brand === "All") return dateFilteredCustomers;
    return dateFilteredCustomers.filter((c) => c.Brand === brand);
  }, [dateFilteredCustomers, brand]);

  // Apply search filter (by exact Warranty ID) to the already brand/date filtered list
  const searchFilteredCustomers = useMemo(() => {
    if (!activeWarrantyFilter.trim()) return filteredCustomers;
    return filteredCustomers.filter((c) => c.WarrantyID === activeWarrantyFilter.trim());
  }, [filteredCustomers, activeWarrantyFilter]);

  // Apply today's due filter
  const todayDueFilteredCustomers = useMemo(() => {
    if (!showTodayDueOnly) return searchFilteredCustomers;
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return searchFilteredCustomers.filter(customer => {
      if (customer.FeedbackReceived) return false; // Skip completed ones
      if (!customer.NextFollowUp) return false;
      
      const nextFollowUpDate = new Date(customer.NextFollowUp);
      const nextFollowUpStart = new Date(nextFollowUpDate.getFullYear(), nextFollowUpDate.getMonth(), nextFollowUpDate.getDate());
      
      return nextFollowUpStart.getTime() === todayStart.getTime();
    });
  }, [searchFilteredCustomers, showTodayDueOnly]);

  if (loading) return <p className="p-6">Loading warranties...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Warranty Dashboard</h1>
        <div className="flex items-center gap-3">
          <Select value={brand} onValueChange={(v) => { setBrand(v); setShowReviewPendingOnly(false); setShowTodayDueOnly(false); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Brands</SelectItem>
              {brandOptions.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker value={range} onChange={setRange} />
          {/* Search by Warranty ID (filters table; no new page or modal) */}
          <div className="flex items-center gap-2">
            <input
              className="border border-border rounded-md px-3 py-2 w-[220px] bg-background text-foreground"
              placeholder="Search Warranty ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowReviewPendingOnly(false);
                  setShowTodayDueOnly(false);
                  const v = searchId.trim();
                  setActiveWarrantyFilter(v);
                }
              }}
            />
            <button
              className="border border-border rounded-md px-3 py-2 bg-primary text-primary-foreground"
              onClick={() => {
                setShowReviewPendingOnly(false);
                setShowTodayDueOnly(false);
                setActiveWarrantyFilter(searchId.trim());
              }}
            >Search</button>
          </div>
        </div>
      </div>

      <KPICards 
        customers={todayDueFilteredCustomers as any}
        onReviewPendingClick={() => {
          // Apply filter: WarrantyCardSent=true AND FeedbackReceived=false
          setActiveWarrantyFilter("");
          setSearchId("");
          setShowReviewPendingOnly(true);
          setShowTodayDueOnly(false);
        }}
        onTotalClick={() => {
          // Clear all ad-hoc filters and show full dataset under current brand/date
          setShowReviewPendingOnly(false);
          setShowTodayDueOnly(false);
          setActiveWarrantyFilter("");
          setSearchId("");
        }}
        onTodayDueClick={() => {
          // Apply filter: Show only today's follow-ups due
          setActiveWarrantyFilter("");
          setSearchId("");
          setShowReviewPendingOnly(false);
          setShowTodayDueOnly(true);
        }}
      />

      <CustomerTable
        customers={(todayDueFilteredCustomers as any).filter((c: any) => (
          showReviewPendingOnly ? (Boolean(c.WarrantyCardSent) && !c.FeedbackReceived) : true
        ))}
        onCustomerClick={(c) => {
          const raw = data.find((w) => w.id === c.id || w.warrantyId === (c as any).WarrantyID);
          if (!raw) return;
          const normalized: WarrantyRecord = {
            id: raw.id,
            warrantyId: (raw as any).warrantyId ?? (raw as any).WarrantyID ?? raw.id,
            timestamp: toDate((raw as any).timestamp ?? (raw as any).Timestamp)?.toISOString() ?? "",
            brand: (raw as any).brand ?? (raw as any).Brand ?? "",
            customerName: (raw as any).customerName ?? (raw as any).CustomerName ?? "",
            email: (raw as any).email ?? (raw as any).Email ?? "",
            phone: (raw as any).phone ?? (raw as any).Mobile ?? "",
            orderId: (raw as any).orderId ?? (raw as any).OrderId ?? "",
            product: (raw as any).product ?? (raw as any).Product ?? "",
            purchasedFrom: (raw as any).purchasedFrom ?? (raw as any).PurchasedFrom ?? "",
            status: (raw as any).status ?? (raw as any).Status ?? "",
            lastRemark: (raw as any).lastRemark ?? (raw as any).LastRemark ?? "",
            nextFollowUp: toDate((raw as any).nextFollowUp ?? (raw as any).NextFollowUp)?.toISOString() ?? "",
            assignedAgent: (raw as any).assignedAgent ?? (raw as any).AssignedTo ?? "",
            lastUpdatedOn: (raw as any).lastUpdatedOn ?? (raw as any).LastUpdatedOn ?? "",
            warrantyCardUrl: (raw as any).warrantyCardUrl ?? (raw as any).WarrantyCardUrl ?? "",
            sourceKey: (raw as any).sourceKey ?? (raw as any).SourceKey ?? "",
          };
          setSelected(normalized);
        }}
      />

      {selected && (
        <StatusUpdateModal
          customer={selected}
          isOpen={Boolean(selected)}
          onClose={() => setSelected(null)}
          onUpdate={() => setRefreshVersion((v) => v + 1)}
        />
      )}
    </div>
  );
};

export default WarrantyDashboard;
