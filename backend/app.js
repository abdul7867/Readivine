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

// --- Middleware Setup ---
app.use(cors({
  origin: [
    getFrontendUrl(),
    'http://localhost:5173', // Always allow localhost for development
    'http://localhost:3000'  // Alternative dev port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
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
