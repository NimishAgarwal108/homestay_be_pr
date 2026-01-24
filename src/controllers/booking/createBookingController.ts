import { Request, Response } from 'express';
import { BookingValidationService } from '../../services/bookingValidationService';
import { BookingService } from '../../services/bookingService';

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      room: roomId,
      checkIn,
      checkOut,
      guests,
      numberOfRooms, // ✅ ADDED
      guestName,
      guestEmail,
      guestPhone,
      nights,
      pricePerNight,
      totalPrice,
      taxAmount,
      discountAmount,
      paymentStatus,
      status,
      specialRequests
    } = req.body;

    console.log('📥 Received booking request:', req.body);

    const roomValidation = await BookingValidationService.validateRoom(roomId);
    if (!roomValidation.isValid) {
      BookingValidationService.sendValidationError(res, roomValidation);
      return;
    }

    const room = roomValidation.room;

    const capacityValidation = BookingValidationService.validateGuestCapacity(
      guests,
      room.capacity
    );
    if (!capacityValidation.isValid) {
      BookingValidationService.sendValidationError(res, capacityValidation);
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictCheck = await BookingValidationService.checkBookingConflict({
      roomId,
      checkInDate,
      checkOutDate
    });

    if (conflictCheck.hasConflict) {
      res.status(400).json({
        success: false,
        message: 'Room is not available for selected dates. Please choose different dates.',
        conflictingBooking: {
          checkIn: conflictCheck.conflictingBooking.checkIn,
          checkOut: conflictCheck.conflictingBooking.checkOut,
          bookingReference: conflictCheck.conflictingBooking.bookingReference
        }
      });
      return;
    }

    const booking = await BookingService.createBooking({
      user: (req as any).user?.id,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      numberOfRooms, // ✅ ADDED
      guestName,
      guestEmail,
      guestPhone,
      nights,
      pricePerNight,
      totalPrice,
      taxAmount,
      discountAmount,
      paymentStatus,
      status: 'confirmed',
      specialRequests
    });

    await BookingService.sendBookingNotification(booking, room);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking
    });

  } catch (error: any) {
    console.error('❌ Create booking error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};