import { Request, Response } from 'express';
import Room from '../models/Room';

const ROOM_TYPE_COUNTS: Record<string, number> = {
  'Family Suite': 3,
  'Deluxe Mountain View': 2,
  'Cozy Mountain Cabin': 1
};

export const migrateRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({});
    
    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No rooms found in database'
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const room of rooms) {
      const roomName = room.name;
      const currentTotalRooms = room.totalRooms;
      const newTotalRooms = ROOM_TYPE_COUNTS[roomName] || 1;

      if (currentTotalRooms === newTotalRooms) {
        skippedCount++;
        continue;
      }

      room.totalRooms = newTotalRooms;
      await room.save();
      updatedCount++;
    }

    // Verify the changes
    const updatedRooms = await Room.find({}).select('name totalRooms');

    res.status(200).json({
      success: true,
      message: '🎉 Room migration completed successfully!',
      data: {
        totalRooms: rooms.length,
        updated: updatedCount,
        skipped: skippedCount,
        rooms: updatedRooms.map(r => ({ name: r.name, totalRooms: r.totalRooms }))
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
};