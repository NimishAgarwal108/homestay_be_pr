import { Request, Response } from 'express';
import Room from '../../models/Room';
import Booking from '../../models/Booking';

/**
 * @desc    Get availability calendar for ALL rooms of a specific type
 * @route   GET /api/rooms/type/:roomType/availability-calendar
 * @access  Public
 */
export const getRoomTypeAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomType } = req.params;
    const { startDate } = req.query;

    console.log('🔍 Fetching availability for room type:', roomType);

    // Find all rooms of this type
    const rooms = await Room.find({ 
      name: roomType,
      isAvailable: true 
    });
    
    if (!rooms || rooms.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No rooms found for this type'
      });
      return;
    }

    // Get the first room to determine totalRooms (they should all have the same value)
    const totalRoomsAvailable = rooms[0].totalRooms;
    const roomIds = rooms.map(room => room._id);

    console.log(`📊 Found ${rooms.length} room document(s) of type "${roomType}" with totalRooms: ${totalRoomsAvailable}`);

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    // Get all bookings for ALL rooms of this type
    const bookings = await Booking.find({
      room: { $in: roomIds },
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    }).select('checkIn checkOut status bookingReference numberOfRooms room');

    console.log(`📅 Found ${bookings.length} bookings for room type "${roomType}"`);

    // Count total rooms booked per date
    const roomsBookedPerDate = new Map<string, number>();

    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      const currentDate = new Date(checkIn);
      
      // Iterate through each date in the booking range
      while (currentDate < checkOut) {
        const dateString = currentDate.toISOString().split('T')[0];
        const currentBooked = roomsBookedPerDate.get(dateString) || 0;
        // Add the number of rooms booked in this booking
        roomsBookedPerDate.set(dateString, currentBooked + booking.numberOfRooms);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log(`🔴 Dates with bookings:`, Array.from(roomsBookedPerDate.entries()));

    // Generate availability calendar
    const availability = [];
    const calendarDate = new Date(start);
    
    while (calendarDate <= end) {
      const dateString = calendarDate.toISOString().split('T')[0];
      const bookedCount = roomsBookedPerDate.get(dateString) || 0;
      const availableCount = Math.max(0, totalRoomsAvailable - bookedCount);
      
      availability.push({
        date: dateString,
        available: availableCount > 0,
        availableRooms: availableCount,
        totalRooms: totalRoomsAvailable,
        bookedRooms: bookedCount
      });
      
      calendarDate.setDate(calendarDate.getDate() + 1);
    }

    console.log(`📊 Generated ${availability.length} days of availability for "${roomType}"`);
    console.log(`✅ Sample dates:`, availability.slice(0, 5));

    res.status(200).json({
      success: true,
      roomType,
      totalRooms: totalRoomsAvailable,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      availability
    });

  } catch (error: any) {
    console.error('❌ Error fetching room type availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching room type availability'
    });
  }
};

/**
 * @desc    Check if specific dates are available for a room type
 * @route   GET /api/rooms/type/:roomType/check-dates
 * @access  Public
 */
export const checkRoomTypeDateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomType } = req.params;
    const { checkInDate, checkOutDate, numberOfRooms } = req.query;

    console.log('🔍 Checking availability for room type:', { roomType, checkInDate, checkOutDate, numberOfRooms });

    if (!checkInDate || !checkOutDate) {
      res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
      return;
    }

    // Find all rooms of this type
    const rooms = await Room.find({ 
      name: roomType,
      isAvailable: true 
    });
    
    if (!rooms || rooms.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No rooms found for this type'
      });
      return;
    }

    const totalRoomsAvailable = rooms[0].totalRooms;
    const roomIds = rooms.map(room => room._id);
    const requestedRooms = numberOfRooms ? parseInt(numberOfRooms as string) : 1;

    console.log(`✅ Found ${rooms.length} room document(s) of type "${roomType}" with totalRooms: ${totalRoomsAvailable}`);

    const checkInStr = checkInDate as string;
    const checkOutStr = checkOutDate as string;

    if (checkOutStr <= checkInStr) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
      return;
    }

    const checkInDateObj = new Date(checkInStr + 'T00:00:00.000Z');
    const checkOutDateObj = new Date(checkOutStr + 'T00:00:00.000Z');

    // Get all bookings for this room type in the date range
    const bookingsInRange = await Booking.find({
      room: { $in: roomIds },
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: checkOutDateObj },
      checkOut: { $gt: checkInDateObj }
    });

    console.log(`📋 Found ${bookingsInRange.length} bookings in range for room type "${roomType}"`);

    // Count rooms booked per date
    const roomsBookedPerDate = new Map<string, number>();
    
    bookingsInRange.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      const currentDate = new Date(checkIn);
      
      while (currentDate < checkOut) {
        const dateString = currentDate.toISOString().split('T')[0];
        const currentCount = roomsBookedPerDate.get(dateString) || 0;
        roomsBookedPerDate.set(dateString, currentCount + booking.numberOfRooms);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Find the maximum number of rooms booked on any single day
    const maxBookedRooms = roomsBookedPerDate.size > 0 
      ? Math.max(...Array.from(roomsBookedPerDate.values())) 
      : 0;
    
    const availableRooms = Math.max(0, totalRoomsAvailable - maxBookedRooms);
    const isAvailable = availableRooms >= requestedRooms;

    console.log('📊 Availability calculation:', {
      roomType,
      totalRooms: totalRoomsAvailable,
      maxBookedRooms,
      availableRooms,
      requestedRooms,
      isAvailable,
      datesWithBookings: Array.from(roomsBookedPerDate.entries())
    });

    const responseData = {
      available: isAvailable,
      availableRooms,
      totalRooms: totalRoomsAvailable,
      bookedRooms: maxBookedRooms,
      requestedRooms,
      message: isAvailable 
        ? `${availableRooms} of ${totalRoomsAvailable} rooms available for selected dates` 
        : `Only ${availableRooms} rooms available, but ${requestedRooms} requested`,
    };

    console.log('✅ Sending response:', responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Error checking room type date availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking availability'
    });
  }
};