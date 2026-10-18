import { Router } from 'express';
import { z } from 'zod';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { optionalAuthenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const ReviewSchema = z.object({
  productId: z.string(),
  userName: z.string().min(2),
  rating: z.number().min(1).max(5),
  title: z.string().min(2),
  comment: z.string().min(5)
});

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post('/', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = ReviewSchema.parse(req.body);

    const review = await Review.create({
      productId: data.productId,
      userId: req.userId || undefined,
      userName: req.user ? req.user.name : data.userName,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      verifiedPurchase: true,
      status: 'approved'
    });

    // Recompute product rating
    const productReviews = await Review.find({ productId: data.productId, status: 'approved' });
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    await Product.findByIdAndUpdate(data.productId, {
      rating: Number(avgRating.toFixed(1)),
      reviewCount: productReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
});

export default router;
