import { Request, Response } from 'express';
import Admin from '../../models/Admin';

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - adminId is added by auth middleware
    const admin = await Admin.findById(req.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });

  } catch (error: any) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const verifySession = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const admin = await Admin.findById(req.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        authenticated: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('❌ Verify session error:', error);
    res.status(500).json({
      success: false,
      authenticated: false,
      message: 'Server error'
    });
  }
};
