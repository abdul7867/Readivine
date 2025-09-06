import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ApiError } from './src/utils/ApiError.js';

// Route Imports
import authRouter from './src/routes/auth.Routes.js';
import githubRouter from './src/routes/github.Routes.js';
import templateRouter from './src/routes/template.Routes.js';
import readmeRouter from './src/routes/readme.Routes.js';

// Create an Express application instance
const app = express();

// --- Security Middlewares ---

// Set security-related HTTP headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';

// Define allowed origins based on environment
const allowedOrigins = [];

// Production origins
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

// Always allow development origins in non-production
if (!isProduction) {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173'
  );
}

// Add additional production origins from environment
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) return callback(null, true);

    // Check if the origin is in our static list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Regex patterns for dynamic origins
    const allowedPatterns = [
      // Vercel deployment URLs for this project
      /^https:\/\/readivine-.*\.vercel\.app$/,
      // Netlify deployment URLs (if needed)
      /^https:\/\/.*--readivine.*\.netlify\.app$/,
      // Custom domain patterns (if needed)
      // /^https:\/\/.*\.yourdomain\.com$/,
    ];

    // Check against patterns
    for (const pattern of allowedPatterns) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Log rejected origins in development for debugging
    if (!isProduction) {
      console.warn(`CORS rejected origin: ${origin}`);
      return callback(null, true); // Allow all in development
    }
    
    // Reject in production
    console.error(`CORS rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);


// --- Core Middlewares ---

// Parse JSON bodies
app.use(express.json({ limit: '16kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Parse cookies
app.use(cookieParser());


// --- API Routes ---
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/github', githubRouter);
app.use('/api/v1/templates', templateRouter);
app.use('/api/v1/readme', readmeRouter);


// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


// --- Centralized Error Handling ---
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: err.success,
            errors: err.errors,
        });
    }

    // For unhandled errors
    console.error('Unhandled Error:', err);
    
    // Ensure we have a valid status code
    const statusCode = err.statusCode && typeof err.statusCode === 'number' ? err.statusCode : 500;
    
    return res.status(statusCode).json({
        statusCode: statusCode,
        message: err.message || 'Internal Server Error',
        success: false,
    });
});

export default app;
