export class OTPService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOTP(email: string, otp: string, expiryMinutes: number = 10): void {
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
    this.otpStore.set(email, { otp, expiresAt });
    console.log(`🔑 OTP Generated for ${email}: ${otp}`);
  }

  verifyOTP(email: string, otp: string): { valid: boolean; message: string } {
    const storedData = this.otpStore.get(email);

    if (!storedData) {
      return { valid: false, message: 'OTP not found or expired. Please request a new one.' };
    }

    if (Date.now() > storedData.expiresAt) {
      this.otpStore.delete(email);
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (storedData.otp !== otp) {
      return { valid: false, message: 'Invalid OTP. Please check and try again.' };
    }

    return { valid: true, message: 'OTP verified successfully' };
  }

  clearOTP(email: string): void {
    this.otpStore.delete(email);
  }
}

export const otpService = new OTPService();