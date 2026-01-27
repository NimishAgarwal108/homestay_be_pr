// src/controllers/room/getUnavailableDatesByRoomType.ts
import { Request, Response } from 'express';
import Room from '../../models/Room';
import Booking from '../../models/Booking';

/**
 * @desc    Get unavailable dates for a specific room type
 * @route   GET /api/rooms/:id/unavailable-dates
 * @access  Public
 * @query   startDate (optional) - Starting date for the range
 * @query   endDate (optional) - Ending date for the range
 */
export const getUnavailableDatesByRoomType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: roomId } = req.params;
    const { startDate, endDate } = req.query;

    // Find the room to get its type and totalRooms
    const room = await Room.findOne({ 
      _id: roomId,
      isAvailable: true 
    });
    
    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found or not available'
      });
      return;
    }

    // Set date range (default to next 90 days)
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate as string) : new Date(start);
    if (!endDate) {
      end.setDate(end.getDate() + 90); // 90 days by default
    }

    console.log(`🔍 Checking unavailable dates for room: ${room.name} (${room.type})`);
    console.log(`📅 Date range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);
    console.log(`🏠 Total rooms of this type: ${room.totalRooms}`);

    // Find all bookings for this room in the date range
    const bookings = await Booking.find({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    }).select('checkIn checkOut numberOfRooms status');

    console.log(`📋 Found ${bookings.length} bookings for this room`);

    // Count rooms booked per date
    const roomsBookedPerDate = new Map<string, number>();

    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const roomsBooked = booking.numberOfRooms || 1;
      
      const currentDate = new Date(checkIn);
      
      // Mark all dates in the booking range
      while (currentDate < checkOut) {
        const dateString = currentDate.toISOString().split('T')[0];
        const currentBooked = roomsBookedPerDate.get(dateString) || 0;
        roomsBookedPerDate.set(dateString, currentBooked + roomsBooked);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Find dates where ALL rooms are booked
    const unavailableDates: string[] = [];
    
    for (const [dateString, bookedCount] of roomsBookedPerDate.entries()) {
      if (bookedCount >= room.totalRooms) {
        unavailableDates.push(dateString);
      }
    }

    console.log(`🔴 Unavailable dates (all ${room.totalRooms} rooms booked):`, unavailableDates);

    res.status(200).json({
      success: true,
      roomId,
      roomName: room.name,
      roomType: room.type,
      totalRooms: room.totalRooms,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      unavailableDates,
      count: unavailableDates.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching unavailable dates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching unavailable dates'
    });
  }
};