import express from "express";
import {
    getAllBaits,
    createBait,
    updateBait,
    deleteBait
} from "../controllers/baitsController.js";
import verifyToken from "../middleware/authUser.js";
import verifyAdmin from "../middleware/authAdmin.js";

const router = express.Router();

router.get('/bait', getAllBaits);
router.post('/bait', verifyToken, verifyAdmin, createBait);
router.patch('/bait/:id', verifyToken, verifyAdmin, updateBait);
router.delete('/bait/:id', verifyToken, verifyAdmin, deleteBait);

export default router;