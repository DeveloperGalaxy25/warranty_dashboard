import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Customer } from '../WarrantyDashboard';
import { emailService, EmailTemplateData } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';

interface WarrantyCardEmailModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent: () => void;
}

export const WarrantyCardEmailModal: React.FC<WarrantyCardEmailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEmailSent
}) => {
  const { toast } = useToast();
  const [emailData, setEmailData] = useState<EmailTemplateData>({
    customerName: customer.CustomerName,
    warrantyId: customer.WarrantyID,
    product: customer.Product,
    brand: customer.Brand,
    email: customer.Email,
    phone: customer.Mobile,
    purchaseDate: new Date(customer.Timestamp).toLocaleDateString(),
    warrantyCardUrl: (customer as any).warrantyCardUrl
  });
  
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Generate email preview when data changes
  useEffect(() => {
    try {
      const preview = emailService.getEmailTemplatePreview(emailData);
      setEmailPreview(preview);
      setValidationErrors([]);
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  }, [emailData]);

  const handleInputChange = (field: keyof EmailTemplateData, value: string) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAndSend = async () => {
    const validation = emailService.validateEmailData(emailData);
    setValidationErrors(validation.errors);
    
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: `Please fix the following errors: ${validation.errors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Try Google Apps Script first, fallback to SMTP
      let result = await emailService.sendWarrantyCardEmail(emailData);
      
      if (!result.success) {
        // Fallback to SMTP
        result = await emailService.sendWarrantyCardEmailSMTP(emailData);
      }

      if (result.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Warranty card email sent to ${emailData.email}`,
        });
        onEmailSent();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      toast({
        title: "Email Sending Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Warranty Card Email - {customer.WarrantyID}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Select value={emailData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baybee">Baybee</SelectItem>
                      <SelectItem value="Drogo">Drogo</SelectItem>
                      <SelectItem value="Domestica">Domestica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Warranty ID</Label>
                  <Input 
                    value={emailData.warrantyId} 
                    onChange={(e) => handleInputChange('warrantyId', e.target.value)}
                    placeholder="Warranty ID"
                  />
                </div>
              </div>

              <div>
                <Label>Customer Name</Label>
                <Input 
                  value={emailData.customerName} 
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <Label>Product</Label>
                <Input 
                  value={emailData.product} 
                  onChange={(e) => handleInputChange('product', e.target.value)}
                  placeholder="Product Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={emailData.email} 
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="customer@email.com"
                    type="email"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={emailData.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div>
                <Label>Purchase Date</Label>
                <Input 
                  value={emailData.purchaseDate} 
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  placeholder="Purchase Date"
                />
              </div>

              <div>
                <Label>Warranty Card URL (Optional)</Label>
                <Input 
                  value={emailData.warrantyCardUrl || ''} 
                  onChange={(e) => handleInputChange('warrantyCardUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handlePreviewToggle} 
                  variant="outline" 
                  className="flex-1"
                  disabled={sending}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button 
                  onClick={validateAndSend} 
                  className="flex-1" 
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Preview
                <Badge variant="secondary">{emailData.brand}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-800">To: {emailData.email}</p>
                    <p className="text-sm text-blue-700">Subject: {emailService.generateWarrantyCardPreview(emailData).subject}</p>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <iframe
                      srcDoc={emailPreview}
                      className="w-full h-96 border-0"
                      title="Email Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Show Preview" to see how the email will look</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
