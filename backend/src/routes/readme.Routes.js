import { Router } from 'express';
import {
  getReadme,
  saveReadme,
  deleteReadme,
   checkDraftsStatus 
} from '../controllers/readme.Controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Apply the verifyJWT middleware to all routes in this file.
// This ensures that every endpoint requires an authenticated user.
router.use(verifyJWT);

// Route to get a saved README for a repo
// GET /api/readme?repoFullName=username/repo-name
router.route('/').get(getReadme);

// Route to save or update a README
// POST /api/readme
router.route('/').post(saveReadme);

// Route to delete a saved README
// DELETE /api/readme
router.route('/').delete(deleteReadme);

export default router;
