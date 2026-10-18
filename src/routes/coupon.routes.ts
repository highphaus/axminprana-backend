import { Router } from 'express';
import { Coupon } from '../models/Coupon.js';

const router = Router();

// POST /api/coupons/validate
router.post('/validate', async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (cartTotal && cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderValue}`
      });
    }

    let discount = 0;
    if (cartTotal) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round((cartTotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount: discount,
        minOrderValue: coupon.minOrderValue
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
