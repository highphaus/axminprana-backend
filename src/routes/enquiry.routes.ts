import { Router } from 'express';
import { z } from 'zod';
import { Enquiry } from '../models/Enquiry.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendEnquiryNotificationEmail } from '../services/email.service.js';

const router = Router();

const EnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  businessType: z.string().default('Retailer / Brand'),
  productInterest: z.string().min(2, 'Product or ingredient of interest is required'),
  quantity: z.string().min(1, 'Required quantity is required'),
  message: z.string().optional()
});

// POST /api/enquiries (Public submission)
router.post('/', async (req, res, next) => {
  try {
    const validated = EnquirySchema.parse(req.body);

    const enquiry = await Enquiry.create(validated);

    // Send email notification to axminprana@gmail.com and acknowledgment to customer
    sendEnquiryNotificationEmail(enquiry).catch(e =>
      console.error('[Email Warning] Failed to dispatch enquiry email:', e)
    );

    res.status(201).json({
      success: true,
      message: 'Your bulk order enquiry has been submitted. Our commercial wholesale team will review your formulation request and reach out within 24 business hours.',
      data: enquiry
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/enquiries (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: enquiries
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/enquiries/:id/status (Admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'in_progress', 'contacted', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: enquiry
    });
  } catch (err) {
    next(err);
  }
});

export default router;
