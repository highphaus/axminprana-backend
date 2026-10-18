import mongoose from 'mongoose';

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  
  if (!uri && process.env.NODE_ENV === 'production') {
    console.error(
      '[Database] WARNING: MONGODB_URI is not configured in Render Environment Variables! ' +
      'Please add MONGODB_URI in your Render Dashboard (e.g. mongodb+srv://... from MongoDB Atlas).'
    );
  }

  const connectionUri = uri || 'mongodb://127.0.0.1:27017/axminprana_ayurveda';
  
  try {
    const conn = await mongoose.connect(connectionUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true,
    });
    
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Database] Retrying connection in 10 seconds...');
      setTimeout(() => connectDB(), 10000);
      return null;
    }
    // Local dev: non-fatal retry
    setTimeout(() => connectDB(), 5000);
    return null;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected successfully.');
});
