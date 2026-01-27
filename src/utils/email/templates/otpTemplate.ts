// src/utils/email/templates/otpTemplate.ts

export interface OTPEmailData {
  email: string;
  name: string;
  otp: string;
}

export const generateOTPEmail = (data: OTPEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .otp-box {
      background: #f8f9fa;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-icon {
      font-size: 20px;
      margin-right: 8px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .divider {
      height: 1px;
      background: #e9ecef;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    
    <div class="content">
      <p>Hi <strong>${data.name}</strong>,</p>
      
      <p>We received a request to reset your admin account password. Use the OTP below to complete the password reset process:</p>
      
      <div class="otp-box">
        <div style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
        <div class="otp-code">${data.otp}</div>
        <div style="color: #6c757d; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</div>
      </div>
      
      <p><strong>How to use this OTP:</strong></p>
      <ol>
        <li>Go back to the password reset page</li>
        <li>Enter this 6-digit OTP code</li>
        <li>Create your new password</li>
      </ol>
      
      <div class="warning">
        <span class="warning-icon">⚠️</span>
        <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support immediately. Your current password will remain unchanged.
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6c757d;">
        <strong>Didn't request this?</strong> Your account is still secure. This OTP will expire in 10 minutes and can only be used once.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Aamantran Homestay Admin System</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} Aamantran Homestay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};