import express from "express"
import { getUser, updateUser } from "../controllers/usersController.js"
import verifyToken from "../middleware/authUser.js"

const router = express.Router();

router.get('/users/:id', verifyToken, getUser);
router.patch('/users/:id', verifyToken, updateUser);

export default router;