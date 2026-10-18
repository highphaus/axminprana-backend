import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Coupon } from '../models/Coupon.js';
import { Review } from '../models/Review.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalUsers, orders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.find({ paymentStatus: 'paid' }).select('totalAmount')
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount paymentStatus orderStatus createdAt shippingAddress');

    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select('name sku stock price thumbnail')
      .limit(5);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
        recentOrders,
        lowStockProducts
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products
router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));

    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Product.countDocuments()
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products
router.post('/products', async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await Product.create({ ...req.body, slug });
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (status) query.orderStatus = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber, carrier, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    order.timeline.push({
      status: orderStatus || order.orderStatus,
      message: message || `Order status updated to ${orderStatus || order.orderStatus}`,
      timestamp: new Date()
    });

    await order.save();
    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/coupons
router.get('/coupons', async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (err) {
    next(err);
  }
});

export default router;
