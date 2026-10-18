import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: String, default: 'Dr. Vaidya Ramanathan (BAMS)' },
    readTime: { type: String, default: '5 min read' },
    image: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
