import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

dotenv.config();

const createAdmin = async () => {
  try {
    // New admin credentials
    const newAdminEmail = 'aamantranstays@gmail.com';
    const newAdminPassword = 'Aam@ntar@n12!';
    const newAdminName = 'Dr Mayank Mall';

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/homestay';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: newAdminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists!');
      console.log('🔄 Updating existing admin...');
      
      // Update the existing admin
      existingAdmin.name = newAdminName;
      existingAdmin.email = newAdminEmail;
      existingAdmin.password = newAdminPassword; // Will be auto-hashed by pre-save hook
      existingAdmin.isActive = true;
      
      await existingAdmin.save();
      
      console.log('✅ Admin updated successfully!');
      console.log('========================');
      console.log('Name:', existingAdmin.name);
      console.log('Email:', existingAdmin.email);
      console.log('Password:', newAdminPassword);
      console.log('Role:', existingAdmin.role);
      console.log('========================');
      console.log('🔐 You can now login at: POST /api/admin/auth/login');
      
      process.exit(0);
    }

    // Create new admin if doesn't exist
    const admin = await Admin.create({
      name: newAdminName,
      email: newAdminEmail,
      password: newAdminPassword,
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin created successfully!');
    console.log('========================');
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Password:', newAdminPassword);
    console.log('Role:', admin.role);
    console.log('========================');
    console.log('🔐 You can now login at: POST /api/admin/auth/login');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating/updating admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createAdmin();
