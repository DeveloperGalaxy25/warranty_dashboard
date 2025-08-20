import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Phone, Mail } from "lucide-react";
import { Customer } from "../WarrantyDashboard";

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

type SortField = 'timestamp' | 'brand' | 'customerName' | 'status';
type SortDirection = 'asc' | 'desc';

const StatusBadge = ({ status }: { status: Customer['status'] }) => {
  const statusConfig = {
    'New': { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    'Card Sent': { variant: 'secondary', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
    'In Outreach': { variant: 'outline', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    'Review Won': { variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
    'Escalated': { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
    'Closed': { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
  } as const;

  const config = statusConfig[status];
  return (
    <Badge className={config.className}>
      {status}
    </Badge>
  );
};

const BrandBadge = ({ brand }: { brand: Customer['brand'] }) => {
  const brandColors = {
    'Baybee': 'bg-pink-100 text-pink-800',
    'Drogo': 'bg-purple-100 text-purple-800',
    'Domestica': 'bg-indigo-100 text-indigo-800',
  };

  return (
    <Badge className={brandColors[brand]}>
      {brand}
    </Badge>
  );
};

export const CustomerTable = ({ customers, onCustomerClick }: CustomerTableProps) => {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold text-foreground hover:text-primary"
    >
      <span className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </Button>
  );

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Customer Registrations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Warranty ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    <SortButton field="timestamp">Timestamp</SortButton>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    <SortButton field="brand">Brand</SortButton>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    <SortButton field="customerName">Customer</SortButton>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    <SortButton field="status">Status</SortButton>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Last Remark
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Next Follow-Up
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedCustomers.map((customer, index) => (
                  <tr 
                    key={customer.warrantyId}
                    className={`hover:bg-accent/30 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                    onClick={() => onCustomerClick(customer)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      {customer.warrantyId}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(customer.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <BrandBadge brand={customer.brand} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {customer.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.product}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {customer.lastRemark}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {customer.nextFollowUp 
                        ? new Date(customer.nextFollowUp).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCustomerClick(customer);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {customers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No registrations found in the selected range.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};