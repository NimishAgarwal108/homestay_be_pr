import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import routes
import adminAuthRoutes from '../src/routes/adminAuthRoutes';
import bookingRoutes from '../src/routes/bookingRoutes';
import roomRoutes from '../src/routes/roomRoutes';
import menuRoutes from '../src/routes/menuRoutes';

// Import email service verification
import { verifyEmailConfig } from '../src/utils/emailService';

// Initialize Express app
const app = express();

// Middleware - Allow all origins for now (fix CORS issues)
app.use(cors({
  origin: '*', // Allow all origins temporarily
  credentials: false, // Must be false when origin is '*'
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
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
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'Server is running on Vercel',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', menuRoutes);

// Database connection with connection pooling for serverless
let cachedConnection: typeof mongoose | null = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    
    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Increased timeout for Vercel
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Connection pooling
      minPoolSize: 2,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    cachedConnection = connection;
    
    // Verify email service (non-blocking)
    verifyEmailService().catch(err => 
      console.warn('⚠️ Email service verification failed:', err.message)
    );
    
    return connection;
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error.message);
    cachedConnection = null;
    throw error;
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
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map((e: any) => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this data already exists'
    });
  }
  
  // JWT errors
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
  
  // Default error response
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

// Removed - connection now handled in the handler wrapper

// Wrap app with database connection middleware
const handler = async (req: any, res: any) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: 'Unable to connect to database'
    });
  }
};

// Export for Vercel serverless
export default handler;