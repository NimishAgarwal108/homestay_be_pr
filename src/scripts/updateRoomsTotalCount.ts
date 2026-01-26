/**
 * Migration Script to add totalRooms field to existing Room documents
 * 
 * Location: homestay_be/src/scripts/updateRoomsTotalCount.ts
 * 
 * Usage: 
 * cd homestay_be
 * npx ts-node src/scripts/updateRoomsTotalCount.ts
 */

import mongoose from 'mongoose';
import Room from '../models/Room';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/homestay';

// ⚠️ IMPORTANT: Update these room names to match YOUR database exactly
// Define how many physical rooms exist for each room type
const ROOM_TYPE_COUNTS: Record<string, number> = {
  'Family Suite': 3,              // 3 physical Family Suite rooms
  'Deluxe Mountain View': 2,      // 2 physical Deluxe Mountain View rooms
  'Cozy Mountain Cabin': 1        // 1 physical Cozy Mountain Cabin room
};

async function migrateRooms() {
  try {
    console.log('🚀 Room Migration Script Starting...\n');
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Database URI:', MONGODB_URI.replace(/\/\/.*@/, '//*****@')); // Hide credentials
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    console.log('📊 Fetching all rooms from database...\n');

    const rooms = await Room.find({});
    
    if (rooms.length === 0) {
      console.log('⚠️  No rooms found in database');
      console.log('💡 Make sure you have rooms in your database before running this migration');
      return;
    }

    console.log(`Found ${rooms.length} room(s) to update:\n`);
    console.log('═'.repeat(60));

    let updatedCount = 0;
    let skippedCount = 0;

    for (const room of rooms) {
      const roomName = room.name;
      const currentTotalRooms = room.totalRooms;
      const newTotalRooms = ROOM_TYPE_COUNTS[roomName] || 1; // Default to 1 if not in mapping

      console.log(`\n📝 Room: ${roomName}`);
      console.log(`   ID: ${room._id}`);
      console.log(`   Current totalRooms: ${currentTotalRooms || 'undefined'}`);
      console.log(`   Setting totalRooms to: ${newTotalRooms}`);

      if (currentTotalRooms === newTotalRooms) {
        console.log(`   ⏭️  Skipped (already set correctly)`);
        skippedCount++;
        continue;
      }

      // Update the room
      room.totalRooms = newTotalRooms;
      await room.save();

      console.log(`   ✅ Updated successfully`);
      updatedCount++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Total rooms found: ${rooms.length}`);
    console.log(`   - Rooms updated: ${updatedCount}`);
    console.log(`   - Rooms skipped: ${skippedCount}`);
    console.log('\n📊 Room Configuration:');
    console.log(`   - Family Suite: ${ROOM_TYPE_COUNTS['Family Suite']} physical rooms`);
    console.log(`   - Deluxe Mountain View: ${ROOM_TYPE_COUNTS['Deluxe Mountain View']} physical rooms`);
    console.log(`   - Cozy Mountain Cabin: ${ROOM_TYPE_COUNTS['Cozy Mountain Cabin']} physical room`);

    // Verify the changes
    console.log('\n✅ Verifying changes...\n');
    const updatedRooms = await Room.find({}).select('name totalRooms');
    updatedRooms.forEach(room => {
      console.log(`   ${room.name}: ${room.totalRooms} room(s)`);
    });

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('👋 Migration script finished\n');
    process.exit(0);
  }
}

// Check if Room names in database match our configuration
async function checkRoomNames() {
  try {
    await mongoose.connect(MONGODB_URI);
    const rooms = await Room.find({}).select('name');
    
    console.log('🔍 Current room names in database:');
    rooms.forEach((room, index) => {
      console.log(`   ${index + 1}. "${room.name}"`);
    });
    
    console.log('\n🔍 Expected room names in migration script:');
    Object.keys(ROOM_TYPE_COUNTS).forEach((name, index) => {
      console.log(`   ${index + 1}. "${name}"`);
    });
    
    const dbRoomNames = rooms.map(r => r.name);
    const configRoomNames = Object.keys(ROOM_TYPE_COUNTS);
    
    const missingInConfig = dbRoomNames.filter(name => !configRoomNames.includes(name));
    const missingInDb = configRoomNames.filter(name => !dbRoomNames.includes(name));
    
    if (missingInConfig.length > 0) {
      console.log('\n⚠️  Rooms in database but NOT in migration config:');
      missingInConfig.forEach(name => console.log(`   - "${name}"`));
    }
    
    if (missingInDb.length > 0) {
      console.log('\n⚠️  Rooms in migration config but NOT in database:');
      missingInDb.forEach(name => console.log(`   - "${name}"`));
    }
    
    if (missingInConfig.length === 0 && missingInDb.length === 0) {
      console.log('\n✅ All room names match! Safe to proceed with migration.\n');
    } else {
      console.log('\n⚠️  Room name mismatch detected! Please update ROOM_TYPE_COUNTS in the script.\n');
    }
    
    await mongoose.disconnect();
  } catch (error: any) {
    console.error('Error checking room names:', error.message);
    await mongoose.disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--check') || args.includes('-c')) {
  console.log('🔍 Checking room names...\n');
  checkRoomNames();
} else {
  console.log('💡 Tip: Run with --check flag to verify room names first\n');
  console.log('   Example: npx ts-node src/scripts/updateRoomsTotalCount.ts --check\n');
  migrateRooms();
}