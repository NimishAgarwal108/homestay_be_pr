import { Request, Response } from 'express';
import Room from '../../models/Room';
import Booking from '../../models/Booking';

/**
 * @desc    Get room availability calendar (30 days) with available room count
 * @route   GET /api/rooms/:id/availability-calendar
 * @access  Public
 */
export const getRoomAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: roomId } = req.params;
    const { startDate } = req.query;

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

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    const bookings = await Booking.find({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    }).select('checkIn checkOut status bookingReference');

    console.log(`📅 Found ${bookings.length} bookings for room ${roomId}`);

    // ✅ FIXED: Count number of ROOMS booked, not just bookings
    const bookingsPerDate = new Map<string, number>();

    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const roomsBooked = booking.numberOfRooms || 1; // ✅ NEW: Get number of rooms in this booking
      
      const currentDate = new Date(checkIn);
      
      while (currentDate < checkOut) {
        const dateString = currentDate.toISOString().split('T')[0];
        const count = (bookingsPerDate.get(dateString) || 0) + roomsBooked; // ✅ Add rooms, not just 1
        bookingsPerDate.set(dateString, count);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log(`🔴 Dates with bookings:`, Array.from(bookingsPerDate.entries()));

    const availability = [];
    const calendarDate = new Date(start);
    
    while (calendarDate <= end) {
      const dateString = calendarDate.toISOString().split('T')[0];
      const bookedCount = bookingsPerDate.get(dateString) || 0;
      const availableCount = room.totalRooms - bookedCount;
      
      availability.push({
        date: dateString,
        available: availableCount > 0,
        availableRooms: availableCount, // ✅ NEW: Show how many rooms available
        totalRooms: room.totalRooms // ✅ NEW: Show total rooms
      });
      calendarDate.setDate(calendarDate.getDate() + 1);
    }

    console.log(`📊 Generated ${availability.length} days of availability`);

    res.status(200).json({
      success: true,
      roomId,
      roomName: room.name,
      totalRooms: room.totalRooms, // ✅ NEW
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      availability
    });

  } catch (error: any) {
    console.error('❌ Error fetching room availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching room availability'
    });
  }
};

/**
 * @desc    Check if specific dates are available for a room (with available room count)
 * @route   GET /api/rooms/:id/check-dates
 * @access  Public
 */
export const checkDateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: roomId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    console.log('🔍 Checking availability:', { roomId, checkInDate, checkOutDate });

    if (!checkInDate || !checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
      return;
    }

    const room = await Room.findOne({ 
      _id: roomId,
      isAvailable: true 
    });
    
    if (!room) {
      console.log('❌ Room not found or not available:', roomId);
      res.status(404).json({
        success: false,
        message: 'Room not found or not available'
      });
      return;
    }

    console.log('✅ Room found:', {
      name: room.name,
      totalRooms: room.totalRooms,
      _id: room._id
    });

    const checkInStr = checkInDate as string;
    const checkOutStr = checkOutDate as string;

    console.log('📅 Date strings:', {
      checkIn: checkInStr,
      checkOut: checkOutStr
    });

    if (checkOutStr <= checkInStr) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
      return;
    }

    const checkInDateObj = new Date(checkInStr + 'T00:00:00.000Z');
    const checkOutDateObj = new Date(checkOutStr + 'T00:00:00.000Z');

    // ✅ NEW: Count how many rooms are booked for this date range
    const bookingsInRange = await Booking.find({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: checkOutDateObj },
      checkOut: { $gt: checkInDateObj }
    });

    console.log(`📋 Found ${bookingsInRange.length} bookings in range`);

    // ✅ FIXED: Count number of ROOMS booked, not just bookings
    const bookingsPerDate = new Map<string, number>();
    
    bookingsInRange.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const roomsBooked = booking.numberOfRooms || 1; // ✅ NEW: Get number of rooms in this booking
      
      const currentDate = new Date(checkIn);
      
      while (currentDate < checkOut) {
        const dateString = currentDate.toISOString().split('T')[0];
        const count = (bookingsPerDate.get(dateString) || 0) + roomsBooked; // ✅ Add rooms, not just 1
        bookingsPerDate.set(dateString, count);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // ✅ FIXED: Handle empty bookingsPerDate correctly
    const maxBookedRooms = bookingsPerDate.size > 0 
      ? Math.max(...Array.from(bookingsPerDate.values())) 
      : 0;
    const availableRooms = Math.max(0, room.totalRooms - maxBookedRooms); // Ensure never negative

    console.log('📊 Availability calculation:', {
      roomName: room.name,
      totalRooms: room.totalRooms,
      maxBookedRooms,
      availableRooms,
      bookingsInRange: bookingsInRange.length,
      datesWithBookings: Array.from(bookingsPerDate.entries())
    });

    const isAvailable = availableRooms > 0;

    const responseData = {
      available: isAvailable,
      availableRooms, // ✅ How many rooms are available
      totalRooms: room.totalRooms, // ✅ Total rooms
      bookedRooms: maxBookedRooms, // ✅ How many are booked
      message: isAvailable 
        ? `${availableRooms} of ${room.totalRooms} rooms available for selected dates` 
        : 'No rooms available for selected dates',
      conflictingBooking: bookingsInRange.length > 0 ? {
        checkIn: bookingsInRange[0].checkIn,
        checkOut: bookingsInRange[0].checkOut,
        status: bookingsInRange[0].status
      } : null
    };

    console.log('✅ Sending response:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Error checking date availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking availability'
    });
  }
};