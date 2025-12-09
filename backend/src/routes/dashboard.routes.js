import express from 'express';
import { getDashboardSummary, getDashboardTrends, getDashboardOverview, getDashboardAnalytics, getDashboardAlerts } from '../controllers/dashboard.controller.js';

const router = express.Router();

// GET /api/v1/dashboard/summary
router.get('/summary', getDashboardSummary);

// GET /api/v1/dashboard/trends?days=7
router.get('/trends', getDashboardTrends);

// GET /api/v1/dashboard/overview
router.get('/overview', getDashboardOverview);

// GET /api/v1/dashboard/analytics
router.get('/analytics', getDashboardAnalytics);

// GET /api/v1/dashboard/alerts
router.get('/alerts', getDashboardAlerts);

export default router;
