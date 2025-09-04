import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Phone, Mail, Filter, X, Settings } from "lucide-react";
import { Customer } from "../WarrantyDashboard";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomerTableProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

type SortField = 'Timestamp' | 'Brand' | 'CustomerName' | 'PurchasedFrom' | 'WarrantyCardSent' | 'FeedbackReceived' | 'ExtendedWarrantySent' | 'NRY24' | 'FollowUpStatus' | 'FollowUpsDone';
type SortDirection = 'asc' | 'desc';

// Follow-up summary interface
interface FollowUpSummary {
  count: number;
  stages: number[];
  latest: string;
  nextDue: string;
}

// Column definitions with stable IDs and default visibility
const COLUMN_DEFS = [
  { id: 'warrantyId',        label: 'Warranty ID',            default: true, sortable: false },
  { id: 'timestamp',         label: 'Timestamp',              default: true, sortable: true },
  { id: 'brand',             label: 'Brand',                  default: true, sortable: true },
  { id: 'customer',          label: 'Customer',               default: true, sortable: true },
  { id: 'contact',           label: 'Contact',                default: true, sortable: false },
  { id: 'product',           label: 'Product',                default: true, sortable: false },
  { id: 'purchasedFrom',     label: 'Purchased From',         default: true, sortable: true },
  { id: 'warrantyCardSent',  label: 'Warranty Card Sent',     default: true, sortable: true },
  { id: 'feedbackReceived',  label: 'Feedback Received',      default: true, sortable: true },
  { id: 'extendedSent',      label: 'Extended Warranty Sent', default: true, sortable: true },
  { id: 'nry24',             label: '24h NRY',                default: false, sortable: true },
  { id: 'followUpStatus',    label: 'Follow-Up Status',       default: true, sortable: true },
  { id: 'followUpsDone',     label: 'Follow-ups Done',        default: true, sortable: true }
];

// Column filter interface
interface ColumnFilters {
  Brand: string;
  WarrantyCardSent: string;
  FeedbackReceived: string;
  ExtendedWarrantySent: string;
  FollowUpStatus: string;
  FollowUpsDone: string;
  DueToday: string;
}

// Column preferences interface
interface ColumnPrefs {
  visible: Record<string, boolean>;
  order: string[];
}

// Custom hook for column preferences
const useColumnPrefs = () => {
  const [columnPrefs, setColumnPrefs] = useState<ColumnPrefs>(() => {
    try {
      const stored = localStorage.getItem('wm.table.columns.v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with current defaults (in case new columns were added)
        const mergedVisible = { ...COLUMN_DEFS.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {}), ...parsed.visible };
        const mergedOrder = COLUMN_DEFS.map(col => col.id).filter(id => mergedVisible[id]);
        return { visible: mergedVisible, order: mergedOrder };
      }
    } catch (error) {
      console.warn('Failed to parse stored column preferences:', error);
    }
    
    // Default preferences
    return {
      visible: COLUMN_DEFS.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {}),
      order: COLUMN_DEFS.filter(col => col.default).map(col => col.id)
    };
  });

  const saveColumnPrefs = (prefs: ColumnPrefs) => {
    setColumnPrefs(prefs);
    try {
      localStorage.setItem('wm.table.columns.v1', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save column preferences:', error);
    }
  };

  const resetToDefaults = () => {
    const defaultPrefs = {
      visible: COLUMN_DEFS.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {}),
      order: COLUMN_DEFS.filter(col => col.default).map(col => col.id)
    };
    saveColumnPrefs(defaultPrefs);
  };

  const toggleColumn = (columnId: string, visible: boolean) => {
    const newVisible = { ...columnPrefs.visible, [columnId]: visible };
    const newOrder = visible 
      ? [...columnPrefs.order, columnId]
      : columnPrefs.order.filter(id => id !== columnId);
    saveColumnPrefs({ visible: newVisible, order: newOrder });
  };

  const reorderColumns = (newOrder: string[]) => {
    saveColumnPrefs({ ...columnPrefs, order: newOrder });
  };

  return {
    columnPrefs,
    toggleColumn,
    reorderColumns,
    resetToDefaults
  };
};

