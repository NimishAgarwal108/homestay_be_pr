// src/controllers/auth/forgotPasswordController.ts
import { Request, Response } from 'express';
import Admin from '../../models/Admin';
import { otpService } from '../../services/otpService';
import { tokenService } from '../../services/tokenService';
import { sendPasswordResetOTP, resendPasswordResetOTP } from '../../utils/emailService';

export const forgotPassword = async (req: Request, res: Response) => {
  console.log('🟢 ========== FORGOT PASSWORD CALLED ==========');
  console.log('🟢 Body:', req.body);
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, an OTP has been sent',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated. Contact system administrator.',
      });
    }

    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp);

    try {
      await sendPasswordResetOTP(email, admin.name, otp);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  console.log('🟢 ========== VERIFY OTP CALLED ==========');
  console.log('🟢 Body:', req.body);
  
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const verification = otpService.verifyOTP(email, otp);

    if (!verification.valid) {
      return res.status(400).json({ 
        success: false, 
        message: verification.message 
      });
    }

    console.log(`✅ OTP verified for ${email}`);

    const resetToken = tokenService.generateResetToken(email);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  console.log('🟢 ========== RESET PASSWORD CALLED ==========');
  console.log('🟢 Body:', req.body);
  
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      });
    }

    const tokenVerification = tokenService.verifyResetToken(resetToken);

    if (!tokenVerification.valid) {
      return res.status(400).json({ 
        success: false, 
        message: tokenVerification.message 
      });
    }

    const admin = await Admin.findOne({ email: tokenVerification.email });
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      });
    }

    admin.password = newPassword;
    await admin.save();

    otpService.clearOTP(tokenVerification.email!);

    console.log(`✅ Password reset successful for ${tokenVerification.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  console.log('🟢 ========== RESEND OTP CALLED ==========');
  console.log('🟢 Body:', req.body);
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, an OTP has been sent',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated',
      });
    }

    const otp = otpService.generateOTP();
    otpService.storeOTP(email, otp);

    try {
      await resendPasswordResetOTP(email, admin.name, otp);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};