import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRouter from './src/routes/auth.Routes.js'; // 1. Import the router
import githubRouter from './src/routes/github.Routes.js'
import templateRouter from './src/routes/template.Routes.js'; // 2. Import the new router
// import readmeRouter from './src/routes/readme.Routes.js'; // 1. Import the new router

// Create an Express application instance
const app = express();

// --- Middleware Setup ---
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser()); // 3. Use the cookie-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
// Mount the authentication routes under the /api/auth prefix
app.use('/api/auth', authRouter); // 2. Use the router

// Mount the GitHub routes under the /api/github prefix
app.use('/api/github', githubRouter); // 2. Use the new router

app.use('/api/templates', templateRouter); // 2. Use the new router

// app.use('/api/readme', readmeRouter); // 2. Use the new router

// A simple health check route to confirm the API is running
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Readivine API is running! 🚀' });
});


// Export the configured app instance
export default app;