// Custom hook for follow-up summaries
const useFollowUpSummaries = () => {
  const [summaries, setSummaries] = useState<Record<string, FollowUpSummary>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchSummary = async (warrantyId: string) => {
    if (summaries[warrantyId] || loading[warrantyId]) return;
    setLoading(prev => ({ ...prev, [warrantyId]: true }));
    try {
      const { getFollowupSummary } = await import('@/lib/warrantyService');
      const summary = await getFollowupSummary(warrantyId);
      setSummaries(prev => ({ ...prev, [warrantyId]: summary as any }));
    } catch (error) {
      console.error('Failed to fetch follow-up summary:', error);
    } finally {
      setLoading(prev => ({ ...prev, [warrantyId]: false }));
    }
  };

  const refreshSummary = async (warrantyId: string) => {
    setSummaries(prev => {
      const { [warrantyId]: removed, ...rest } = prev;
      return rest;
    });
    await fetchSummary(warrantyId);
  };

  return { summaries, loading, fetchSummary, refreshSummary };
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

const FollowUpStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'Pending': { className: 'bg-amber-100 text-amber-800', label: 'Pending' },
    'Follow-up 1 Done': { className: 'bg-blue-100 text-blue-800', label: 'Follow-up 1 Done' },
    'Follow-up 2 Done': { className: 'bg-indigo-100 text-indigo-800', label: 'Follow-up 2 Done' },
    'Follow-up 3 Done': { className: 'bg-purple-100 text-purple-800', label: 'Follow-up 3 Done' },
    'Completed': { className: 'bg-green-100 text-green-800', label: 'Completed' },
  } as const;

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
  return <Badge className={config.className}>{config.label}</Badge>;
};

// New component to show due today indicator
const DueTodayBadge = ({ nextFollowUp, feedbackReceived }: { nextFollowUp: string; feedbackReceived: boolean }) => {
  if (feedbackReceived || !nextFollowUp) return null;
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextFollowUpDate = new Date(nextFollowUp);
  const nextFollowUpStart = new Date(nextFollowUpDate.getFullYear(), nextFollowUpDate.getMonth(), nextFollowUpDate.getDate());
  
  if (nextFollowUpStart.getTime() === todayStart.getTime()) {
    return <Badge className="bg-orange-100 text-orange-800 ml-2">Due Today</Badge>;
  }
  
  return null;
};

const FollowUpsDoneCell = ({ 
  customer, 
  summary, 
  loading 
}: { 
  customer: Customer; 
  summary?: FollowUpSummary; 
  loading: boolean;
}) => {
  if (loading) {
    return (
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div className="animate-pulse bg-muted h-4 w-8 rounded"></div>
      </td>
    );
  }

  if (customer.FeedbackReceived) {
    return (
      <td className="px-4 py-3 text-sm font-medium text-green-600">
        Completed
      </td>
    );
  }

  // Use the followupsDone field from backend response
  if (customer.FollowupsDone !== undefined) {
    return (
      <td className="px-4 py-3 text-sm text-foreground">
        {customer.FollowupsDone} of 3
      </td>
    );
  }

  // Fallback to summary if followupsDone is not available
  if (summary) {
    return (
      <td className="px-4 py-3 text-sm text-foreground">
        {summary.count} of 3
      </td>
    );
  }

  return (
    <td className="px-4 py-3 text-sm text-muted-foreground">
      -
    </td>
  );
};

