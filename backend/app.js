import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './src/routes/auth.Routes.js';
import githubRouter from './src/routes/github.Routes.js'
import templateRouter from './src/routes/template.Routes.js';

// Load environment variables
dotenv.config({ path: './.env' });

// Create an Express application instance
const app = express();

// Get frontend URL from environment
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || 'https://your-app-name.vercel.app';
  }
  return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
};

// Enhanced CORS configuration with dynamic origin handling
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Build allowed origins list based on environment
    const allowedOrigins = [];
    
    // Add production URLs if they exist
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Add development URLs
    if (process.env.FRONTEND_URL_DEV) {
      allowedOrigins.push(process.env.FRONTEND_URL_DEV);
    }
    
    // Always allow common development ports
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    
    // Remove duplicates and undefined values
    const uniqueOrigins = [...new Set(allowedOrigins.filter(Boolean))];
    
    if (uniqueOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      console.log('Allowed origins:', uniqueOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api/auth', authRouter);
app.use('/api/github', githubRouter);
app.use('/api/templates', templateRouter);

// A simple health check route to confirm the API is running
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Readivine API is running! 🚀',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Export the configured app instance
export default app;
