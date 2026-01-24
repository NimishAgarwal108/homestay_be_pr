import Joi from 'joi';

export const createBookingSchema = Joi.object({
  room: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Room is required',
      'string.pattern.base': 'Invalid room ID format',
      'any.required': 'Room is required'
    }),

  checkIn: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Check-in must be a valid date',
      'date.min': 'Check-in date cannot be in the past',
      'any.required': 'Check-in date is required'
    }),

  checkOut: Joi.date()
    .iso()
    .greater(Joi.ref('checkIn'))
    .required()
    .messages({
      'date.base': 'Check-out must be a valid date',
      'date.greater': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    }),

  guests: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.base': 'Guests must be a number',
      'number.min': 'At least 1 guest is required',
      'number.max': 'Maximum 20 guests allowed',
      'any.required': 'Number of guests is required'
    }),

  numberOfRooms: Joi.number() // ✅ ADDED
    .integer()
    .min(1)
    .max(6)
    .required()
    .messages({
      'number.base': 'Number of rooms must be a number',
      'number.min': 'At least 1 room is required',
      'number.max': 'Maximum 6 rooms allowed',
      'any.required': 'Number of rooms is required'
    }),

  guestName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Guest name is required',
      'string.min': 'Guest name must be at least 2 characters',
      'string.max': 'Guest name cannot exceed 100 characters',
      'any.required': 'Guest name is required'
    }),

  guestEmail: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Guest email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Guest email is required'
    }),

  guestPhone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.empty': 'Guest phone is required',
      'string.pattern.base': 'Please enter a valid phone number (10-15 digits)',
      'any.required': 'Guest phone is required'
    }),

  nights: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Nights must be a number',
      'number.min': 'Booking must be for at least 1 night',
      'any.required': 'Number of nights is required'
    }),

  pricePerNight: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Price per night must be a number',
      'number.min': 'Price per night cannot be negative',
      'any.required': 'Price per night is required'
    }),

  totalPrice: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Total price must be a number',
      'number.min': 'Total price cannot be negative',
      'any.required': 'Total price is required'
    }),

  taxAmount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Tax amount must be a number',
      'number.min': 'Tax amount cannot be negative'
    }),

  discountAmount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Discount amount must be a number',
      'number.min': 'Discount amount cannot be negative'
    }),

  specialRequests: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Special requests cannot exceed 1000 characters'
    }),

  paymentStatus: Joi.string()
    .valid('pending', 'paid', 'refunded')
    .default('pending')
    .messages({
      'any.only': 'Payment status must be pending, paid, or refunded'
    }),

  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .default('confirmed')
    .messages({
      'any.only': 'Status must be pending, confirmed, cancelled, or completed'
    })
});

export const updateBookingSchema = Joi.object({
  checkIn: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Check-in must be a valid date'
    }),

  checkOut: Joi.date()
    .iso()
    .when('checkIn', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('checkIn')),
      otherwise: Joi.date()
    })
    .optional()
    .messages({
      'date.base': 'Check-out must be a valid date',
      'date.greater': 'Check-out date must be after check-in date'
    }),

  guests: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'number.base': 'Guests must be a number',
      'number.min': 'At least 1 guest is required',
      'number.max': 'Maximum 20 guests allowed'
    }),

  numberOfRooms: Joi.number() // ✅ ADDED
    .integer()
    .min(1)
    .max(6)
    .optional()
    .messages({
      'number.base': 'Number of rooms must be a number',
      'number.min': 'At least 1 room is required',
      'number.max': 'Maximum 6 rooms allowed'
    }),

  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed')
    .optional()
    .messages({
      'any.only': 'Status must be pending, confirmed, cancelled, or completed'
    }),

  paymentStatus: Joi.string()
    .valid('pending', 'paid', 'refunded')
    .optional()
    .messages({
      'any.only': 'Payment status must be pending, paid, or refunded'
    }),

  specialRequests: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Special requests cannot exceed 1000 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const checkAvailabilitySchema = Joi.object({
  roomId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Room ID is required',
      'string.pattern.base': 'Invalid room ID format',
      'any.required': 'Room ID is required'
    }),

  checkIn: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Check-in must be a valid date',
      'date.min': 'Check-in date cannot be in the past',
      'any.required': 'Check-in date is required'
    }),

  checkOut: Joi.date()
    .iso()
    .greater(Joi.ref('checkIn'))
    .required()
    .messages({
      'date.base': 'Check-out must be a valid date',
      'date.greater': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    }),

  excludeBookingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid booking ID format'
    })
});