console.log('🟢 adminAuthController.ts loaded');

// Re-export all auth functions from their respective modules
export { adminLogin, logoutAdmin } from './auth/loginController';
export { getAdminProfile, verifySession } from './auth/profileController';
export { changeAdminPassword } from './auth/passwordController';
export { 
  forgotPassword, 
  verifyOTP, 
  resetPassword, 
  resendOTP 
} from './auth/forgotPasswordController';