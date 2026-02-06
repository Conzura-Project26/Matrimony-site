import express from 'express';
import planController from '../controllers/planController.js';

const router = express.Router();

/**
 * Public subscription plan routes
 * No authentication required - anyone can view available plans
 */

// GET /api/plans - Get all active subscription plans
router.get('/', planController.getAllPlans);

// GET /api/plans/:planId - Get specific plan by ID
router.get('/:planId', planController.getPlanById);

// GET /api/plans/code/:code - Get plan by code (e.g., FREE, BASIC, PREMIUM, GOLD)
router.get('/code/:code', planController.getPlanByCode);

export default router;
