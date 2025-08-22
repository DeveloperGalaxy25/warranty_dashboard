import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, Phone, Mail, Send } from "lucide-react";
import { Customer } from "../WarrantyDashboard";
import { WarrantyCardEmailModal } from "./WarrantyCardEmailModal";

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

type SortField = 'Timestamp' | 'Brand' | 'CustomerName' | 'Status' | 'PurchasedFrom';
type SortDirection = 'asc' | 'desc';

const StatusBadge = ({ status }: { status: Customer['Status'] }) => {
  const statusConfig = {
    'New': { className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    'Card Sent': { className: 'bg-green-100 text-green-800 hover:bg-green-200' },
    'In Outreach': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    'Review Won': { className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
    'Escalated': { className: 'bg-red-100 text-red-800 hover:bg-red-200' },
    'Closed': { className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
  } as const;

  if (!status) return <span className="text-muted-foreground">-</span>;
  const config = statusConfig[status];
  return <Badge className={config?.className}>{status}</Badge>;
};

const BrandBadge = ({ brand }: { brand: Customer['Brand'] }) => {
  const brandColors = {
    'Baybee': 'bg-pink-100 text-pink-800',
    'Drogo': 'bg-purple-100 text-purple-800',
    'Domestica': 'bg-indigo-100 text-indigo-800',
  };

  return (
    <Badge className={brandColors[brand] || "bg-gray-100 text-gray-800"}>
      {brand}
    </Badge>
  );
};

export const CustomerTable = ({ customers, onCustomerClick }: CustomerTableProps) => {
  const [sortField, setSortField] = useState<SortField>('Timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedCustomerForEmail, setSelectedCustomerForEmail] = useState<Customer | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEmailClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setSelectedCustomerForEmail(customer);
    setEmailModalOpen(true);
  };

  const handleEmailSent = () => {
    // Refresh data or update status
    setEmailModalOpen(false);
    setSelectedCustomerForEmail(null);
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'Timestamp') {
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
    <>
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Warranty ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      <SortButton field="Timestamp">Timestamp</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      <SortButton field="Brand">Brand</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      <SortButton field="CustomerName">Customer</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      <SortButton field="PurchasedFrom">Purchased From</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      <SortButton field="Status">Status</SortButton>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Last Remark
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Next Follow-Up
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedCustomers.map((customer, index) => (
                    <tr 
                      key={customer.WarrantyID}
                      className={`hover:bg-accent/30 cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}
                      onClick={() => onCustomerClick(customer)}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">
                        {customer.WarrantyID}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {new Date(customer.Timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <BrandBadge brand={customer.Brand} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {customer.CustomerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.Email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{customer.Mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{customer.Product}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{customer.PurchasedFrom || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={customer.Status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {customer.LastRemark}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {customer.NextFollowUp 
                          ? new Date(customer.NextFollowUp).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomerClick(customer);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEmailClick(e, customer)}
                            title="Send Warranty Card Email"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Email Modal */}
      {selectedCustomerForEmail && (
        <WarrantyCardEmailModal
          customer={selectedCustomerForEmail}
          isOpen={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false);
            setSelectedCustomerForEmail(null);
          }}
          onEmailSent={handleEmailSent}
        />
      )}
    </>
  );
};
