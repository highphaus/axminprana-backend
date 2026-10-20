import mongoose, { Document, Schema } from 'mongoose';

export interface IEnquiry extends Document {
  name: string;
  company: string;
  email: string;
  phone: string;
  businessType: string;
  productInterest: string;
  quantity: string;
  message?: string;
  status: 'pending' | 'in_progress' | 'contacted' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    businessType: { type: String, default: 'Retailer / Brand' },
    productInterest: { type: String, required: true },
    quantity: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'contacted', 'resolved'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model<IEnquiry>('Enquiry', EnquirySchema);
