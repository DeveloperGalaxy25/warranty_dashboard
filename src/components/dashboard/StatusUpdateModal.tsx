import { useEffect, useState } from "react";
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
import { WarrantyRecord } from "@/hooks/useWarrantyData";
import { updateWarrantyStatus } from "@/lib/warrantyService";

interface Props {
  customer: WarrantyRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const StatusUpdateModal = ({ customer, isOpen, onClose, onUpdate }: Props) => {
  const [status, setStatus] = useState(customer.status);
  const [remark, setRemark] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const warrantyId = customer.warrantyId || customer.id;
      await updateWarrantyStatus(warrantyId, {
        status,
        lastRemark: remark || customer.lastRemark,
        nextFollowUp: nextFollowUp || customer.nextFollowUp,
        assignedAgent: customer.assignedAgent,
      }, "Agent1"); // TODO: replace with actual logged-in agent
      onUpdate();
      onClose();
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(`Failed to update warranty: ${err?.message || err}`);
      console.error("Update error", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Update Warranty – {customer.warrantyId}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>{customer.customerName}</strong> ({customer.brand})</p>
              <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /> {customer.email}</p>
              <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> {customer.phone}</p>
              <p className="flex items-center"><Package className="h-4 w-4 mr-2" /> {customer.product}</p>
              <p>Purchased From: {(customer as any).purchasedFrom || '-'}</p>
              <p className="flex items-center"><User className="h-4 w-4 mr-2" /> {customer.assignedAgent}</p>
              <Button variant="outline" className="mt-3 w-full" onClick={() => window.open(customer.warrantyCardUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" /> View Warranty Card
              </Button>
            </CardContent>
          </Card>

          {/* Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
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
                <Label>Remark</Label>
                <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Add remark..." />
              </div>

              <div>
                <Label>Next Follow-Up</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
