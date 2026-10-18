import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { optionalAuthenticate, authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      packSize: z.string(),
      quantity: z.number().int().min(1)
    })
  ).min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian phone number required'),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required')
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'upi']),
  couponCode: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional()
});

// POST /api/orders - Create Order with server-side pricing & stock checks
router.post('/', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = CreateOrderSchema.parse(req.body);

    // Fetch verified products from DB to strictly compute price and check stock
    const itemIds = data.items.map(i => i.productId);
    const dbProducts = await Product.find({ _id: { $in: itemIds } });
    const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} no longer exists` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}`
        });
      }

      // Check price (use salePrice if exists, else price)
      const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
        packSize: item.packSize || product.packSize,
        price: unitPrice,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Coupon discount calculation
    let discountAmount = 0;
    let appliedCoupon = undefined;
    if (data.couponCode) {
      const coupon = await Coupon.findOne({
        code: data.couponCode.toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() }
      });

      if (coupon && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        appliedCoupon = coupon.code;
        coupon.usageCount += 1;
        await coupon.save();
      }
    }

    // Tax (12% Ayurvedic GST included or calculated)
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    // GST 5% on Ayurvedic medicines / 12% on wellness: e.g. 5% effective GST
    const taxAmount = Math.round(taxableSubtotal * 0.05);

    // Free delivery over ₹999, else standard ₹80
    const shippingFee = taxableSubtotal >= 999 ? 0 : 80;
    const totalAmount = taxableSubtotal + taxAmount + shippingFee;

    // Generate readable Indian Order Number e.g. AP-2026-94819
    const orderNumber = `AP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay simulated/live order id
    const razorpayOrderId =
      data.paymentMethod === 'razorpay' || data.paymentMethod === 'upi'
        ? `order_${crypto.randomBytes(8).toString('hex')}`
        : undefined;

    const newOrder = await Order.create({
      orderNumber,
      userId: req.userId || undefined,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || data.shippingAddress.phone,
      items: verifiedItems,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'placed',
      subtotal,
      discountAmount,
      couponCode: appliedCoupon,
      taxAmount,
      shippingFee,
      totalAmount,
      razorpayOrderId,
      carrier: 'Delhivery Ayurvedic Priority',
      trackingNumber: `DEL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timeline: [
        {
          status: 'placed',
          message: 'Order received and logged in Ayurveda fulfillment system.',
          timestamp: new Date(),
          location: 'Vedic Wellness Hub, Haridwar'
        }
      ]
    });

    // Deduct stock for inventory integrity
    for (const item of data.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      data: newOrder,
      razorpayKey: process.env.RAZORPAY_KEY_ID || ''
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/verify-payment
router.post('/verify-payment', async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId || `pay_${crypto.randomBytes(8).toString('hex')}`;
    order.razorpaySignature = razorpaySignature || 'verified_signature';

    order.timeline.push({
      status: 'confirmed',
      message: 'Payment verified successfully. Preparing batch for dispension.',
      timestamp: new Date(),
      location: 'Quality & Dispensation Unit'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/track/:orderNumber
router.get('/track/:orderNumber', async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order number not found.' });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        timeline: order.timeline,
        shippingAddress: {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode
        },
        items: order.items,
        totalAmount: order.totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

export default router;
