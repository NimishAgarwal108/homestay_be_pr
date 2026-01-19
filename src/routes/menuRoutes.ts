import express from 'express';
import { 
  getMenu, 
  updateMenu, 
  addCategory, 
  deleteCategory,
  addMenuItem,
  deleteMenuItem 
} from '../controllers/menuController';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Public route - anyone can view menu
router.get('/menu', getMenu);

// Admin routes - require authentication
router.put('/admin/menu', adminAuth, updateMenu);
router.post('/admin/menu/category', adminAuth, addCategory);
router.delete('/admin/menu/category/:categoryId', adminAuth, deleteCategory);

// New routes for adding/removing individual items
router.post('/admin/menu/item', adminAuth, addMenuItem);
router.delete('/admin/menu/item', adminAuth, deleteMenuItem);

export default router;