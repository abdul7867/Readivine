import { Router } from 'express';
import { 
    logoutUser,
    redirectToGitHub, 
    handleGitHubCallback, 
    getAuthStatus
} from '../controllers/auth.Controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// --- Public Routes ---
// router.route('/register').post(registerUser);
// router.route('/login').post(loginUser);

// --- GitHub OAuth Routes ---
router.route('/github').get(redirectToGitHub);
router.route('/github/callback').get(handleGitHubCallback);

// --- Public auth status check (optional auth) ---
router.route('/check').get((req, res, next) => {
    // Try to verify JWT, but don't fail if it's not there
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(200).json({
            statusCode: 200,
            data: { authenticated: false, user: null },
            message: "Not authenticated",
            success: true
        });
    }
    
    // If token exists, proceed with verification
    verifyJWT(req, res, next);
}, getAuthStatus);

// --- Protected Routes ---
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/status').get(verifyJWT, getAuthStatus);

// Debug routes removed for production - use separate debug controller if needed

export default router;
