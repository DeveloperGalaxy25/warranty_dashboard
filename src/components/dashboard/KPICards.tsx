import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
// Icons removed per requirement
import { Customer } from "../WarrantyDashboard";
import { useEffect, useState } from "react";
import { getFirstFollowupKpi, getTodaysFollowupsKpi } from "@/lib/warrantyService";

interface KPICardsProps {
  customers: Customer[];
  onReviewPendingClick?: () => void;
  onTotalClick?: () => void;
  onTodayDueClick?: () => void;
  onFirstFollowupClick?: () => void;
  onRegistrationsTodayClick?: () => void;
  onReviewsWonClick?: () => void;
  resetSignal?: number;
}

export const KPICards = ({ customers, onReviewPendingClick, onTotalClick, onTodayDueClick, onFirstFollowupClick, onRegistrationsTodayClick, onReviewsWonClick, resetSignal }: KPICardsProps) => {
  const [firstFollowupKpi, setFirstFollowupKpi] = useState<{ count: number; asOf: string } | null>(null);
  const [todaysFollowupsKpi, setTodaysFollowupsKpi] = useState<{ count: number; asOf: string } | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const totalRegistrations = customers.length;
  const registrationsToday = customers.filter(
    customer => new Date(customer.timestamp) >= todayStart
  ).length;
  const warrantyCardsSent = customers.filter(
    customer => Boolean(customer.WarrantyCardSent)
  ).length;
  const stillReviewPending = customers.filter(
    customer => Boolean(customer.WarrantyCardSent) && !customer.FeedbackReceived
  ).length;

  // Reviews Won (feedback received)
  const reviewsWon = customers.filter(customer => Boolean(customer.FeedbackReceived)).length;

  // Calculate today's follow-ups due
  const todayDueCount = customers.filter(customer => {
    if (customer.FeedbackReceived) return false; // Skip completed ones
    if (!customer.NextFollowUp) return false;
    
    const nextFollowUpDate = new Date(customer.NextFollowUp);
    const nextFollowUpStart = new Date(nextFollowUpDate.getFullYear(), nextFollowUpDate.getMonth(), nextFollowUpDate.getDate());
    
    return nextFollowUpStart.getTime() === todayStart.getTime();
  }).length;

  // Fetch first follow-up KPI data on mount
  useEffect(() => {
    const fetchFirstFollowupKpi = async () => {
      try {
        const kpi = await getFirstFollowupKpi();
        setFirstFollowupKpi(kpi);
      } catch (error) {
        console.error('Failed to fetch first follow-up KPI:', error);
      }
    };
    
    fetchFirstFollowupKpi();
  }, []);

  // Reset active visual state when parent asks
  useEffect(() => {
    setActiveKey(null);
  }, [resetSignal]);

  // Fetch today's follow-ups KPI data on mount
  useEffect(() => {
    const fetchTodaysFollowupsKpi = async () => {
      try {
        const kpi = await getTodaysFollowupsKpi();
        setTodaysFollowupsKpi(kpi);
      } catch (error) {
        console.error('Failed to fetch today\'s follow-ups KPI:', error);
      }
    };
    
    fetchTodaysFollowupsKpi();
  }, []);

  const kpis = [
    {
      title: "Total Registrations",
      value: totalRegistrations,
      description: "in selected range",
      trend: "+12%",
      className: "bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg border-blue-200",
      clickable: true as const,
    },
    {
      title: "Registrations Today",
      value: registrationsToday,
      description: "new today",
      trend: "+5",
      className: "bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg border-green-200",
      clickable: true as const,
    },
    {
      title: "Warranty Cards Sent",
      value: warrantyCardsSent,
      description: "cards processed",
      trend: `${Math.round((warrantyCardsSent / totalRegistrations) * 100)}%`,
      className: "bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg border-purple-200"
    },
    {
      title: "Still Review Pending",
      value: stillReviewPending,
      description: "awaiting review",
      trend: stillReviewPending > 0 ? "needs attention" : "all good",
      className: "bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg border-orange-200",
      clickable: true as const,
    },
    {
      title: "Reviews Won",
      value: reviewsWon,
      description: "feedback received",
      trend: reviewsWon > 0 ? "growing" : "-",
      className: "bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg border-emerald-200",
      clickable: true as const,
    },
    {
      title: "Today's Follow-ups Due",
      value: todaysFollowupsKpi?.count || 0,
      description: todaysFollowupsKpi?.asOf ? `as of ${new Date(todaysFollowupsKpi.asOf).toLocaleString()}` : "due today",
      trend: todaysFollowupsKpi?.count ? "requires action" : "all caught up",
      className: "bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-lg border-yellow-200",
      clickable: true as const,
    },
    {
      title: "1st Follow-ups",
      value: firstFollowupKpi?.count || 0,
      description: firstFollowupKpi?.asOf ? `as of ${new Date(firstFollowupKpi.asOf).toLocaleString()}` : "loading...",
      trend: firstFollowupKpi ? "ready" : "loading",
      className: "bg-gradient-to-br from-teal-50 to-teal-100 hover:shadow-lg border-teal-200",
      clickable: true as const,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
      {kpis.map((kpi, index) => {
        const valueClass = kpi.title === "Still Review Pending"
          ? (kpi.value > 0 ? "text-amber-600 font-extrabold" : "text-muted-foreground")
          : kpi.title === "Today's Follow-ups Due"
          ? (kpi.value > 0 ? "text-orange-600 font-extrabold" : "text-muted-foreground")
          : "text-foreground";

        const isClickable = (kpi as any).clickable;
        const isActive = activeKey === kpi.title;
        return (
          <Card
            key={index}
            className={`transition-all duration-300 hover:scale-105 border ${kpi.className} ${isClickable ? 'cursor-pointer' : ''} ${isActive ? 'ring-2 ring-offset-2 ring-current' : ''}`}
            onClick={() => {
              if (!isClickable) return;
              setActiveKey(kpi.title);
              if (kpi.title === "Still Review Pending" && onReviewPendingClick) onReviewPendingClick();
              if (kpi.title === "Total Registrations" && onTotalClick) onTotalClick();
              if (kpi.title === "Today's Follow-ups Due" && onTodayDueClick) onTodayDueClick();
              if (kpi.title === "1st Follow-ups" && onFirstFollowupClick) onFirstFollowupClick();
              if (kpi.title === "Registrations Today" && onRegistrationsTodayClick) onRegistrationsTodayClick();
              if (kpi.title === "Reviews Won" && onReviewsWonClick) onReviewsWonClick();
            }}
          >
            <CardContent className="p-6">
              <div>
                <CardDescription className="text-muted-foreground text-sm font-medium">
                  {kpi.title}
                </CardDescription>
                <CardTitle className={`text-3xl mt-2 ${valueClass}`}>
                  {kpi.value.toLocaleString()}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};