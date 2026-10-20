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

// PATCH /api/admin/products/:id/stock
router.patch('/products/:id/stock', async (req, res, next) => {
  try {
    const { stock } = req.body;
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: Math.max(0, Math.floor(stock)) },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: `Stock updated to ${product.stock} units`, data: product });
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

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/coupons/:id/toggle
router.patch('/coupons/:id/toggle', async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, data: coupon });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users (Search and list users)
router.get('/users', async (req, res, next) => {
  try {
    const { q, search, role, page = 1, limit = 50 } = req.query;
    const searchTerm = (q || search || '').toString().trim();
    const query: any = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (role && (role === 'customer' || role === 'admin')) {
      query.role = role;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -otp -otpExpires')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role (Promote to Admin or Demote to Customer)
router.patch('/users/:id/role', async (req: any, res, next) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'customer') {
      return res.status(400).json({ success: false, message: 'Role must be either admin or customer' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent current admin from demoting themselves to avoid accidental lockout
    if (req.user && req.user._id?.toString() === targetUser._id?.toString() && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own admin permissions' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User ${targetUser.name || targetUser.email} has been ${role === 'admin' ? 'promoted to Administrator' : 'set to Customer'} successfully`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id - Delete User Account
router.delete('/users/:id', async (req: any, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard: Prevent current admin from deleting their own active account
    if (req.user && req.user._id?.toString() === targetUser._id?.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own active administrator account' });
    }

    // Guard: Prevent deletion of primary system administrator
    const primaryAdmin = (process.env.ADMIN_EMAIL || 'axminprana@gmail.com').toLowerCase();
    if (targetUser.email.toLowerCase() === primaryAdmin) {
      return res.status(400).json({ success: false, message: 'The primary system administrator account cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Customer user "${targetUser.name || targetUser.email}" was deleted successfully`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
