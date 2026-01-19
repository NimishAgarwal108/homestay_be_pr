import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem {
  name: string;
  description?: string;
}

export interface IMenuCategory {
  category: string;
  items: IMenuItem[];
  order: number;
}

export interface IMenu extends Document {
  categories: IMenuCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String }
});

const MenuCategorySchema = new Schema({
  category: { type: String, required: true },
  items: [MenuItemSchema],
  order: { type: Number, default: 0 }
});

const MenuSchema = new Schema<IMenu>(
  {
    categories: [MenuCategorySchema]
  },
  {
    timestamps: true
  }
);

// Ensure only one menu document exists
MenuSchema.index({}, { unique: true });

export default mongoose.models.Menu || mongoose.model<IMenu>('Menu', MenuSchema);