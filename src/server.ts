import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import orderRoutes from './routes/order.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import reviewRoutes from './routes/review.routes.js';
import articleRoutes from './routes/article.routes.js';
import adminRoutes from './routes/admin.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// Security & Middleware
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));

import { authLimiter, enquiryLimiter } from './middleware/rateLimiter.js';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile apps, server-to-server, health checks)
      if (!origin) return callback(null, true);
      const frontend = process.env.FRONTEND_URL;
      const allowed = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://axminprana.com',
        'https://www.axminprana.com'
      ];
      if (frontend) {
        frontend.split(',').forEach(u => allowed.push(u.trim()));
      }
      if (
        allowed.includes(origin) ||
        origin.endsWith('.axminprana.com') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.render.com')
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Access denied for this origin.'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'Axmin Prana Ayurveda API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const scriptUrl =
    process.env.MAIL_SCRIPT_URL ||
    process.env.GOOGLE_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycbydZgK7_nor6Z785sMxNG-7cESFgPEfeCFUc8YjLtogm02oiy1vsb4DRqdvbRuEVG8J/exec';

  res.json({
    status: isDbReady ? 'healthy' : 'initializing',
    database: isDbReady ? 'connected' : 'connecting',
    service: 'Axmin Prana Ayurveda Backend',
    version: '1.1.0-otp-script',
    mailerReady: !!scriptUrl,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes with specialized security rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryLimiter, enquiryRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start Server - Listen on port immediately so cloud health checks pass
async function startServer() {
  const PORT_NUM = Number(port);
  app.listen(PORT_NUM, '0.0.0.0', () => {
    console.log(`[Server] Axmin Prana Ayurveda Backend running on port ${PORT_NUM} (http://0.0.0.0:${PORT_NUM})`);
  });

  // Connect to Database asynchronously
  connectDB().catch(err => {
    console.error('[Database] MongoDB initialization error:', err);
  });
}

startServer();

export default app;

