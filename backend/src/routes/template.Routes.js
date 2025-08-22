import { Router } from 'express';
import { getAllTemplates } from '../controllers/template.Controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// This route is protected, ensuring only logged-in users can see the templates.
router.route('/').get(verifyJWT, getAllTemplates);

export default router;
