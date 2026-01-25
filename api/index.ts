import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes
import adminAuthRoutes from '../src/routes/adminAuthRoutes';
import bookingRoutes from '../src/routes/bookingRoutes';
import roomRoutes from '../src/routes/roomRoutes';
import menuRoutes from '../src/routes/menuRoutes';

// Import email service verification
import { verifyEmailConfig } from '../src/utils/emailService';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Welcome route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Aamantran Homestay Booking API',
    version: '1.0.0',
    environment: 'Vercel Serverless',
    endpoints: {
      adminAuth: '/api/admin/auth',
      rooms: '/api/rooms',
      bookings: '/api/bookings',
      menu: '/api/menu',
      health: '/api/health'
    }
  });
});

// Health check route
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Log connection details for debugging
  console.log('MongoDB Connection State:', mongoose.connection.readyState);
  console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
  
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'Server is running on Vercel',
    database: dbStatus,
    connectionState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', menuRoutes);

// Database connection with better error handling
let isConnecting = false;

const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Already connected to MongoDB');
    return;
  }

  // If connection is in progress, wait
  if (isConnecting) {
    console.log('⏳ Connection already in progress...');
    return;
  }

  try {
    isConnecting = true;
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined');
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Attempting MongoDB connection...');
    console.log('📍 URI format check:', mongoURI.substring(0, 20) + '...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Verify email service (non-blocking)
    verifyEmailService().catch(err => 
      console.warn('⚠️ Email service verification failed:', err.message)
    );
    
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Full error:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
};

// Email service verification
const verifyEmailService = async () => {
  try {
    console.log('📧 Verifying email service...');
    const isValid = await verifyEmailConfig();
    
    if (isValid) {
      console.log('✅ Email service configured correctly');
    } else {
      console.warn('⚠️ Email service configuration issues');
    }
  } catch (error) {
    console.warn('⚠️ Email service verification error:', error);
  }
};

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map((e: any) => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this data already exists'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Authentication token is invalid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Authentication token has expired'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested route does not exist'
  });
});

// Handler for Vercel
const handler = async (req: any, res: any) => {
  try {
    // Connect to DB on each request (with built-in caching via mongoose)
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message || 'Unable to connect to database'
    });
  }
};

export default handler;