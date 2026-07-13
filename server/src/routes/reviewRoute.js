import express from "express";
import { createReview, getReviewsBySpot } from "../controllers/reviewController.js";
import verifyToken from "../middleware/authUser.js";

const router = express.Router();

// POST: Buat review baru (memerlukan login)
router.post('/review', verifyToken, createReview);

// GET: Ambil review berdasarkan ID Spot
router.get('/review/spot/:spotId', getReviewsBySpot);

export default router;