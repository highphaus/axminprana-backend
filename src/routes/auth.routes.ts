import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit Indian PIN code'),
  isDefault: z.boolean().optional()
});

const generateToken = (id: string, role: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'customer'
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select('+password');

    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Current user profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
      wishlist: user.wishlist
    }
  });
});

// Update profile
router.put('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// Add / Update Address
router.post('/addresses', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = AddressSchema.parse(req.body);
    const user = req.user!;

    if (data.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    } else if (user.addresses.length === 0) {
      data.isDefault = true;
    }

    user.addresses.push(data as any);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    user.addresses = user.addresses.filter(a => a._id?.toString() !== req.params.addressId) as any;
    await user.save();

    res.json({
      success: true,
      message: 'Address removed successfully',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
});

// Wishlist toggle
router.post('/wishlist/:productId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const productId = req.params.productId as any;
    const index = user.wishlist.findIndex(id => id.toString() === productId);

    let inWishlist = false;
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
      inWishlist = true;
    }
    await user.save();

    res.json({
      success: true,
      inWishlist,
      wishlist: user.wishlist
    });
  } catch (err) {
    next(err);
  }
});

export default router;
