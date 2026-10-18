import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  botanicalName: string;
  portion?: string;
  benefit: string;
}

export interface IProductVariant {
  sku: string;
  packSize: string; // e.g. "60 Capsules", "120 Capsules", "100ml", "200ml"
  price: number;
  salePrice?: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  subCategory?: string;
  brand: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  packSize: string;
  variants: IProductVariant[];
  format: 'Capsule' | 'Oil' | 'Churna' | 'Asava/Arishta' | 'Lepam' | 'Ghrita' | 'Herbal Tea' | 'Tablet';
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestseller: boolean;
  keyIngredients: IIngredient[];
  dosageInstructions: string;
  anupana?: string; // Carrier like warm water, ghee, honey, milk
  storageInstructions: string;
  warnings?: string;
  doshaBalancing: {
    vata: boolean;
    pitta: boolean;
    kapha: boolean;
    primaryDosha: 'Vata' | 'Pitta' | 'Kapha' | 'Tridoshic';
  };
  ayushLicenseNumber: string;
  batchNumber: string;
  expiryMonths: number;
  taxPercent: number; // 5% or 12% under Indian GST
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>({
  name: { type: String, required: true },
  botanicalName: { type: String, required: true },
  portion: { type: String },
  benefit: { type: String, required: true }
});

const VariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  packSize: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  stock: { type: Number, required: true, default: 0 }
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    brand: { type: String, required: true, default: 'Axmin Prana' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true, index: true },
    stock: { type: Number, required: true, min: 0, default: 10 },
    packSize: { type: String, required: true },
    variants: [VariantSchema],
    format: {
      type: String,
      enum: ['Capsule', 'Oil', 'Churna', 'Asava/Arishta', 'Lepam', 'Ghrita', 'Herbal Tea', 'Tablet'],
      default: 'Capsule'
    },
    images: [{ type: String, required: true }],
    thumbnail: { type: String, required: true },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestseller: { type: Boolean, default: false, index: true },
    keyIngredients: [IngredientSchema],
    dosageInstructions: { type: String, required: true },
    anupana: { type: String },
    storageInstructions: { type: String, default: 'Store in a cool, dry place away from direct sunlight.' },
    warnings: { type: String },
    doshaBalancing: {
      vata: { type: Boolean, default: false },
      pitta: { type: Boolean, default: false },
      kapha: { type: Boolean, default: false },
      primaryDosha: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Tridoshic'], default: 'Tridoshic' }
    },
    ayushLicenseNumber: { type: String, default: 'AYU/DL/IND-2024-8841' },
    batchNumber: { type: String, default: 'AP-2026-B01' },
    expiryMonths: { type: Number, default: 36 },
    taxPercent: { type: Number, default: 12 }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text', 'keyIngredients.name': 'text' });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ 'doshaBalancing.primaryDosha': 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
