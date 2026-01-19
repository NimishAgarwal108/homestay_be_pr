// src/scripts/seedMenu.ts
// Run this script to initialize the menu in database
// Command: npx ts-node src/scripts/seedMenu.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu, { IMenuCategory, IMenuItem } from '../models/Menu';

dotenv.config();

const seedMenu = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homestay_db');
    console.log('✅ Connected to MongoDB');

    // Check if menu already exists
    const existingMenu = await Menu.findOne();
    
    if (existingMenu) {
      console.log('ℹ️  Menu already exists with', existingMenu.categories.length, 'categories');
      console.log('📋 Current categories:', existingMenu.categories.map((c: IMenuCategory) => c.category).join(', '));
      
      // Update to ensure only Breakfast, Lunch, Dinner exist
      const requiredCategories = ['Breakfast', 'Lunch', 'Dinner'];
      const existingCategoryNames = existingMenu.categories.map((c: IMenuCategory) => c.category);
      
      // Check if we have the required categories
      const hasAllRequired = requiredCategories.every((cat: string) => existingCategoryNames.includes(cat));
      
      if (!hasAllRequired) {
        console.log('⚠️  Missing some required categories. Updating...');
        
        existingMenu.categories = [
          {
            category: "Breakfast",
            order: 1,
            items: existingMenu.categories.find((c: IMenuCategory) => c.category === "Breakfast")?.items || [
              { name: "Aloo Paratha with Curd", description: "Traditional stuffed flatbread" },
              { name: "Poha & Tea", description: "Flattened rice with spices" },
              { name: "Upma with Chutney", description: "Semolina porridge" },
              { name: "Fresh Fruits & Juice", description: "Seasonal fresh fruits" }
            ]
          },
          {
            category: "Lunch",
            order: 2,
            items: existingMenu.categories.find((c: IMenuCategory) => c.category === "Lunch")?.items || [
              { name: "Dal Tadka with Rice", description: "Lentil curry with steamed rice" },
              { name: "Rajma Chawal", description: "Kidney beans with rice" },
              { name: "Veg Thali", description: "Complete vegetarian platter" },
              { name: "Paneer Curry with Roti", description: "Cottage cheese curry" }
            ]
          },
          {
            category: "Dinner",
            order: 3,
            items: existingMenu.categories.find((c: IMenuCategory) => c.category === "Dinner")?.items || [
              { name: "Kadhi Pakora", description: "Yogurt curry with fritters" },
              { name: "Mix Veg with Roti", description: "Mixed vegetable curry" },
              { name: "Khichdi with Papad", description: "Rice and lentil comfort food" },
              { name: "Local Mountain Cuisine", description: "Traditional Uttarakhand dishes" }
            ]
          }
        ];
        
        await existingMenu.save();
        console.log('✅ Menu updated with required categories!');
      } else {
        console.log('✅ All required categories present');
      }
      
    } else {
      // Create new menu
      console.log('📝 Creating new menu...');
      
      const newMenu = await Menu.create({
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
      
      console.log('✅ Menu created successfully!');
      console.log('📋 Categories:', newMenu.categories.map((c: IMenuCategory) => c.category).join(', '));
    }
    
    // Display final menu
    const finalMenu = await Menu.findOne();
    console.log('\n📖 Final Menu Structure:');
    finalMenu?.categories.forEach((cat: IMenuCategory) => {
      console.log(`\n  ${cat.category} (${cat.items.length} items):`);
      cat.items.forEach((item: IMenuItem, idx: number) => {
        console.log(`    ${idx + 1}. ${item.name}${item.description ? ' - ' + item.description : ''}`);
      });
    });
    
    console.log('\n✅ Menu seeding complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    process.exit(1);
  }
};

seedMenu();