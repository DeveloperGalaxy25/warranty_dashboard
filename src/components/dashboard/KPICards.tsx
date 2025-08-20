import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Send, Clock } from "lucide-react";
import { Customer } from "../WarrantyDashboard";

interface KPICardsProps {
  customers: Customer[];
}

export const KPICards = ({ customers }: KPICardsProps) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const totalRegistrations = customers.length;
  const registrationsToday = customers.filter(
    customer => new Date(customer.timestamp) >= todayStart
  ).length;
  const warrantyCardsSent = customers.filter(
    customer => customer.status === "Card Sent" || 
                customer.status === "In Outreach" || 
                customer.status === "Review Won" || 
                customer.status === "Closed"
  ).length;
  const pendingFirstContact = customers.filter(
    customer => customer.status === "New"
  ).length;

  const kpis = [
    {
      title: "Total Registrations",
      value: totalRegistrations,
      description: "in selected range",
      icon: Users,
      trend: "+12%",
      className: "bg-gradient-to-br from-card to-accent/20 hover:shadow-lg"
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
      title: "Pending (No First Contact)",
      value: pendingFirstContact,
      description: "awaiting contact",
      icon: Clock,
      trend: "-3",
      className: "bg-gradient-to-br from-card to-warning/20 hover:shadow-lg"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <Card 
          key={index} 
          className={`transition-all duration-300 hover:scale-105 border-border/50 ${kpi.className}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-muted-foreground text-sm font-medium">
                  {kpi.title}
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-foreground mt-2">
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
      ))}
    </div>
  );
};