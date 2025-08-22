import { Router } from 'express';
import { getUserRepos } from '../controllers/gitHub.Controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { analyzeRepository } from '../controllers/analysis.Controller.js';
import { saveReadmeToRepo,saveReadmeToNewBranch } from '../controllers/repo.Controller.js'; // 1. Import the new controller
const router = Router();

// --- Protected Route ---
// This route is protected by the verifyJWT middleware.
// A request must have a valid JWT in the Authorization header to access this.
router.route('/repos').get(verifyJWT, getUserRepos);

// 2. Add the new route for repository analysis
// It's a POST request because the frontend will send the repo name in the body.
router.route('/analyze').post(verifyJWT, analyzeRepository);

// 2. Add the new route for saving the README
router.route('/save-readme').post(verifyJWT, saveReadmeToRepo);

// 3. Add the new route for saving the README to a new branch
router.route('/save-readme-branch').post(verifyJWT, saveReadmeToNewBranch);




export default router;
