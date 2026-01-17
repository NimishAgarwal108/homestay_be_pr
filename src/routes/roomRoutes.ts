import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  toggleRoomAvailability,
  getRoomAvailability,
  checkDateAvailability
} from '../controllers/roomController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * IMPORTANT: Specific routes MUST come before generic /:id routes
 * Otherwise Express will treat "availability" as an ID parameter
 */

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms (with optional filters)
 * @access  Public
 */
router.get('/', getAllRooms);

/**
 * @route   POST /api/rooms
 * @desc    Create new room
 * @access  Private (Admin only)
 */
router.post('/', protect, authorize('admin'), createRoom);

/**
 * 🆕 @route   GET /api/rooms/:id/availability-calendar
 * @desc    Get room availability calendar (30 days)
 * @access  Public
 */
router.get('/:id/availability-calendar', getRoomAvailability);

/**
 * 🆕 @route   GET /api/rooms/:id/check-dates
 * @desc    Check if specific dates are available
 * @access  Public
 */
router.get('/:id/check-dates', checkDateAvailability);

/**
 * @route   PATCH /api/rooms/:id/toggle-availability
 * @desc    Toggle room availability (enable/disable)
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-availability', protect, authorize('admin'), toggleRoomAvailability);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get single room by ID
 * @access  Public
 */
router.get('/:id', getRoomById);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), updateRoom);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete room
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), deleteRoom);

export default router;