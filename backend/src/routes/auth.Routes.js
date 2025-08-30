import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

// We will create these controller functions in the very next step.
import { 
    redirectToGitHub, 
    handleGitHubCallback,
    logoutUser,
    getAuthStatus
} from '../controllers/auth.Controller.js';

const router = Router();

// --- Route Definitions ---

// Route to initiate the GitHub OAuth flow.
// This is wrapped in asyncHandler to catch any potential async errors.
router.route('/github').get(asyncHandler(redirectToGitHub));

// The callback URL that GitHub will redirect to after user authorization.
// This route will handle the logic of exchanging the code for an access token.
router.route('/github/callback').get(asyncHandler(handleGitHubCallback));

// --- Protected Routes ---
// Route to check authentication status
router.route('/status').get(verifyJWT, asyncHandler(getAuthStatus));

// 2. Add the new logout route. It's a POST request for best practice.
// We protect it with verifyJWT to ensure only a logged-in user can log out.
router.route('/logout').post(verifyJWT, asyncHandler(logoutUser));


export default router;
