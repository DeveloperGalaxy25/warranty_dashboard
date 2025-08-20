import { useState } from "react";
import { Calendar, Search, Download, Send, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICards } from "./dashboard/KPICards";
import { CustomerTable } from "./dashboard/CustomerTable";
import { StatusUpdateModal } from "./dashboard/StatusUpdateModal";
import { DateRangePicker } from "./dashboard/DateRangePicker";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  warrantyId: string;
  timestamp: string;
  brand: "Baybee" | "Drogo" | "Domestica";
  customerName: string;
  email: string;
  phone: string;
  product: string;
  status: "New" | "Card Sent" | "In Outreach" | "Review Won" | "Escalated" | "Closed";
  lastRemark: string;
  nextFollowUp: string | null;
  assignedAgent: string;
  warrantyCardUrl: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Mock data for demo
const generateMockData = (): Customer[] => {
  const brands = ["Baybee", "Drogo", "Domestica"] as const;
  const statuses = ["New", "Card Sent", "In Outreach", "Review Won", "Escalated", "Closed"] as const;
  const agents = ["Sarah Chen", "Mike Rodriguez", "Emma Watson", "David Kim"];
  const products = ["Baby Stroller XL", "Pet Carrier Pro", "Kitchen Blender", "Smart Vacuum", "Wireless Headphones"];
  
  return Array.from({ length: 50 }, (_, i) => ({
    warrantyId: `WTY-${String(i + 1).padStart(4, '0')}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    brand: brands[Math.floor(Math.random() * brands.length)],
    customerName: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    product: products[Math.floor(Math.random() * products.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastRemark: `Last interaction on ${new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
    nextFollowUp: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
    assignedAgent: agents[Math.floor(Math.random() * agents.length)],
    warrantyCardUrl: `https://example.com/warranty/${i + 1}.pdf`
  }));
};

export const WarrantyDashboard = () => {
  const [customers] = useState<Customer[]>(generateMockData());
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Filter customers based on current filters
  const filteredCustomers = customers.filter(customer => {
    const matchesBrand = selectedBrand === "all" || customer.brand === selectedBrand;
    const customerDate = new Date(customer.timestamp);
    const matchesDateRange = customerDate >= dateRange.from && customerDate <= dateRange.to;
    const matchesSearch = searchQuery === "" || 
      customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.warrantyId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBrand && matchesDateRange && matchesSearch;
  });

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleStatusUpdate = (updatedCustomer: Customer) => {
    // In a real app, this would update the backend
    setSelectedCustomer(null);
    toast({
      title: "Status Updated",
      description: `Customer ${updatedCustomer.warrantyId} has been updated successfully.`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your CSV export is being prepared and will download shortly.",
    });
  };

  const handleSendReport = () => {
    toast({
      title: "Report Sent",
      description: "The 7-day summary report has been sent to the support manager.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo/Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Warranty Dashboard</h1>
            </div>

            {/* Center: Brand Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="all">All Brands</SelectItem>
                    <SelectItem value="Baybee">Baybee</SelectItem>
                    <SelectItem value="Drogo">Drogo</SelectItem>
                    <SelectItem value="Domestica">Domestica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: Date Range, Search, Actions */}
            <div className="flex items-center space-x-4">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSendReport}
                className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <Send className="h-4 w-4" />
                <span>Send 7-Day Report</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <KPICards customers={filteredCustomers} />

        {/* Customer Table */}
        <CustomerTable 
          customers={filteredCustomers} 
          onCustomerClick={handleCustomerClick}
        />
      </main>

      {/* Status Update Modal */}
      {selectedCustomer && (
        <StatusUpdateModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};