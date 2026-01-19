import { Request, Response } from 'express';
import Menu, { IMenuCategory, IMenuItem } from '../models/Menu';

// Get menu (public)
export const getMenu = async (req: Request, res: Response) => {
  try {
    let menu = await Menu.findOne();
    
    // If no menu exists, create default menu with only Breakfast, Lunch, Dinner
    if (!menu) {
      menu = await Menu.create({
        categories: [
          {
            category: "Breakfast",
            order: 1,
            items: [
              { name: "Aloo Paratha with Curd", description: "Traditional stuffed flatbread" },
              { name: "Poha & Tea", description: "Flattened rice with spices" },
              { name: "Upma with Chutney", description: "Semolina porridge" },
              { name: "Fresh Fruits & Juice", description: "Seasonal fresh fruits" }
            ]
          },
          {
            category: "Lunch",
            order: 2,
            items: [
              { name: "Dal Tadka with Rice", description: "Lentil curry with steamed rice" },
              { name: "Rajma Chawal", description: "Kidney beans with rice" },
              { name: "Veg Thali", description: "Complete vegetarian platter" },
              { name: "Paneer Curry with Roti", description: "Cottage cheese curry" }
            ]
          },
          {
            category: "Dinner",
            order: 3,
            items: [
              { name: "Kadhi Pakora", description: "Yogurt curry with fritters" },
              { name: "Mix Veg with Roti", description: "Mixed vegetable curry" },
              { name: "Khichdi with Papad", description: "Rice and lentil comfort food" },
              { name: "Local Mountain Cuisine", description: "Traditional Uttarakhand dishes" }
            ]
          }
        ]
      });
    }
    
    res.json({
      success: true,
      data: menu
    });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch menu'
    });
  }
};

// Update menu (admin only)
export const updateMenu = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: 'Categories array is required'
      });
    }
    
    let menu = await Menu.findOne();
    
    if (!menu) {
      menu = await Menu.create({ categories });
    } else {
      menu.categories = categories;
      await menu.save();
    }
    
    res.json({
      success: true,
      data: menu,
      message: 'Menu updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update menu'
    });
  }
};

// Add menu item to specific category (admin only)
export const addMenuItem = async (req: Request, res: Response) => {
  try {
    const { categoryName, itemName, itemDescription } = req.body;
    
    if (!categoryName || !itemName) {
      return res.status(400).json({
        success: false,
        error: 'Category name and item name are required'
      });
    }
    
    let menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found. Please create menu first.'
      });
    }
    
    // Find the category with proper typing
    const category = menu.categories.find((cat: IMenuCategory) => cat.category === categoryName);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category "${categoryName}" not found`
      });
    }
    
    // Add item to category
    category.items.push({ 
      name: itemName, 
      description: itemDescription 
    });
    
    await menu.save();
    
    res.json({
      success: true,
      data: menu,
      message: `Item added to ${categoryName} successfully`
    });
  } catch (error: any) {
    console.error('Error adding menu item:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add menu item'
    });
  }
};

// Delete menu item from specific category (admin only)
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { categoryName, itemName } = req.body;
    
    if (!categoryName || !itemName) {
      return res.status(400).json({
        success: false,
        error: 'Category name and item name are required'
      });
    }
    
    let menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    // Find the category with proper typing
    const category = menu.categories.find((cat: IMenuCategory) => cat.category === categoryName);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category "${categoryName}" not found`
      });
    }
    
    // Remove item from category with proper typing
    const itemIndex = category.items.findIndex((item: IMenuItem) => item.name === itemName);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Item "${itemName}" not found in ${categoryName}`
      });
    }
    
    category.items.splice(itemIndex, 1);
    await menu.save();
    
    res.json({
      success: true,
      data: menu,
      message: `Item removed from ${categoryName} successfully`
    });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete menu item'
    });
  }
};

// Add menu category (admin only) - Keep for flexibility
export const addCategory = async (req: Request, res: Response) => {
  try {
    const { category, items, order } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    let menu = await Menu.findOne();
    
    if (!menu) {
      menu = await Menu.create({
        categories: [{ category, items: items || [], order: order || 0 }]
      });
    } else {
      // Check if category already exists with proper typing
      const exists = menu.categories.some((cat: IMenuCategory) => cat.category === category);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: `Category "${category}" already exists`
        });
      }
      
      menu.categories.push({ category, items: items || [], order: order || menu.categories.length });
      await menu.save();
    }
    
    res.json({
      success: true,
      data: menu,
      message: 'Category added successfully'
    });
  } catch (error: any) {
    console.error('Error adding category:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add category'
    });
  }
};

// Delete menu category (admin only)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    const menu = await Menu.findOne();
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    const initialLength = menu.categories.length;
    
    // Filter categories with proper typing
    menu.categories = menu.categories.filter(
      (cat: IMenuCategory & { _id?: any }) => cat._id?.toString() !== categoryId
    );
    
    if (menu.categories.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    await menu.save();
    
    res.json({
      success: true,
      data: menu,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete category'
    });
  }
};