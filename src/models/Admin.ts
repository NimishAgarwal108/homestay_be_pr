

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// DEFAULT EXPORT (important!)
const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export default Admin;

// ==========================================
// FILE 2: app/types/admin.ts (Frontend)
// ==========================================

// Tab Types
export type TabType = 'rooms' | 'bookings' | 'photos' | 'menu';

// Room Types
export interface Room {
  _id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  features: string[];
  images: string[];
  isAvailable: boolean;
  roomNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string | Room;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string;
  mealPlan?: string;
  paymentStatus?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Gallery/Photo Types
export interface GalleryImage {
  _id: string;
  url: string;
  publicId: string;
  category: 'hero' | 'gallery' | 'food' | 'rooms';
  title?: string;
  description?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// Menu Types
export interface MenuItem {
  _id?: string;
  name: string;
  description?: string;
}

export interface MenuCategory {
  _id?: string;
  category: string;
  items: MenuItem[];
  order: number;
}

export interface Menu {
  _id: string;
  categories: MenuCategory[];
  createdAt: string;
  updatedAt: string;
}

// Admin Types
export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard Stats (optional, for future use)
export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

