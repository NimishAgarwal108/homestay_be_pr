import jwt from 'jsonwebtoken';

export class TokenService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  generateAuthToken(adminId: string, email: string): string {
    return jwt.sign(
      { 
        adminId, 
        email,
        role: 'admin'
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  generateResetToken(email: string): string {
    return jwt.sign(
      { email, purpose: 'password-reset' },
      this.jwtSecret,
      { expiresIn: '15m' }
    );
  }

  verifyResetToken(token: string): { valid: boolean; email?: string; message?: string } {
    try {
      const decoded: any = jwt.verify(token, this.jwtSecret);
      
      if (decoded.purpose !== 'password-reset') {
        return { valid: false, message: 'Invalid reset token' };
      }

      return { valid: true, email: decoded.email };
    } catch (error) {
      return { valid: false, message: 'Invalid or expired reset token. Please start the process again.' };
    }
  }
}

export const tokenService = new TokenService();