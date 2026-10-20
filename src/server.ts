import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, or server-to-server requests
      if (!origin) return callback(null, true);
      const frontend = process.env.FRONTEND_URL;
      if (
        origin === 'http://localhost:3000' ||
        origin === 'http://127.0.0.1:3000' ||
        (frontend && origin === frontend) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.render.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  res.json({
    status: isDbReady ? 'healthy' : 'initializing',
    database: isDbReady ? 'connected' : 'connecting',
    service: 'Axmin Prana Ayurveda Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);

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
