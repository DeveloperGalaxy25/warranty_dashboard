import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, User, Phone, Mail, Package } from "lucide-react";
import { Customer } from "../WarrantyDashboard";

interface StatusUpdateModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (customer: Customer) => void;
}

const mockInteractions = [
  {
    date: "2024-01-15",
    agent: "Sarah Chen",
    channel: "Email",
    remark: "Sent warranty card via email. Customer confirmed receipt."
  },
  {
    date: "2024-01-10",
    agent: "Mike Rodriguez", 
    channel: "Phone",
    remark: "Initial outreach call. Left voicemail requesting callback."
  },
  {
    date: "2024-01-08",
    agent: "System",
    channel: "Auto",
    remark: "Registration received from Google Forms submission."
  }
];

export const StatusUpdateModal = ({ customer, isOpen, onClose, onUpdate }: StatusUpdateModalProps) => {
  const [status, setStatus] = useState(customer.status);
  const [outcome, setOutcome] = useState("");
  const [remark, setRemark] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const handleSave = () => {
    const updatedCustomer = {
      ...customer,
      status: status as Customer['status'],
      lastRemark: remark || customer.lastRemark,
      nextFollowUp: nextFollowUp || customer.nextFollowUp
    };
    onUpdate(updatedCustomer);
  };

  const StatusBadge = ({ status }: { status: Customer['status'] }) => {
    const statusConfig = {
      'New': 'bg-blue-100 text-blue-800',
      'Card Sent': 'bg-green-100 text-green-800',
      'In Outreach': 'bg-yellow-100 text-yellow-800',
      'Review Won': 'bg-emerald-100 text-emerald-800',
      'Escalated': 'bg-red-100 text-red-800',
      'Closed': 'bg-gray-100 text-gray-800',
    } as const;

    return (
      <Badge className={statusConfig[status]}>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Customer Details – {customer.warrantyId}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Panel: Customer Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="text-sm font-semibold">{customer.customerName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Brand</Label>
                <div className="mt-1">
                  <BrandBadge brand={customer.brand} />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{customer.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                  <p className="text-sm">{customer.product}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assigned Agent</Label>
                  <p className="text-sm">{customer.assignedAgent}</p>
                </div>
              </div>

              <Separator />
              
              <Button 
                variant="outline" 
                className="w-full flex items-center space-x-2"
                onClick={() => window.open(customer.warrantyCardUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                <span>View Warranty Card</span>
              </Button>
            </CardContent>
          </Card>

          {/* Middle Panel: Interaction Timeline */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Interaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInteractions.map((interaction, index) => (
                  <div key={index} className="border-l-2 border-primary/20 pl-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{interaction.date}</span>
                      <Badge variant="outline" className="text-xs">
                        {interaction.channel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      by {interaction.agent}
                    </p>
                    <p className="text-sm">{interaction.remark}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Update Status Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                <div className="mt-1">
                  <StatusBadge status={customer.status} />
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Customer['status'])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Card Sent">Card Sent</SelectItem>
                    <SelectItem value="In Outreach">In Outreach</SelectItem>
                    <SelectItem value="Review Won">Review Won</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="outcome" className="text-sm font-medium">Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="No Answer">No Answer</SelectItem>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Review Posted">Review Posted</SelectItem>
                    <SelectItem value="Issue Raised">Issue Raised</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                    <SelectItem value="Refund">Refund</SelectItem>
                    <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="remark" className="text-sm font-medium">Remark</Label>
                <Textarea
                  id="remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add your remark here..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="next-follow-up" className="text-sm font-medium">Next Follow-Up</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="next-follow-up"
                    type="date"
                    value={nextFollowUp}
                    onChange={(e) => setNextFollowUp(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};