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

// Always allow production frontend URL
if (isProduction) {
  allowedOrigins.push('https://readivine.vercel.app');
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
    const timestamp = new Date().toISOString();
    
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) {
      console.log(`[${timestamp}] CORS: Allowing request with no origin (same-origin or mobile app)`);
      return callback(null, true);
    }

    // Check if the origin is in our static list
    if (allowedOrigins.includes(origin)) {
      console.log(`[${timestamp}] CORS: Allowing origin from static list: ${origin}`);
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
        console.log(`[${timestamp}] CORS: Allowing origin from pattern match: ${origin}`);
        return callback(null, true);
      }
    }
    
    // If origin is not allowed, reject the request with detailed logging
    const errorMessage = `CORS policy violation: Origin '${origin}' is not allowed`;
    const logDetails = {
      timestamp,
      rejectedOrigin: origin,
      allowedOrigins,
      allowedPatterns: allowedPatterns.map(p => p.toString()),
      environment: process.env.NODE_ENV,
      userAgent: 'N/A', // Will be enhanced in middleware
    };
    
    if (!isProduction) {
      console.warn(`[${timestamp}] CORS REJECTION (Development):`, logDetails);
    } else {
      console.error(`[${timestamp}] CORS REJECTION (Production):`, logDetails);
    }
    
    const corsError = new Error(errorMessage);
    corsError.statusCode = 403;
    corsError.corsDetails = logDetails;
    callback(corsError);
  },
  credentials: true, // Explicitly enable credentials for cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token',
    'Cookie' // Explicitly allow Cookie header
  ],
  exposedHeaders: ['Set-Cookie', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  optionsSuccessStatus: 200, // For legacy browser support (IE11, various SmartTVs)
  preflightContinue: false, // Pass control to the next handler after successful preflight
  maxAge: 86400, // 24 hours - cache preflight response
};

// Enhanced CORS middleware with detailed logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('Origin');
  
  // Log all cross-origin requests for debugging
  if (origin && origin !== req.get('Host')) {
    console.log(`[${timestamp}] Cross-origin request:`, {
      method: req.method,
      origin,
      path: req.path,
      userAgent: req.get('User-Agent'),
      cookies: req.get('Cookie') ? 'Present' : 'None',
      contentType: req.get('Content-Type'),
      isPreflight: req.method === 'OPTIONS'
    });
  }
  
  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}] Handling preflight request from origin: ${origin}`);
    
    // Set additional headers for preflight response
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    // Log preflight completion
    res.on('finish', () => {
      console.log(`[${timestamp}] Preflight response sent:`, {
        statusCode: res.statusCode,
        origin,
        allowCredentials: res.get('Access-Control-Allow-Credentials'),
        allowOrigin: res.get('Access-Control-Allow-Origin')
      });
    });
  }
  
  next();
});

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

// --- CORS Debug Route ---
app.get('/cors-debug', (req, res) => {
  const origin = req.get('Origin');
  const timestamp = new Date().toISOString();
  
  const debugInfo = {
    timestamp,
    requestOrigin: origin || 'No origin header',
    allowedOrigins,
    environment: process.env.NODE_ENV,
    corsConfiguration: {
      credentials: corsOptions.credentials,
      methods: corsOptions.methods,
      allowedHeaders: corsOptions.allowedHeaders,
      exposedHeaders: corsOptions.exposedHeaders,
      maxAge: corsOptions.maxAge
    },
    requestHeaders: {
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      cookie: req.get('Cookie') ? 'Present' : 'None',
      authorization: req.get('Authorization') ? 'Present' : 'None'
    },
    originValidation: {
      inStaticList: allowedOrigins.includes(origin),
      matchesPattern: origin ? [
        /^https:\/\/readivine-.*\.vercel\.app$/.test(origin),
        /^https:\/\/.*--readivine.*\.netlify\.app$/.test(origin)
      ] : [false, false]
    }
  };
  
  console.log(`[${timestamp}] CORS Debug Request:`, debugInfo);
  
  res.status(200).json({
    statusCode: 200,
    message: 'CORS debug information',
    success: true,
    data: debugInfo
  });
});


// --- Centralized Error Handling ---
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    
    // Handle CORS-specific errors with detailed logging
    if (err.message && err.message.includes('Not allowed by CORS')) {
        console.error(`[${timestamp}] CORS Error Details:`, {
            error: err.message,
            origin: req.get('Origin'),
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer'),
            corsDetails: err.corsDetails || 'No additional details'
        });
        
        return res.status(403).json({
            statusCode: 403,
            message: 'Cross-Origin Request Blocked',
            success: false,
            error: isProduction ? 'CORS policy violation' : err.message,
            ...(isProduction ? {} : { corsDetails: err.corsDetails })
        });
    }
    
    // If the error is a known API error, handle it gracefully
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: err.success,
            errors: err.errors,
        });
    }

    // For all other unexpected errors, log them and send a generic 500 response
    console.error(`[${timestamp}] Unhandled Error:`, {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        origin: req.get('Origin')
    });
    
    // Ensure a valid status code is always sent. Default to 500.
    const statusCode = (err.statusCode && Number.isInteger(err.statusCode)) ? err.statusCode : 500;
    
    return res.status(statusCode).json({
        statusCode: statusCode,
        message: 'An unexpected internal server error occurred.',
        success: false,
    });
});

export default app;
