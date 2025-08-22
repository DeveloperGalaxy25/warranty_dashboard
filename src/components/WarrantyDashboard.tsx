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
        Status: w.status || (w as any).Status || "",
        status: w.status || "",
        LastRemark: w.lastRemark || (w as any).LastRemark || "",
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

  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((w) => { 
      const brand = w.brand || (w as any).Brand;
      if (brand) set.add(brand); 
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredCustomers = useMemo(() => {
    if (brand === "All") return dateFilteredCustomers;
    return dateFilteredCustomers.filter((c) => c.Brand === brand);
  }, [dateFilteredCustomers, brand]);

  if (loading) return <p className="p-6">Loading warranties...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Warranty Dashboard</h1>
        <div className="flex items-center gap-3">
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Brands</SelectItem>
              {brandOptions.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      <KPICards customers={filteredCustomers as any} />

      <CustomerTable
        customers={filteredCustomers as any}
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
