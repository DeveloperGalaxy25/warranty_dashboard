export interface EmailTemplateData {
  customerName: string;
  warrantyId: string;
  product: string;
  brand: string;
  email: string;
  phone: string;
  purchaseDate: string;
  warrantyCardUrl?: string;
}

export interface BrandEmailConfig {
  brand: string;
  fromEmail: string;
  fromName: string;
  subjectTemplate: string;
  replyTo?: string;
}

export const brandEmailConfigs: BrandEmailConfig[] = [
  {
    brand: "Baybee",
    fromEmail: "warranty@baybee.com",
    fromName: "Baybee Warranty Team",
    subjectTemplate: "Your Baybee Warranty Card - {warrantyId}",
    replyTo: "support@baybee.com"
  },
  {
    brand: "Drogo",
    fromEmail: "warranty@drogo.com", 
    fromName: "Drogo Warranty Team",
    subjectTemplate: "Your Drogo Warranty Card - {warrantyId}",
    replyTo: "support@drogo.com"
  },
  {
    brand: "Domestica",
    fromEmail: "warranty@domestica.com",
    fromName: "Domestica Warranty Team", 
    subjectTemplate: "Your Domestica Warranty Card - {warrantyId}",
    replyTo: "support@domestica.com"
  }
];

export const getBrandEmailConfig = (brand: string): BrandEmailConfig => {
  const config = brandEmailConfigs.find(c => c.brand === brand);
  if (!config) {
    throw new Error(`No email configuration found for brand: ${brand}`);
  }
  return config;
};

export const generateEmailSubject = (brand: string, warrantyId: string): string => {
  const config = getBrandEmailConfig(brand);
  return config.subjectTemplate.replace('{warrantyId}', warrantyId);
};

