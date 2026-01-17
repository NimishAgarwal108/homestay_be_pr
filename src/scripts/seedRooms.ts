import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room';

dotenv.config();

const rooms = [
  {
    name: 'Deluxe Mountain View',
    type: 'deluxe',
    description: 'Spacious room with stunning mountain views and modern amenities',
    price: 3500,
    capacity: 2,
    amenities: ['WiFi', 'TV', 'AC', 'Mini Fridge', 'Tea/Coffee Maker'],
    features: ['King Bed', 'Mountain View', 'Private Balcony', 'Attached Bath'],
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop'],
    isAvailable: true
  },
  {
    name: 'Family Suite',
    type: 'suite',
    description: 'Perfect for families with separate living area and kitchenette',
    price: 5500,
    capacity: 4,
    amenities: ['WiFi', 'TV', 'AC', 'Kitchenette', 'Living Area'],
    features: ['2 Bedrooms', 'Living Area', 'Valley View', 'Kitchenette'],
    images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&h=400&fit=crop'],
    isAvailable: true
  },
  {
    name: 'Cozy Mountain Cabin',
    type: 'cabin',
    description: 'Rustic charm with modern comforts and garden views',
    price: 4200,
    capacity: 3,
    amenities: ['WiFi', 'Fireplace', 'Tea Corner', 'Garden Access'],
    features: ['Queen + Single', 'Fireplace', 'Garden View', 'Tea Corner'],
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop'],
    isAvailable: true
  }
];

const seedRooms = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homestay_db';
    
    console.log('🔄 Connecting to database...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing rooms
    console.log('🗑️  Clearing existing rooms...');
    await Room.deleteMany({});

    // Insert new rooms
    console.log('📦 Inserting rooms...');
    const createdRooms = await Room.insertMany(rooms);
    
    console.log('✅ Successfully seeded rooms:');
    createdRooms.forEach(room => {
      console.log(`   - ${room.name} (₹${room.price}/night, Capacity: ${room.capacity})`);
    });

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedRooms();