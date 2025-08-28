import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { WarrantyRecord } from "@/hooks/useWarrantyData";
import { markReviewDone, logFollowUpAction, getWorkflowHistory } from "@/lib/warrantyService";
import { cn } from "@/lib/utils";

interface StatusUpdateModalProps {
  customer: WarrantyRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Follow-up summary interface
interface FollowUpSummary {
  count: number;
  stages: number[];
  latest: string | null;
  nextDue: string | null;
}

// Follow-up data interface
interface FollowUpData {
  followUp1Done: boolean;
  followUp1Date: string;
  followUp1Remark: string;
  followUp2Done: boolean;
  followUp2Date: string;
  followUp2Remark: string;
  followUp3Done: boolean;
  followUp3Date: string;
  followUp3Remark: string;
  nextFollowUpDue: string;
}

// Follow-up history interface
interface FollowUpHistory {
  warrantyId: string;
  status: string;
  remark: string;
  followUpDate: string;
  assignedTo: string;
  updatedBy: string;
  timestamp: string;
}

export const StatusUpdateModal = ({ customer, isOpen, onClose, onUpdate }: StatusUpdateModalProps) => {
  const [reviewDone, setReviewDone] = useState<boolean>(false);
  const [remark, setRemark] = useState("");
  const [followUpData, setFollowUpData] = useState<FollowUpData>({
    followUp1Done: false,
    followUp1Date: "",
    followUp1Remark: "",
    followUp2Done: false,
    followUp2Date: "",
    followUp2Remark: "",
    followUp3Done: false,
    followUp3Date: "",
    followUp3Remark: "",
    nextFollowUpDue: ""
  });
  const [loading, setLoading] = useState(false);
  const [followUpSummary, setFollowUpSummary] = useState<FollowUpSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isReviewCompleted = Boolean(customer?.status === "Review Won" || customer?.status === "Closed" || customer?.status === "Completed");

  const addDays = (iso: string, n: number): string => {
    // Parse yyyy-MM-dd in local time to avoid TZ shifts
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
    dt.setDate(dt.getDate() + n);
    return format(dt, 'yyyy-MM-dd');
  };

  // Load follow-up history when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      loadFollowUpHistory();
      // Prefill basic: if we ever store summary server-side, fetch it here
      setFollowUpSummary((prev) => prev || { count: 0, stages: [], latest: null, nextDue: null });
    }
  }, [isOpen, customer]);

  const loadFollowUpHistory = async () => {
    if (!customer.warrantyId) return;
    
    setHistoryLoading(true);
    try {
      const history = await getWorkflowHistory(customer.warrantyId);
      setFollowUpHistory(history || []);
    } catch (error) {
      console.error('Failed to load follow-up history:', error);
      setFollowUpHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (followUpData.followUp1Date && !followUpData.followUp2Date) {
      setFollowUpData(prev => ({ ...prev, followUp2Date: addDays(prev.followUp1Date, 3) }));
    }
  }, [followUpData.followUp1Date]);

  useEffect(() => {
    if (followUpData.followUp2Date && !followUpData.followUp3Date) {
      setFollowUpData(prev => ({ ...prev, followUp3Date: addDays(prev.followUp2Date, 3) }));
    }
  }, [followUpData.followUp2Date]);

  const handleSave = async () => {
    try {
      setLoading(true);
      if (reviewDone) {
        await markReviewDone(customer.warrantyId, remark);
        setFollowUpSummary({ count: 3, stages: [1,2,3], latest: new Date().toISOString().slice(0,10), nextDue: null });
      } else {
        const ops: Promise<any>[] = [];
        if (followUpData.followUp1Done && !followUpSummary?.stages.includes(1)) {
          if (!followUpData.followUp1Date) throw new Error("Select Follow-up 1 date");
          ops.push(logFollowUpAction(
            customer.warrantyId,
            customer.customerName,
            customer.brand,
            1,
            followUpData.followUp1Date,
            followUpData.followUp2Date || null,
            "Follow-up 1 Done",
            followUpData.followUp1Remark || ""
          ));
        }
        if (followUpData.followUp2Done && !followUpSummary?.stages.includes(2)) {
          ops.push(logFollowUpAction(
            customer.warrantyId,
            customer.customerName,
            customer.brand,
            2,
            followUpData.followUp2Date || new Date().toISOString().slice(0,10),
            followUpData.followUp3Date || null,
            "Follow-up 2 Done",
            followUpData.followUp2Remark || ""
          ));
        }
        if (followUpData.followUp3Done && !followUpSummary?.stages.includes(3)) {
          ops.push(logFollowUpAction(
            customer.warrantyId,
            customer.customerName,
            customer.brand,
            3,
            followUpData.followUp3Date || new Date().toISOString().slice(0,10),
            null,
            "Follow-up 3 Done",
            followUpData.followUp3Remark || ""
          ));
        }
        if (ops.length === 0 && !followUpData.followUp1Remark && !followUpData.followUp2Remark && !followUpData.followUp3Remark) {
          throw new Error("No changes to save");
        }
        if (ops.length === 0 && (followUpData.followUp1Remark || followUpData.followUp2Remark || followUpData.followUp3Remark)) {
          const nextNo = (followUpSummary?.count || 0) + 1;
          const remark = followUpData.followUp1Remark || followUpData.followUp2Remark || followUpData.followUp3Remark;
          ops.push(logFollowUpAction(
            customer.warrantyId,
            customer.customerName,
            customer.brand,
            nextNo,
            new Date().toISOString().slice(0,10),
            followUpData.nextFollowUpDue || null,
            "Follow-up Note",
            remark
          ));
        }
        await Promise.all(ops);
      }
      onUpdate();
      onClose();
      // @ts-ignore
      if (window?.toast) window.toast.success("Update saved successfully"); else alert("Update saved successfully");
    } catch (e) {
      alert(`Failed to save: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpToggle = (n: 1|2|3, checked: boolean) => {
    const map: Record<number, keyof FollowUpData> = {1: "followUp1Done", 2: "followUp2Done", 3: "followUp3Done"};
    setFollowUpData(prev => ({ ...prev, [map[n]]: checked } as FollowUpData));
  };

  const handleDateChange = (n: 1|2|3, date?: Date) => {
    if (!date) return;
    // Format in local time to yyyy-MM-dd (prevents off-by-one)
    const iso = format(date, 'yyyy-MM-dd');
    if (n === 1) setFollowUpData(prev => ({ ...prev, followUp1Date: iso }));
    if (n === 2) setFollowUpData(prev => ({ ...prev, followUp2Date: iso }));
    if (n === 3) setFollowUpData(prev => ({ ...prev, followUp3Date: iso }));
  };

  const handleRemarkChange = (n: 1|2|3, value: string) => {
    const map: Record<number, keyof FollowUpData> = {1: "followUp1Remark", 2: "followUp2Remark", 3: "followUp3Remark"};
    setFollowUpData(prev => ({ ...prev, [map[n]]: value } as FollowUpData));
  };

  const hasChanges = () => reviewDone || followUpData.followUp1Done || followUpData.followUp2Done || followUpData.followUp3Done || 
    Boolean(followUpData.followUp1Remark) || Boolean(followUpData.followUp2Remark) || Boolean(followUpData.followUp3Remark);

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'Follow-up 1 Done': 'Follow-up 1 Completed',
      'Follow-up 2 Done': 'Follow-up 2 Completed', 
      'Follow-up 3 Done': 'Follow-up 3 Completed',
      'Review Done': 'Review Completed',
      'Follow-up Note': 'Note Added'
    };
    return statusMap[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Update Status - {customer.customerName}
          </DialogTitle>
        </DialogHeader>

        {/* Customer Information */}
        <div className="p-4 border rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-sm text-muted-foreground">Customer</span>
            <p className="font-medium">{customer.customerName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Email</span>
            <p className="font-medium break-all">{customer.email || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Phone</span>
            <p className="font-medium">{customer.phone || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Product</span>
            <p className="font-medium">{customer.product || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Purchased From</span>
            <p className="font-medium">{customer.purchasedFrom || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Warranty ID</span>
            <p className="font-medium">{customer.warrantyId}</p>
          </div>
        </div>

        <div className="space-y-6 mt-4">
          {/* Review Done Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium">Review Status</h3>
            
            <div className="flex items-center space-x-3">
              <input
                id="reviewDone"
                type="checkbox"
                checked={reviewDone}
                onChange={(e) => setReviewDone(e.target.checked)}
                disabled={isReviewCompleted}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <Label htmlFor="reviewDone" className="font-semibold">
                Review Done
              </Label>
              {(isReviewCompleted || reviewDone) && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Completed</span>
              )}
            </div>

            <div>
              <Label htmlFor="reviewRemark" className="text-sm font-medium">
                Review Remarks
              </Label>
              <Textarea
                id="reviewRemark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add review remarks..."
                disabled={isReviewCompleted}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Follow-up Tracking Section */}
          {!(isReviewCompleted || reviewDone) && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Follow-up Tracking</h3>

              {/* F1 */}
              <div className="space-y-3 p-3 border rounded">
                <div className="flex items-center gap-3">
                  <input
                    id="f1"
                    type="checkbox"
                    checked={followUpData.followUp1Done}
                    onChange={(e) => handleFollowUpToggle(1, e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f1">Follow-up 1 Done</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-[200px] justify-start", !followUpData.followUp1Date && "text-muted-foreground")}
                        disabled={!followUpData.followUp1Done}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpData.followUp1Date ? format(new Date(followUpData.followUp1Date), 'PPP') : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={followUpData.followUp1Date ? new Date(followUpData.followUp1Date) : undefined}
                        onSelect={(date) => {
                          console.log('Date selected for F1:', date);
                          handleDateChange(1, date);
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="f1Remark" className="text-sm font-medium">F1 Remark</Label>
                  <input
                    id="f1Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1"
                    placeholder="F1 Remark"
                    value={followUpData.followUp1Remark}
                    onChange={(e) => handleRemarkChange(1, e.target.value)}
                  />
                </div>
              </div>

              {/* F2 */}
              <div className="space-y-3 p-3 border rounded">
                <div className="flex items-center gap-3">
                  <input
                    id="f2"
                    type="checkbox"
                    checked={followUpData.followUp2Done}
                    onChange={(e) => handleFollowUpToggle(2, e.target.checked)}
                    disabled={!followUpData.followUp1Done}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f2">Follow-up 2 Done</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn("w-[200px] justify-start", !followUpData.followUp2Date && "text-muted-foreground")}
                        disabled={!followUpData.followUp1Done}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpData.followUp2Date ? format(new Date(followUpData.followUp2Date), 'PPP') : "Auto"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={followUpData.followUp2Date ? new Date(followUpData.followUp2Date) : undefined}
                        onSelect={(date) => {
                          console.log('Date selected for F2:', date);
                          handleDateChange(2, date);
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="f2Remark" className="text-sm font-medium">F2 Remark</Label>
                  <input
                    id="f2Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1"
                    placeholder="F2 Remark"
                    value={followUpData.followUp2Remark}
                    onChange={(e) => handleRemarkChange(2, e.target.value)}
                  />
                </div>
              </div>

              {/* F3 */}
              <div className="space-y-3 p-3 border rounded">
                <div className="flex items-center gap-3">
                  <input
                    id="f3"
                    type="checkbox"
                    checked={followUpData.followUp3Done}
                    onChange={(e) => handleFollowUpToggle(3, e.target.checked)}
                    disabled={!followUpData.followUp2Done}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f3">Follow-up 3 Done</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn("w-[200px] justify-start", !followUpData.followUp3Date && "text-muted-foreground")}
                        disabled={!followUpData.followUp2Done}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpData.followUp3Date ? format(new Date(followUpData.followUp3Date), 'PPP') : "Auto"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={followUpData.followUp3Date ? new Date(followUpData.followUp3Date) : undefined}
                        onSelect={(date) => {
                          console.log('Date selected for F3:', date);
                          handleDateChange(3, date);
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="f3Remark" className="text-sm font-medium">F3 Remark</Label>
                  <input
                    id="f3Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1"
                    placeholder="F3 Remark"
                    value={followUpData.followUp3Remark}
                    onChange={(e) => handleRemarkChange(3, e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Follow-up History Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Follow-up History
            </h3>
            
            {historyLoading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading history...</p>
              </div>
            ) : followUpHistory.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {followUpHistory.map((entry, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{getStatusDisplay(entry.status)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {entry.remark && (
                          <p className="text-sm text-muted-foreground mb-1">{entry.remark}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {entry.followUpDate && (
                            <span>Date: {new Date(entry.followUpDate).toLocaleDateString()}</span>
                          )}
                          {entry.updatedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.updatedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No follow-up history found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !hasChanges()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
