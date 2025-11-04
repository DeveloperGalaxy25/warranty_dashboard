import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock, User, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { WarrantyRecord } from "@/hooks/useWarrantyData";
import { markReviewDone, logFollowUpAction, getWorkflowHistory, updateFollowUpStatus, markFollowUp, getFollowupState, updateSku } from "@/lib/warrantyService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StatusUpdateModalProps {
  customer: WarrantyRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onFollowUpUpdate?: (warrantyId: string, followupsDone: number) => void;
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
  followUp1Remark: string;
  followUp1Timestamp?: string;
  followUp2Done: boolean;
  followUp2Remark: string;
  followUp2Date?: string;
  followUp3Done: boolean;
  followUp3Remark: string;
  followUp3Date?: string;
  followUp1Disabled: boolean;
  followUp2Disabled: boolean;
  followUp3Disabled: boolean;
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

export const StatusUpdateModal = ({ customer, isOpen, onClose, onUpdate, onFollowUpUpdate }: StatusUpdateModalProps) => {
  const [reviewDone, setReviewDone] = useState<boolean>(false);
  const [remark, setRemark] = useState("");
  const [followUpData, setFollowUpData] = useState<FollowUpData>({
    followUp1Done: false,
    followUp1Remark: "",
    followUp2Done: false,
    followUp2Remark: "",
    followUp3Done: false,
    followUp3Remark: "",
    followUp1Disabled: false,
    followUp2Disabled: false,
    followUp3Disabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [followUpSummary, setFollowUpSummary] = useState<FollowUpSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sku, setSku] = useState<string>(customer?.sku || (customer as any)?.SKU || "");
  const { toast } = useToast();

  const isReviewCompleted = Boolean(customer?.status === "Review Won" || customer?.status === "Closed" || customer?.status === "Completed");

  // Load follow-up history and state when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      loadFollowUpHistory();
      loadFollowupState();
      // Prefill basic: if we ever store summary server-side, fetch it here
      setFollowUpSummary((prev) => prev || { count: 0, stages: [], latest: null, nextDue: null });
      // Reset success state when modal opens
      setSaveSuccess(false);
      setSku((customer as any)?.sku || (customer as any)?.SKU || "");
    }
  }, [isOpen, customer]);

  const loadFollowupState = async () => {
    if (!customer.warrantyId) return;
    
    try {
      const state = await getFollowupState(customer.warrantyId);
      
      setFollowUpData(prev => ({
        ...prev,
        followUp1Done: state.followUp1.done,
        followUp1Remark: state.followUp1.remark,
        followUp1Timestamp: state.followUp1.timestamp,
        followUp2Done: state.followUp2.done,
        followUp2Remark: state.followUp2.remark,
        followUp2Date: state.followUp2.date,
        followUp3Done: state.followUp3.done,
        followUp3Remark: state.followUp3.remark,
        followUp3Date: state.followUp3.date,
        followUp1Disabled: state.followUp1.done,
        followUp2Disabled: state.followUp2.done,
        followUp3Disabled: state.followUp3.done
      }));
    } catch (error) {
      console.error('Failed to load follow-up state:', error);
    }
  };

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

  const handleSaveSku = async () => {
    try {
      setLoading(true);
      await updateSku(customer.warrantyId, sku || "");
      toast({ title: "SKU Saved", description: "SKU updated successfully", duration: 2500 });
      onUpdate();
    } catch (e) {
      toast({ title: "SKU Update Failed", description: `${e instanceof Error ? e.message : 'Unknown error'}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      
      if (reviewDone) {
        await markReviewDone(customer.warrantyId, remark);
        setFollowUpSummary({ count: 3, stages: [1,2,3], latest: new Date().toISOString().slice(0,10), nextDue: null });
      } else {
        // Handle follow-up updates with automatic timestamp detection
        if (followUpData.followUp1Done && !followUpData.followUp1Disabled) {
          // When Follow-up 1 is checked, automatically detect timestamp and calculate other dates
          const response = await updateFollowUpStatus({
            warrantyId: customer.warrantyId,
            followUp1Remark: followUpData.followUp1Remark
          });
          
          if (response.success) {
            // Update follow-up data with response
            setFollowUpData(prev => ({
              ...prev,
              followUp1Disabled: true,
              followUp1Timestamp: response.f1Timestamp,
              followUp1Remark: response.f1Remark || prev.followUp1Remark,
              followUp2Date: response.followUp2Date,
              followUp3Date: response.followUp3Date
            }));
            
            // Update parent component's follow-ups count
            if (onFollowUpUpdate) {
              onFollowUpUpdate(customer.warrantyId, response.followupsDone);
            }
          }
        } else if (followUpData.followUp2Done && !followUpData.followUp2Disabled) {
          // Handle Follow-up 2 completion
          const response = await markFollowUp(
            customer.warrantyId,
            2,
            followUpData.followUp2Remark || ""
          );
          
          if (response.success) {
            // Update follow-up data with response
            setFollowUpData(prev => ({
              ...prev,
              followUp2Disabled: true,
              followUp2Date: response.followUp2Date,
              followUp3Date: response.followUp3Date
            }));
            
            // Update parent component's follow-ups count
            if (onFollowUpUpdate) {
              onFollowUpUpdate(customer.warrantyId, response.followupsDone);
            }
          }
        } else if (followUpData.followUp3Done && !followUpData.followUp3Disabled) {
          // Handle Follow-up 3 completion
          const response = await markFollowUp(
            customer.warrantyId,
            3,
            followUpData.followUp3Remark || ""
          );
          
          if (response.success) {
            // Update follow-up data with response
            setFollowUpData(prev => ({
              ...prev,
              followUp3Disabled: true,
              followUp2Date: response.followUp2Date,
              followUp3Date: response.followUp3Date
            }));
            
            // Update parent component's follow-ups count
            if (onFollowUpUpdate) {
              onFollowUpUpdate(customer.warrantyId, response.followupsDone);
            }
          }
        } else if (followUpData.followUp1Remark || followUpData.followUp2Remark || followUpData.followUp3Remark) {
          // Handle remarks only (no follow-up completion)
          const nextNo = (followUpSummary?.count || 0) + 1;
          const remark = followUpData.followUp1Remark || followUpData.followUp2Remark || followUpData.followUp3Remark;
          await logFollowUpAction(
            customer.warrantyId,
            customer.customerName,
            customer.brand,
            nextNo,
            new Date().toISOString().slice(0,10),
            null,
            "Follow-up Note",
            remark
          );
        } else {
          throw new Error("No changes to save");
        }
      }
      
      // Show success state
      setSaveSuccess(true);
      toast({
        title: "Success",
        description: "Update saved successfully",
        duration: 3000,
      });
      
      // Refresh only the table data, not the entire dashboard
      onUpdate();
      
      // Close modal after a short delay to show success state
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (e) {
      toast({
        title: "Error",
        description: `Failed to save: ${e instanceof Error ? e.message : "Unknown error"}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpToggle = (n: 1|2|3, checked: boolean) => {
    const map: Record<number, keyof FollowUpData> = {1: "followUp1Done", 2: "followUp2Done", 3: "followUp3Done"};
    setFollowUpData(prev => ({ ...prev, [map[n]]: checked } as FollowUpData));
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
          {customer.orderId ? (
            <div>
              <span className="text-sm text-muted-foreground">Order ID</span>
              <p className="font-medium break-all">{customer.orderId}</p>
            </div>
          ) : null}
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
          {/* SKU Entry */}
          <div className="space-y-2 p-4 border rounded-lg">
            <Label htmlFor="skuName" className="text-sm font-medium">SKU</Label>
            <div className="flex gap-2">
              <input
                id="skuName"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Enter SKU name"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <Button onClick={handleSaveSku} disabled={loading}>
                Save SKU
              </Button>
            </div>
          </div>

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
              <p className="text-sm text-muted-foreground">
                When you check "Follow-up 1 Done", the system will automatically detect the current timestamp 
                and calculate the next follow-up dates.
              </p>

              {/* F1 */}
              <div className="space-y-3 p-3 border rounded">
                <div className="flex items-center gap-3">
                  <input
                    id="f1"
                    type="checkbox"
                    checked={followUpData.followUp1Done}
                    onChange={(e) => handleFollowUpToggle(1, e.target.checked)}
                    disabled={followUpData.followUp1Disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f1">Follow-up 1 Done</Label>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Auto timestamp
                  </span>
                </div>
                {followUpData.followUp1Timestamp && (
                  <div className="text-xs text-muted-foreground">
                    Saved at {new Date(followUpData.followUp1Timestamp).toLocaleString()}
                  </div>
                )}
                <div>
                  <Label htmlFor="f1Remark" className="text-sm font-medium">F1 Remark</Label>
                  <textarea
                    id="f1Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1 resize-none"
                    placeholder="F1 Remark"
                    value={followUpData.followUp1Remark}
                    onChange={(e) => handleRemarkChange(1, e.target.value)}
                    disabled={followUpData.followUp1Disabled}
                    rows={3}
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
                    disabled={!followUpData.followUp1Done || followUpData.followUp2Disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f2">Follow-up 2 Done</Label>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    Auto calculated
                  </span>
                </div>
                {followUpData.followUp2Date && (
                  <div className="text-xs text-muted-foreground">
                    Due: {new Date(followUpData.followUp2Date).toLocaleDateString()}
                  </div>
                )}
                <div>
                  <Label htmlFor="f2Remark" className="text-sm font-medium">F2 Remark</Label>
                  <textarea
                    id="f2Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1 resize-none"
                    placeholder="F2 Remark"
                    value={followUpData.followUp2Remark}
                    onChange={(e) => handleRemarkChange(2, e.target.value)}
                    disabled={followUpData.followUp2Disabled}
                    rows={3}
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
                    disabled={!followUpData.followUp2Done || followUpData.followUp3Disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="f3">Follow-up 3 Done</Label>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    Auto calculated
                  </span>
                </div>
                {followUpData.followUp3Date && (
                  <div className="text-xs text-muted-foreground">
                    Due: {new Date(followUpData.followUp3Date).toLocaleDateString()}
                  </div>
                )}
                <div>
                  <Label htmlFor="f3Remark" className="text-sm font-medium">F3 Remark</Label>
                  <input
                    id="f3Remark"
                    className="w-full border rounded px-3 py-2 text-sm mt-1"
                    placeholder="F3 Remark"
                    value={followUpData.followUp3Remark}
                    onChange={(e) => handleRemarkChange(3, e.target.value)}
                    disabled={followUpData.followUp3Disabled}
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
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !hasChanges() || saveSuccess}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Saved!
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
