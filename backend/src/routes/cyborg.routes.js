import express from 'express';
import cyborgCtrl from '../controllers/cyborgDB.controller.js';

const router = express.Router();

router.post('/upsert-encounter', cyborgCtrl.upsertEncounter);
router.post('/search', cyborgCtrl.search);
router.post('/search-advanced', cyborgCtrl.searchAdvanced);
router.get('/health', cyborgCtrl.health);

export default router;