// Column Chooser Modal Component
const ColumnChooserModal = ({ 
  isOpen, 
  onClose, 
  columnPrefs, 
  onToggleColumn, 
  onResetDefaults 
}: {
  isOpen: boolean;
  onClose: () => void;
  columnPrefs: ColumnPrefs;
  onToggleColumn: (columnId: string, visible: boolean) => void;
  onResetDefaults: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = COLUMN_DEFS.filter(col => 
    col.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleColumns = COLUMN_DEFS.filter(col => columnPrefs.visible[col.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Available Columns */}
          <div>
            <h3 className="font-medium mb-3">Available Columns</h3>
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredColumns.map((col) => (
                <div key={col.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${col.id}`}
                    checked={columnPrefs.visible[col.id]}
                    onCheckedChange={(checked) => onToggleColumn(col.id, checked as boolean)}
                  />
                  <Label htmlFor={`col-${col.id}`} className="text-sm">
                    {col.label}
                    {col.sortable && <span className="text-muted-foreground ml-1">(sortable)</span>}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Columns */}
          <div>
            <h3 className="font-medium mb-3">Selected Columns ({visibleColumns.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {visibleColumns.map((col) => (
                <div key={col.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                  <span className="text-sm">{col.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleColumn(col.id, false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {visibleColumns.length === 0 && (
                <p className="text-muted-foreground text-sm">No columns selected</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onResetDefaults}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CustomerTable = ({ customers, onCustomerClick }: CustomerTableProps) => {
  const [sortField, setSortField] = useState<SortField>('Timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnChooser, setShowColumnChooser] = useState(false);

  // Pagination — 50 rows per page by default
  const PAGE_SIZE = 50;
  const [page, setPage] = useState<number>(1);

  // Column preferences
  const { columnPrefs, toggleColumn, resetToDefaults } = useColumnPrefs();

  // Follow-up summaries
  const { summaries, loading, fetchSummary, refreshSummary } = useFollowUpSummaries();

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    Brand: 'All',
    WarrantyCardSent: 'All',
    FeedbackReceived: 'All',
    ExtendedWarrantySent: 'All',
    FollowUpStatus: 'All',
    FollowUpsDone: 'All',
    DueToday: 'All',
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset to page 1 when list length changes (e.g., filters)
  React.useEffect(() => { setPage(1); }, [customers.length]);

  // Fetch follow-up summaries for visible customers
  React.useEffect(() => {
    const visibleCustomers = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    visibleCustomers.forEach(customer => {
      if (!customer.FeedbackReceived) {
        fetchSummary(customer.WarrantyID);
      }
    });
  }, [customers, page, fetchSummary]);

  // Apply column filters
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      if (columnFilters.Brand !== 'All' && customer.Brand !== columnFilters.Brand) return false;
      if (columnFilters.WarrantyCardSent !== 'All') {
        const expected = columnFilters.WarrantyCardSent === 'Yes';
        if (Boolean(customer.WarrantyCardSent) !== expected) return false;
      }
      if (columnFilters.FeedbackReceived !== 'All') {
        const expected = columnFilters.FeedbackReceived === 'Yes';
        if (Boolean(customer.FeedbackReceived) !== expected) return false;
      }
      if (columnFilters.ExtendedWarrantySent !== 'All') {
        const expected = columnFilters.ExtendedWarrantySent === 'Yes';
        if (Boolean(customer.ExtendedWarrantySent) !== expected) return false;
      }
      if (columnFilters.FollowUpStatus !== 'All' && customer.FollowUpStatus !== columnFilters.FollowUpStatus) return false;
      
      // Filter by Follow-ups Done
      if (columnFilters.FollowUpsDone !== 'All') {
        if (customer.FeedbackReceived) {
          if (columnFilters.FollowUpsDone !== 'Completed') return false;
        } else {
          const count = customer.FollowupsDone ?? summaries[customer.WarrantyID]?.count ?? 0;
          if (columnFilters.FollowUpsDone === '0' && count !== 0) return false;
          if (columnFilters.FollowUpsDone === '1' && count !== 1) return false;
          if (columnFilters.FollowUpsDone === '2' && count !== 2) return false;
          if (columnFilters.FollowUpsDone === '3' && count !== 3) return false;
        }
      }
      
      return true;
    });
  }, [customers, columnFilters, summaries]);

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'Timestamp') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle FollowUpsDone sorting
    if (sortField === 'FollowUpsDone') {
      if (a.FeedbackReceived && b.FeedbackReceived) return 0;
      if (a.FeedbackReceived) return 1;
      if (b.FeedbackReceived) return -1;
      
      const aCount = a.FollowupsDone ?? summaries[a.WarrantyID]?.count ?? 0;
      const bCount = b.FollowupsDone ?? summaries[b.WarrantyID]?.count ?? 0;
      
      if (aCount !== bCount) return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
      return 0;
    }

    // Normalize booleans for comparison
    if (typeof aValue === 'boolean') aValue = aValue ? 1 : 0;
    if (typeof bValue === 'boolean') bValue = bValue ? 1 : 0;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate after sorting so the order is preserved across pages
  const totalItems = sortedCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const pageItems = sortedCustomers.slice(startIndex, endIndex);

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

  const clearFilters = () => {
    setColumnFilters({
      Brand: 'All',
      WarrantyCardSent: 'All',
      FeedbackReceived: 'All',
      ExtendedWarrantySent: 'All',
      FollowUpStatus: 'All',
      FollowUpsDone: 'All',
      DueToday: 'All',
    });
  };

  // Render table cell based on column ID
  const renderTableCell = (customer: Customer, columnId: string) => {
    switch (columnId) {
      case 'warrantyId':
        return (
          <td className="px-4 py-3 text-sm font-semibold text-foreground">
            {customer.WarrantyID}
          </td>
        );
      case 'timestamp':
        return (
          <td className="px-4 py-3 text-sm text-foreground">
            {new Date(customer.Timestamp).toLocaleString()}
          </td>
        );
      case 'brand':
        return (
          <td className="px-4 py-3">
            <BrandBadge brand={customer.Brand} />
          </td>
        );
      case 'customer':
        return (
          <td className="px-4 py-3 text-sm font-medium text-foreground">
            {customer.CustomerName}
          </td>
        );
      case 'contact':
        return (
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
        );
      case 'product':
        return (
          <td className="px-4 py-3 text-sm text-foreground">{customer.Product}</td>
        );
      case 'purchasedFrom':
        return (
          <td className="px-4 py-3 text-sm text-foreground">{customer.PurchasedFrom || '-'}</td>
        );
      case 'warrantyCardSent':
        return (
          <td className="px-4 py-3 text-sm text-foreground">
            {(() => {
              const v: any = customer.WarrantyCardSent;
              const asString = typeof v === 'string' ? v.trim() : '';
              const isTrue = v === true || asString.toUpperCase() === 'TRUE' || asString.includes('✅') || asString.includes('✔');
              return isTrue ? (
                <span className="text-emerald-600" role="img" aria-label="yes">✅</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              );
            })()}
          </td>
        );
      case 'feedbackReceived':
        return (
          <td className="px-4 py-3 text-sm text-foreground">
            {customer.FeedbackReceived ? (
              <span className="text-emerald-600" role="img" aria-label="yes">✅</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </td>
        );
      case 'extendedSent':
        return (
          <td className="px-4 py-3 text-sm text-foreground">
            {customer.ExtendedWarrantySent ? (
              <span className="text-emerald-600" role="img" aria-label="yes">✅</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </td>
        );
      case 'nry24':
        return (
          <td className="px-4 py-3 text-sm text-foreground">
            {customer.NRY24 ? (
              <Badge className={customer.NRY24 === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {customer.NRY24}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </td>
        );
      case 'followUpStatus':
        return (
          <td className="px-4 py-3">
            <FollowUpStatusBadge status={customer.FollowUpStatus || 'Pending'} />
            <DueTodayBadge 
              nextFollowUp={summaries[customer.WarrantyID]?.nextDue} 
              feedbackReceived={customer.FeedbackReceived} 
            />
          </td>
        );
      case 'followUpsDone':
        return (
          <FollowUpsDoneCell 
            customer={customer}
            summary={summaries[customer.WarrantyID]}
            loading={loading[customer.WarrantyID]}
          />
        );
      default:
        return null;
    }
  };

  // Render table header based on column ID
  const renderTableHeader = (columnId: string) => {
    const colDef = COLUMN_DEFS.find(col => col.id === columnId);
    if (!colDef) return null;

    if (colDef.sortable) {
      const sortFieldMap: Record<string, SortField> = {
        'timestamp': 'Timestamp',
        'brand': 'Brand',
        'customer': 'CustomerName',
        'purchasedFrom': 'PurchasedFrom',
        'warrantyCardSent': 'WarrantyCardSent',
        'feedbackReceived': 'FeedbackReceived',
        'extendedSent': 'ExtendedWarrantySent',
        'nry24': 'NRY24',
        'followUpStatus': 'FollowUpStatus',
        'followUpsDone': 'FollowUpsDone'
      };
      
      return (
        <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
          <SortButton field={sortFieldMap[columnId] as SortField}>{colDef.label}</SortButton>
        </th>
      );
    }

    return (
      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
        {colDef.label}
      </th>
    );
  };

  return (
    <>
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">Customer Registrations</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnChooser(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize Columns
              </Button>
              {Object.values(columnFilters).some(v => v !== 'All') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Column Filters */}
        {showFilters && (
          <div className="px-6 pb-4 border-b border-border">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Brand</label>
                <Select value={columnFilters.Brand} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, Brand: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Brands</SelectItem>
                    <SelectItem value="Baybee">Baybee</SelectItem>
                    <SelectItem value="Drogo">Drogo</SelectItem>
                    <SelectItem value="Domestica">Domestica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Warranty Card Sent</label>
                <Select value={columnFilters.WarrantyCardSent} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, WarrantyCardSent: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Feedback Received</label>
                <Select value={columnFilters.FeedbackReceived} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, FeedbackReceived: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Extended Warranty Sent</label>
                <Select value={columnFilters.ExtendedWarrantySent} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, ExtendedWarrantySent: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Follow-Up Status</label>
                <Select value={columnFilters.FollowUpStatus} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, FollowUpStatus: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Follow-up 1 Done">Follow-up 1 Done</SelectItem>
                    <SelectItem value="Follow-up 2 Done">Follow-up 2 Done</SelectItem>
                    <SelectItem value="Follow-up 3 Done">Follow-up 3 Done</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Follow-ups Done</label>
                <Select value={columnFilters.FollowUpsDone} onValueChange={(value) => setColumnFilters(prev => ({ ...prev, FollowUpsDone: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {columnPrefs.order.map(columnId => (
                      <React.Fragment key={columnId}>
                        {renderTableHeader(columnId)}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((customer, index) => (
                    <tr 
                      key={customer.WarrantyID}
                      className={`hover:bg-accent/30 cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}
                      onClick={() => onCustomerClick(customer)}
                    >
                      {columnPrefs.order.map(columnId => (
                        <React.Fragment key={columnId}>
                          {renderTableCell(customer, columnId)}
                        </React.Fragment>
                      ))}
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

      {/* Pagination Controls */}
      {totalItems > PAGE_SIZE && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(Math.max(1, currentPage - 1)); }} />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink href="#" isActive={currentPage === 1} onClick={(e) => { e.preventDefault(); setPage(1); }}>1</PaginationLink>
            </PaginationItem>

            {currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {currentPage > 2 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(currentPage - 1); }}>{currentPage - 1}</PaginationLink>
              </PaginationItem>
            )}

            {currentPage !== 1 && currentPage !== totalPages && (
              <PaginationItem>
                <PaginationLink href="#" isActive>{currentPage}</PaginationLink>
              </PaginationItem>
            )}

            {currentPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(currentPage + 1); }}>{currentPage + 1}</PaginationLink>
              </PaginationItem>
            )}

            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {totalPages > 1 && (
              <PaginationItem>
                <PaginationLink href="#" isActive={currentPage === totalPages} onClick={(e) => { e.preventDefault(); setPage(totalPages); }}>{totalPages}</PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, currentPage + 1)); }} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Column Chooser Modal */}
      <ColumnChooserModal
        isOpen={showColumnChooser}
        onClose={() => setShowColumnChooser(false)}
        columnPrefs={columnPrefs}
        onToggleColumn={toggleColumn}
        onResetDefaults={resetToDefaults}
      />
    </>
  );
};
