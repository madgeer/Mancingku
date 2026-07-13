import express from 'express';
import historyController from '../controllers/historyController.js';
import verifyToken from '../middleware/authUser.js';

const router = express.Router();

// Endpoint: GET /history/:userId
router.get('/history/:userId', verifyToken, historyController.getHistory);

export default router;