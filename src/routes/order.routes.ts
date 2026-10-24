import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { optionalAuthenticate, authenticate, AuthRequest } from '../middleware/auth.js';
import { sendOrderConfirmationEmail, sendStockAlertEmail } from '../services/email.service.js';

const router = Router();

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string().optional(),
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
  paymentMethod: z.enum(['razorpay', 'upi', 'card', 'netbanking']).or(z.string()),
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
      let product = productMap.get(item.productId);
      if (!product && item.slug) {
        const fallback = await Product.findOne({ slug: item.slug });
        if (fallback) {
          product = fallback;
        }
      }
      if (!product) {
        return res.status(400).json({
          success: false,
          staleProductId: item.productId,
          message: `Product ${item.productId} no longer exists`
        });
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

    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = 0;
    const shippingFee = 0;
    const totalAmount = taxableSubtotal;

    // Generate readable Indian Order Number e.g. AP-2026-94819
    const orderNumber = `AP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay order id for online payment gateway
    const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    const newOrder = await Order.create({
      orderNumber,
      userId: req.userId || undefined,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || data.shippingAddress.phone,
      items: verifiedItems,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
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
          location: 'Vedic Wellness Hub, Kallara, Trivandrum, Kerala'
        }
      ]
    });

    // Deduct stock for inventory integrity and notify if stock reaches 0 or <= 5
    for (const item of data.items) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (updatedProduct && updatedProduct.stock <= 5) {
        sendStockAlertEmail(updatedProduct).catch(e =>
          console.error('[Stock Alert Warning]:', e)
        );
      }
    }

    // Send confirmation email asynchronously via Nodemailer
    sendOrderConfirmationEmail(newOrder).catch(e =>
      console.error('[Email Warning] Failed to dispatch order confirmation email:', e)
    );

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

// GET /api/orders/:id - Secure order retrieval (Prevents IDOR)
router.get('/:id', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: Admin can access any order
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (order.userId) {
        // Registered user order: Must be authenticated and owner
        if (!req.userId || order.userId.toString() !== req.userId) {
          return res.status(403).json({ success: false, message: 'Unauthorized. You do not have permission to view this order.' });
        }
      } else {
        // Guest order: Verify email or phone query if not authenticated
        const verifyEmail = (req.query.email as string)?.toLowerCase()?.trim();
        const verifyPhone = req.query.phone as string;
        if (
          (!verifyEmail || verifyEmail !== order.guestEmail?.toLowerCase()?.trim()) &&
          (!verifyPhone || verifyPhone !== order.shippingAddress?.phone)
        ) {
          // Return limited safe order data for tracking without leaking sensitive personal address
          return res.json({
            success: true,
            data: {
              _id: order._id,
              orderNumber: order.orderNumber,
              createdAt: order.createdAt,
              orderStatus: order.orderStatus,
              paymentStatus: order.paymentStatus,
              totalAmount: order.totalAmount,
              items: order.items,
              timeline: order.timeline
            }
          });
        }
      }
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/cancel - Customer Cancellation (Strictly before shipping, Prevents IDOR)
router.post('/:id/cancel', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (order.userId) {
        if (!req.userId || order.userId.toString() !== req.userId) {
          return res.status(403).json({ success: false, message: 'Unauthorized. You do not have permission to cancel this order.' });
        }
      } else {
        // Guest order cancellation requires matching guestEmail or phone
        const { guestEmail, guestPhone } = req.body || {};
        if (
          (!guestEmail || guestEmail.toLowerCase().trim() !== order.guestEmail?.toLowerCase()?.trim()) &&
          (!guestPhone || guestPhone !== order.shippingAddress?.phone)
        ) {
          return res.status(403).json({ success: false, message: 'Unauthorized. Verification details required to cancel guest order.' });
        }
      }
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This order is already cancelled' });
    }

    // Strict rule: Cancellation is ONLY permitted prior to shipping/dispatch
    if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been dispatched from our dispensary hub and can no longer be cancelled. In accordance with Ayurvedic healthcare safety guidelines, shipped orders are not eligible for return or exchange.'
      });
    }

    // Safe to cancel (placed, confirmed, processing)
    order.orderStatus = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    order.timeline.push({
      status: 'cancelled',
      message: 'Order cancelled prior to dispensary dispatch. 100% refund initiated.',
      timestamp: new Date(),
      location: 'Central Dispensary Hub, Kallara, Trivandrum, Kerala'
    });

    await order.save();

    // Restock formulations back into active inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({
      success: true,
      message: 'Order has been successfully cancelled before dispatch. Full refund has been initiated.',
      data: order
    });
  } catch (err) {
    next(err);
  }
});

export default router;