// Base HTML template structure
export const getBaseEmailTemplate = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warranty Card</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f9f9f9;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .brand-logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
        }
        .warranty-id {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
        }
        .customer-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
        }
        .detail-value {
            color: #212529;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #6c757d;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .cta-button:hover {
            background: #0056b3;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-container { padding: 20px; }
            .detail-row { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        {HEADER_CONTENT}
        {MAIN_CONTENT}
        {FOOTER_CONTENT}
    </div>
</body>
</html>
`;

// Brand-specific template generators
export const generateBaybeeTemplate = (data: EmailTemplateData): string => {
  const baseTemplate = getBaseEmailTemplate();
  
  const headerContent = `
    <div class="header">
        <img src="https://your-domain.com/baybee-logo.png" alt="Baybee" class="brand-logo">
        <h1 style="color: #e91e63; margin: 0;">Baybee Warranty Card</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Thank you for choosing Baybee!</p>
    </div>
  `;
  
  const mainContent = `
    <div class="warranty-id">
        <h2 style="margin: 0 0 10px 0; color: #007bff;">Warranty ID: ${data.warrantyId}</h2>
        <p style="margin: 0; color: #666;">Your warranty has been successfully registered</p>
    </div>
    
    <div class="customer-details">
        <h3 style="margin: 0 0 15px 0; color: #e91e63;">Customer Information</h3>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${data.customerName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Product:</span>
            <span class="detail-value">${data.product}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Purchase Date:</span>
            <span class="detail-value">${data.purchaseDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${data.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${data.phone}</span>
        </div>
    </div>
    
    <div style="text-align: center;">
        <p style="margin: 20px 0;">Your warranty card is ready! Click below to view:</p>
        ${data.warrantyCardUrl ? `<a href="${data.warrantyCardUrl}" class="cta-button">View Warranty Card</a>` : ''}
    </div>
  `;
  
  const footerContent = `
    <div class="footer">
        <p>For any questions, please contact us at support@baybee.com</p>
        <p>© 2024 Baybee. All rights reserved.</p>
    </div>
  `;
  
  return baseTemplate
    .replace('{HEADER_CONTENT}', headerContent)
    .replace('{MAIN_CONTENT}', mainContent)
    .replace('{FOOTER_CONTENT}', footerContent);
};

export const generateDrogoTemplate = (data: EmailTemplateData): string => {
  const baseTemplate = getBaseEmailTemplate();
  
  const headerContent = `
    <div class="header">
        <img src="https://your-domain.com/drogo-logo.png" alt="Drogo" class="brand-logo">
        <h1 style="color: #9c27b0; margin: 0;">Drogo Warranty Card</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Premium gaming experience guaranteed!</p>
    </div>
  `;
  
  const mainContent = `
    <div class="warranty-id">
        <h2 style="margin: 0 0 10px 0; color: #007bff;">Warranty ID: ${data.warrantyId}</h2>
        <p style="margin: 0; color: #666;">Your gaming warranty is now active</p>
    </div>
    
    <div class="customer-details">
        <h3 style="margin: 0 0 15px 0; color: #9c27b0;">Customer Information</h3>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${data.customerName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Product:</span>
            <span class="detail-value">${data.product}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Purchase Date:</span>
            <span class="detail-value">${data.purchaseDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${data.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${data.phone}</span>
        </div>
    </div>
    
    <div style="text-align: center;">
        <p style="margin: 20px 0;">Your warranty card is ready! Click below to view:</p>
        ${data.warrantyCardUrl ? `<a href="${data.warrantyCardUrl}" class="cta-button">View Warranty Card</a>` : ''}
    </div>
  `;
  
  const footerContent = `
    <div class="footer">
        <p>For any questions, please contact us at support@drogo.com</p>
        <p>© 2024 Drogo. All rights reserved.</p>
    </div>
  `;
  
  return baseTemplate
    .replace('{HEADER_CONTENT}', headerContent)
    .replace('{MAIN_CONTENT}', mainContent)
    .replace('{FOOTER_CONTENT}', footerContent);
};

export const generateDomesticaTemplate = (data: EmailTemplateData): string => {
  const baseTemplate = getBaseEmailTemplate();
  
  const headerContent = `
    <div class="header">
        <img src="https://your-domain.com/domestica-logo.png" alt="Domestica" class="brand-logo">
        <h1 style="color: #3f51b5; margin: 0;">Domestica Warranty Card</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Quality home solutions for your family!</p>
    </div>
  `;
  
  const mainContent = `
    <div class="warranty-id">
        <h2 style="margin: 0 0 10px 0; color: #007bff;">Warranty ID: ${data.warrantyId}</h2>
        <p style="margin: 0; color: #666;">Your home warranty is now active</p>
    </div>
    
    <div class="customer-details">
        <h3 style="margin: 0 0 15px 0; color: #3f51b5;">Customer Information</h3>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${data.customerName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Product:</span>
            <span class="detail-value">${data.product}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Purchase Date:</span>
            <span class="detail-value">${data.purchaseDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${data.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${data.phone}</span>
        </div>
    </div>
    
    <div style="text-align: center;">
        <p style="margin: 20px 0;">Your warranty card is ready! Click below to view:</p>
        ${data.warrantyCardUrl ? `<a href="${data.warrantyCardUrl}" class="cta-button">View Warranty Card</a>` : ''}
    </div>
  `;
  
  const footerContent = `
    <div class="footer">
        <p>For any questions, please contact us at support@domestica.com</p>
        <p>© 2024 Domestica. All rights reserved.</p>
    </div>
  `;
  
  return baseTemplate
    .replace('{HEADER_CONTENT}', headerContent)
    .replace('{MAIN_CONTENT}', mainContent)
    .replace('{FOOTER_CONTENT}', footerContent);
};

export const generateWarrantyCardEmail = (data: EmailTemplateData): string => {
  switch (data.brand) {
    case 'Baybee':
      return generateBaybeeTemplate(data);
    case 'Drogo':
      return generateDrogoTemplate(data);
    case 'Domestica':
      return generateDomesticaTemplate(data);
    default:
      throw new Error(`Unsupported brand: ${data.brand}`);
  }
};
