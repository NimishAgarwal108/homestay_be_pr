import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD // Gmail App Password (not regular password)
  }
});

// Send booking notification email to admin ONLY
export const sendBookingNotificationToAdmin = async (
  bookingDetails: {
    bookingReference: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    roomName: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    nights: number;
    totalPrice: number;
    specialRequests?: string;
  }
): Promise<void> => {
  const { 
    bookingReference, 
    guestName, 
    guestEmail, 
    guestPhone,
    roomName, 
    checkIn, 
    checkOut, 
    guests, 
    nights, 
    totalPrice,
    specialRequests 
  } = bookingDetails;

  const adminEmail = 'findmyroom1@gmail.com';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🔔 New Booking Received - ${bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
          .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .success-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏨 New Booking Confirmed!</h1>
          <div class="success-badge">✓ AUTO-CONFIRMED</div>
          <p style="margin: 10px 0 0 0;">Booking Reference: <strong>${bookingReference}</strong></p>
        </div>

        <div class="content">
          <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
            📋 Booking Details
          </h2>

          <div class="detail-row">
            <span class="detail-label">👤 Guest Name:</span>
            <span class="detail-value">${guestName}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📧 Email:</span>
            <span class="detail-value">${guestEmail}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📱 Phone:</span>
            <span class="detail-value">${guestPhone}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">🏠 Room:</span>
            <span class="detail-value">${roomName}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📅 Check-in:</span>
            <span class="detail-value">${new Date(checkIn).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📅 Check-out:</span>
            <span class="detail-value">${new Date(checkOut).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">🌙 Nights:</span>
            <span class="detail-value">${nights} night${nights > 1 ? 's' : ''}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">👥 Guests:</span>
            <span class="detail-value">${guests} guest${guests > 1 ? 's' : ''}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">💰 Total Amount:</span>
            <span class="detail-value" style="color: #28a745; font-weight: bold; font-size: 18px;">
              ₹${totalPrice.toLocaleString('en-IN')}
            </span>
          </div>

          ${specialRequests ? `
            <div class="alert">
              <strong>📝 Special Requests:</strong><br>
              ${specialRequests}
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #2e7d32;">
              ℹ️ <strong>This booking has been automatically confirmed.</strong><br>
              View and manage all bookings in your admin dashboard.
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;">This is an automated notification from your Hotel Booking System</p>
          <p style="margin: 5px 0;">📊 <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="color: #667eea;">View in Admin Dashboard</a></p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} HomeStay. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification email sent successfully to:', adminEmail);
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    throw error;
  }
};

// Send OTP for password reset
export const sendPasswordResetOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP - Aamantran Homestay Admin',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .otp-box {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .otp-code {
            margin: 10px 0;
            color: #2563eb;
            font-size: 32px;
            letter-spacing: 5px;
            font-weight: bold;
          }
          .warning {
            color: #ef4444;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            color: #666;
            font-size: 12px;
          }
          .info-text {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You have requested to reset your password for Aamantran Homestay Admin Panel.</p>
          
          <div class="otp-box">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Your OTP is:</p>
            <h1 class="otp-code">${otp}</h1>
          </div>
          
          <p class="warning">⏰ This OTP will expire in 10 minutes.</p>
          
          <p class="info-text">
            If you didn't request this, please ignore this email and your password will remain unchanged.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
            This is an automated email from Aamantran Homestay Admin System.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Aamantran Homestay. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

// Resend OTP for password reset
export const resendPasswordResetOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP (Resent) - Aamantran Homestay Admin',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .otp-box {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .otp-code {
            margin: 10px 0;
            color: #2563eb;
            font-size: 32px;
            letter-spacing: 5px;
            font-weight: bold;
          }
          .warning {
            color: #ef4444;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset OTP (Resent)</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Here is your new OTP for password reset:</p>
          
          <div class="otp-box">
            <h1 class="otp-code">${otp}</h1>
          </div>
          
          <p class="warning">⏰ This OTP will expire in 10 minutes.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Aamantran Homestay. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP resent to ${email}`);
  } catch (error) {
    console.error('❌ Error resending OTP email:', error);
    throw error;
  }
};

// Verify transporter configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};