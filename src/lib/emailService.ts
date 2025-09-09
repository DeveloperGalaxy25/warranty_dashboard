import { 
  EmailTemplateData, 
  generateWarrantyCardEmail, 
  getBrandEmailConfig,
  generateEmailSubject 
} from '@/templates/email-service/emailTemplates';
import { getConfig } from './config';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailPreviewData {
  subject: string;
  htmlBody: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Generate email preview data for warranty card
   */
  public generateWarrantyCardPreview(data: EmailTemplateData): EmailPreviewData {
    try {
      const brandConfig = getBrandEmailConfig(data.brand);
      const subject = generateEmailSubject(data.brand, data.warrantyId);
      const htmlBody = generateWarrantyCardEmail(data);
      
      return {
        subject,
        htmlBody,
        fromEmail: brandConfig.fromEmail,
        fromName: brandConfig.fromName,
        replyTo: brandConfig.replyTo
      };
    } catch (error) {
      throw new Error(`Failed to generate email preview: ${error}`);
    }
  }

  /**
   * Send warranty card email via Google Apps Script
   */
  public async sendWarrantyCardEmail(data: EmailTemplateData): Promise<EmailSendResult> {
    try {
      const preview = this.generateWarrantyCardPreview(data);
      const brandConfig = getBrandEmailConfig(data.brand);

      const getBase = () => {
        const BASE = getConfig("SHEETS_API_BASE");
        if (!BASE || !BASE.startsWith('https://script.google.com/macros/')) {
          throw new Error('SHEETS_API_BASE missing or invalid. Check runtime configuration.');
        }
        return BASE;
      };
      const token = getConfig("SHEETS_API_TOKEN");
      
      // Prepare payload for Apps Script
      const payload = {
        action: 'sendWarrantyEmail',
        token,
        customerData: {
          warrantyId: data.warrantyId,
          customerName: data.customerName,
          email: data.email,
          brand: data.brand,
          product: data.product,
          phone: data.phone,
          purchaseDate: data.purchaseDate,
          warrantyCardUrl: data.warrantyCardUrl
        },
        emailConfig: {
          subject: preview.subject,
          htmlBody: preview.htmlBody,
          fromEmail: preview.fromEmail,
          fromName: preview.fromName,
          replyTo: preview.replyTo
        }
      } as const;

      // Send as application/x-www-form-urlencoded to avoid preflight
      const body = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        body.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });

      const response = await fetch(getBase(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Safe JSON parser that detects HTML responses
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE')) {
        throw new Error(`Non-JSON response (HTML): ${text.slice(0, 200)}`);
      }
      let result: any;
      try { result = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`); }
      
      if (result.success) {
        return {
          success: true,
          messageId: result.messageId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send warranty card email via SMTP (alternative method)
   */
  public async sendWarrantyCardEmailSMTP(data: EmailTemplateData): Promise<EmailSendResult> {
    try {
      const preview = this.generateWarrantyCardPreview(data);
      
      // This would integrate with your SMTP service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate the email sending
      
      console.log('Sending email via SMTP:', {
        to: data.email,
        subject: preview.subject,
        from: preview.fromEmail,
        brand: data.brand
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `smpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('SMTP email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate email template data
   */
  public validateEmailData(data: EmailTemplateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.customerName?.trim()) errors.push('Customer name is required');
    if (!data.warrantyId?.trim()) errors.push('Warranty ID is required');
    if (!data.product?.trim()) errors.push('Product is required');
    if (!data.brand?.trim()) errors.push('Brand is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.phone?.trim()) errors.push('Phone is required');
    if (!data.purchaseDate?.trim()) errors.push('Purchase date is required');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Validate brand
    const validBrands = ['Baybee', 'Drogo', 'Domestica'];
    if (data.brand && !validBrands.includes(data.brand)) {
      errors.push(`Invalid brand. Must be one of: ${validBrands.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get email template preview as HTML string
   */
  public getEmailTemplatePreview(data: EmailTemplateData): string {
    try {
      return generateWarrantyCardEmail(data);
    } catch (error) {
      throw new Error(`Failed to generate template preview: ${error}`);
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
