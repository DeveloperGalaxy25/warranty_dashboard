import { useEffect, useState } from "react";
import { getWarranties } from "@/lib/warrantyService";

export interface WarrantyRecord {
  id: string;
  warrantyId: string;
  timestamp: string;
  brand: string;
  customerName: string;
  email: string;
  phone: string;
  orderId: string;
  product: string;
  purchasedFrom: string;
  status: string;
  lastRemark: string;
  nextFollowUp: string;
  assignedAgent: string;
  lastUpdatedOn: string;
  warrantyCardUrl: string;
  sourceKey: string;
  extendedWarrantySent?: boolean;
  followupsDone?: number;
}

export const useWarrantyData = (filters?: {
  status?: string;
  brand?: string;
  agent?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const warranties = await getWarranties(filters);
        setData(warranties);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
};
