// src/controllers/auth/forgotPasswordController.ts
import { Request, Response } from 'express';
import Admin from '../../models/Admin';
import { otpService } from '../../services/otpService';
import { sendPasswordResetOTP } from '../../utils/emailService';
import crypto from 'crypto';

// Temporary storage for reset tokens (in production, use Redis or DB)
const resetTokenStore = new Map<string, { email: string; expiresAt: number }>();

/**
 * @desc    Send OTP to admin email for password reset
 * @route   POST /api/admin/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    console.log('🔐 Forgot password request for:', email);

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        message: 'This account has been deactivated'
      });
      return;
    }

    // Generate OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp, 10); // 10 minutes expiry

    // Send OTP via email
    try {
      await sendPasswordResetOTP({
        email: admin.email,
        name: admin.name,
        otp
      });

      console.log('✅ OTP sent successfully to:', email);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      });
    }

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Verify OTP and generate reset token
 * @route   POST /api/admin/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 Verifying OTP for:', email);

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
      return;
    }

    // Verify OTP
    const otpResult = otpService.verifyOTP(email, otp);

    if (!otpResult.valid) {
      res.status(400).json({
        success: false,
        message: otpResult.message
      });
      return;
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store reset token
    resetTokenStore.set(resetToken, {
      email: admin.email,
      expiresAt
    });

    // Clear OTP after successful verification
    otpService.clearOTP(email);

    console.log('✅ OTP verified, reset token generated for:', email);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken // Send to frontend to use in reset password
    });

  } catch (error: any) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Reset password using reset token
 * @route   POST /api/admin/auth/reset-password
 * @access  Public (but requires valid reset token)
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, resetToken, newPassword } = req.body;

    console.log('🔐 Reset password request for:', email);

    if (!email || !resetToken || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
      return;
    }

    // Verify reset token
    const tokenData = resetTokenStore.get(resetToken);

    if (!tokenData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    if (Date.now() > tokenData.expiresAt) {
      resetTokenStore.delete(resetToken);
      res.status(401).json({
        success: false,
        message: 'Reset token has expired. Please request a new password reset.'
      });
      return;
    }

    if (tokenData.email !== email.toLowerCase()) {
      res.status(401).json({
        success: false,
        message: 'Invalid reset token for this email'
      });
      return;
    }

    // Password validation
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Find admin and update password
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
      return;
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    // Clear reset token after successful password reset
    resetTokenStore.delete(resetToken);

    console.log('✅ Password reset successful for:', email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/admin/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    console.log('🔄 Resend OTP request for:', email);

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive an OTP shortly'
      });
      return;
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp, 10); // 10 minutes expiry

    // Send OTP via email
    try {
      await sendPasswordResetOTP({
        email: admin.email,
        name: admin.name,
        otp
      });

      console.log('✅ OTP resent successfully to:', email);

      res.status(200).json({
        success: true,
        message: 'New OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      });
    }

  } catch (error: any) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};