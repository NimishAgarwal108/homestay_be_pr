import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for Room Document
export interface IRoom extends Document {
  name: string;
  type: 'deluxe' | 'suite' | 'cabin' | 'standard';
  description?: string;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['deluxe', 'suite', 'cabin', 'standard'],
    default: 'standard'
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Room price is required'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  features: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for faster queries
roomSchema.index({ isAvailable: 1, price: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ price: 1 });

export default mongoose.model<IRoom>('Room', roomSchema);