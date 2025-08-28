import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Send, AlertTriangle, Calendar } from "lucide-react";
import { Customer } from "../WarrantyDashboard";

interface KPICardsProps {
  customers: Customer[];
  onReviewPendingClick?: () => void;
  onTotalClick?: () => void;
  onTodayDueClick?: () => void;
}

export const KPICards = ({ customers, onReviewPendingClick, onTotalClick, onTodayDueClick }: KPICardsProps) => {
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

  // Calculate today's follow-ups due
  const todayDueCount = customers.filter(customer => {
    if (customer.FeedbackReceived) return false; // Skip completed ones
    if (!customer.NextFollowUp) return false;
    
    const nextFollowUpDate = new Date(customer.NextFollowUp);
    const nextFollowUpStart = new Date(nextFollowUpDate.getFullYear(), nextFollowUpDate.getMonth(), nextFollowUpDate.getDate());
    
    return nextFollowUpStart.getTime() === todayStart.getTime();
  }).length;

  const kpis = [
    {
      title: "Total Registrations",
      value: totalRegistrations,
      description: "in selected range",
      icon: Users,
      trend: "+12%",
      className: "bg-gradient-to-br from-card to-accent/20 hover:shadow-lg",
      clickable: true as const,
    },
    {
      title: "Registrations Today",
      value: registrationsToday,
      description: "new today",
      icon: TrendingUp,
      trend: "+5",
      className: "bg-gradient-to-br from-card to-primary-light/30 hover:shadow-lg"
    },
    {
      title: "Warranty Cards Sent",
      value: warrantyCardsSent,
      description: "cards processed",
      icon: Send,
      trend: `${Math.round((warrantyCardsSent / totalRegistrations) * 100)}%`,
      className: "bg-gradient-to-br from-card to-success/20 hover:shadow-lg"
    },
    {
      title: "Still Review Pending",
      value: stillReviewPending,
      description: "awaiting review",
      icon: AlertTriangle,
      trend: stillReviewPending > 0 ? "needs attention" : "all good",
      className: "bg-gradient-to-br from-card to-warning/20 hover:shadow-lg",
      clickable: true as const,
    },
    {
      title: "Today's Follow-ups Due",
      value: todayDueCount,
      description: "due today",
      icon: Calendar,
      trend: todayDueCount > 0 ? "requires action" : "all caught up",
      className: "bg-gradient-to-br from-card to-orange-100 hover:shadow-lg",
      clickable: true as const,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {kpis.map((kpi, index) => {
        const valueClass = kpi.title === "Still Review Pending"
          ? (kpi.value > 0 ? "text-amber-600 font-extrabold" : "text-muted-foreground")
          : kpi.title === "Today's Follow-ups Due"
          ? (kpi.value > 0 ? "text-orange-600 font-extrabold" : "text-muted-foreground")
          : "text-foreground";

        const isClickable = (kpi as any).clickable;
        return (
          <Card
            key={index}
            className={`transition-all duration-300 hover:scale-105 border-border/50 ${kpi.className} ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (!isClickable) return;
              if (kpi.title === "Still Review Pending" && onReviewPendingClick) onReviewPendingClick();
              if (kpi.title === "Total Registrations" && onTotalClick) onTotalClick();
              if (kpi.title === "Today's Follow-ups Due" && onTodayDueClick) onTodayDueClick();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
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
                <div className="flex flex-col items-end space-y-2">
                  <kpi.icon className="h-8 w-8 text-primary opacity-80" />
                  <span className="text-xs font-medium text-primary">
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};