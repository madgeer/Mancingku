import express from "express";
import {
    getAllFishingGear,
    createFishingGear,
    updateFishingGear,
    deleteFishingGear
} from "../controllers/fishingGearsController.js"; 
import verifyToken from "../middleware/authUser.js";
import verifyAdmin from "../middleware/authAdmin.js";

const router = express.Router();

// GET: Ambil semua data fishing gear
router.get('/fishingGear', getAllFishingGear);

// POST: Tambah fishing gear baru (memerlukan hak admin)
router.post('/fishingGear', verifyToken, verifyAdmin, createFishingGear);

// patch: Update fishing gear berdasarkan ID (memerlukan hak admin)
router.patch('/fishingGear/:id', verifyToken, verifyAdmin, updateFishingGear);

// DELETE: Hapus fishing gear berdasarkan ID (memerlukan hak admin)
router.delete('/fishingGear/:id', verifyToken, verifyAdmin, deleteFishingGear);

export default router;