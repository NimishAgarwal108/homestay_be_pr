import { Request, Response } from 'express';
import Admin from '../../models/Admin';
import { tokenService } from '../../services/tokenService';

export const adminLogin = async (req: Request, res: Response) => {
  console.log('🟢 ========== ADMIN LOGIN CALLED ==========');
  console.log('🟢 Method:', req.method);
  console.log('🟢 Path:', req.path);
  console.log('🟢 Body:', req.body);
  console.log('🟢 =====================================');
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = tokenService.generateAuthToken(admin._id.toString(), admin.email);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};

export const logoutAdmin = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};
