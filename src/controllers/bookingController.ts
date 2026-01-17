import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Room from '../models/Room';
import { sendBookingNotificationToAdmin } from '../utils/emailService';

/**
 * @desc    Get all bookings
 * @route   GET /api/bookings
 * @access  Private (Admin only)
 */
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate, roomId } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (roomId) {
      query.room = roomId;
    }

    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) {
        query.checkIn.$gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        query.checkIn.$lte = new Date(endDate + 'T00:00:00.000Z');
      }
    }

    const bookings = await Booking.find(query)
      .populate('room', 'name type price images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error: any) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room', 'name type price images amenities')
      .populate('user', 'name email phone');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error: any) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Create new booking (with availability check and admin email notification)
 * @route   POST /api/bookings
 * @access  Public/Private
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      room: roomId,
      checkIn,
      checkOut,
      guests,
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

    // Validate required fields
    if (!roomId || !checkIn || !checkOut || !guests || !guestName || !guestEmail || !guestPhone) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
      return;
    }

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }

    if (!room.isAvailable) {
      res.status(400).json({
        success: false,
        message: 'This room is currently unavailable'
      });
      return;
    }

    // Parse dates as UTC midnight to avoid timezone issues
    const checkInDate = new Date(checkIn + 'T00:00:00.000Z');
    const checkOutDate = new Date(checkOut + 'T00:00:00.000Z');

    // Validate dates
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
      return;
    }

    // Check for overlapping bookings (includes checkout date blocking)
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lte: checkOutDate },
      checkOut: { $gte: checkInDate }
    });

    if (conflictingBooking) {
      console.log('❌ Conflicting booking found:', conflictingBooking._id);
      res.status(400).json({
        success: false,
        message: 'Room is not available for selected dates. Please choose different dates.',
        conflictingBooking: {
          checkIn: conflictingBooking.checkIn,
          checkOut: conflictingBooking.checkOut,
          bookingReference: conflictingBooking.bookingReference
        }
      });
      return;
    }

    // Create booking with auto-confirmation
    const booking = await Booking.create({
      user: (req as any).user?.id, // If user is authenticated
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: guestPhone.trim(),
      nights: Number(nights),
      pricePerNight: Number(pricePerNight),
      totalPrice: Number(totalPrice),
      taxAmount: Number(taxAmount) || 0,
      discountAmount: Number(discountAmount) || 0,
      paymentStatus: paymentStatus || 'pending',
      status: 'confirmed', // Auto-confirm bookings
      specialRequests: specialRequests?.trim()
    });

    console.log('✅ Booking created:', booking.bookingReference);

    // Populate room details
    await booking.populate('room', 'name type price images');

    // Send email notification to admin ONLY
    try {
      await sendBookingNotificationToAdmin({
        bookingReference: booking.bookingReference,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        roomName: (booking.room as any).name,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        nights: booking.nights,
        totalPrice: booking.totalPrice,
        specialRequests: booking.specialRequests
      });
      console.log('📧 Admin notification email sent');
    } catch (emailError) {
      console.error('❌ Email notification failed:', emailError);
      // Don't fail the booking if email fails - just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking
    });

  } catch (error: any) {
    console.error('❌ Create booking error:', error);

    // Handle validation errors
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

/**
 * @desc    Update booking
 * @route   PUT /api/bookings/:id
 * @access  Private (Admin only)
 */
export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    // If updating dates, check for conflicts
    if (req.body.checkIn || req.body.checkOut) {
      const newCheckIn = req.body.checkIn 
        ? new Date(req.body.checkIn + 'T00:00:00.000Z') 
        : booking.checkIn;
      
      const newCheckOut = req.body.checkOut 
        ? new Date(req.body.checkOut + 'T00:00:00.000Z') 
        : booking.checkOut;

      const conflictingBooking = await Booking.findOne({
        _id: { $ne: req.params.id },
        room: booking.room,
        status: { $in: ['pending', 'confirmed'] },
        checkIn: { $lte: newCheckOut },
        checkOut: { $gte: newCheckIn }
      });

      if (conflictingBooking) {
        res.status(400).json({
          success: false,
          message: 'Room is not available for selected dates'
        });
        return;
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('room', 'name type price');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      booking: updatedBooking
    });

  } catch (error: any) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    if (!booking.canBeCancelled()) {
      res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled (must be at least 24 hours before check-in)'
      });
      return;
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = (req as any).user?.id;
    booking.cancellationReason = req.body.reason;

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Delete booking
 * @route   DELETE /api/bookings/:id
 * @access  Private (Admin only)
 */
export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Get my bookings (for authenticated users)
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
export const getMyBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
      return;
    }

    const bookings = await Booking.find({ user: userId })
      .populate('room', 'name type price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error: any) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Check room availability and calculate pricing
 * @route   POST /api/bookings/check-availability
 * @access  Public
 */
export const checkAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId, checkIn, checkOut, guests } = req.body;

    // Validate required fields
    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        message: 'Please provide roomId, checkIn, and checkOut dates'
      });
      return;
    }

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found'
      });
      return;
    }

    // Check if room is generally available
    if (!room.isAvailable) {
      res.status(200).json({
        success: true,
        available: false,
        message: 'This room is currently disabled',
        room: {
          id: room._id,
          name: room.name,
          type: room.type
        }
      });
      return;
    }

    // Validate guest capacity (if provided)
    if (guests && Number(guests) > room.capacity) {
      res.status(200).json({
        success: true,
        available: false,
        message: `This room can accommodate maximum ${room.capacity} guests`,
        room: {
          id: room._id,
          name: room.name,
          capacity: room.capacity
        }
      });
      return;
    }

    // Parse dates as UTC midnight to avoid timezone issues
    const checkInDate = new Date(checkIn + 'T00:00:00.000Z');
    const checkOutDate = new Date(checkOut + 'T00:00:00.000Z');

    // Validate dates
    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
      return;
    }

    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
      return;
    }

    // Check for overlapping bookings (includes checkout date blocking)
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lte: checkOutDate },
      checkOut: { $gte: checkInDate }
    });

    if (conflictingBooking) {
      res.status(200).json({
        success: true,
        available: false,
        message: 'Room is not available for selected dates',
        conflictingBooking: {
          checkIn: conflictingBooking.checkIn,
          checkOut: conflictingBooking.checkOut,
          bookingReference: conflictingBooking.bookingReference
        },
        room: {
          id: room._id,
          name: room.name,
          type: room.type
        }
      });
      return;
    }

    // Calculate pricing
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const pricePerNight = room.price;
    const basePrice = pricePerNight * nights;
    const taxAmount = Math.round(basePrice * 0.12); // 12% tax
    const totalPrice = basePrice + taxAmount;

    // Room is available - return availability with pricing
    res.status(200).json({
      success: true,
      available: true,
      message: 'Room is available for selected dates',
      room: {
        id: room._id,
        name: room.name,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        images: room.images?.[0] || null
      },
      pricing: {
        nights,
        pricePerNight,
        basePrice,
        taxAmount,
        totalPrice
      },
      dates: {
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0]
      }
    });

  } catch (error: any) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking availability'
    });
  }
};