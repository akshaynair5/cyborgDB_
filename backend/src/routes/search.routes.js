import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { localSearch } from '../controllers/search.controller.js';

const router = Router();

// GET /api/v1/search?query=...
router.get('/', verifyJWT, localSearch);

export default router;
