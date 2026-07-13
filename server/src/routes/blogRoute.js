import express from "express";
import { 
    getAllPosts, 
    getPostBySlug, 
    createPost, 
    updatePost, 
    deletePost 
} from "../controllers/blogsController.js";
import verifyToken from "../middleware/authUser.js";
import verifyAdmin from "../middleware/authAdmin.js";

const router = express.Router();

router.get('/blog', getAllPosts);
router.get('/blog/:slug', getPostBySlug); // Mengambil detail pakai slug (SEO friendly)
router.post('/blog', verifyToken, verifyAdmin, createPost);
router.patch('/blog/:id', verifyToken, verifyAdmin, updatePost);
router.delete('/blog/:id', verifyToken, verifyAdmin, deletePost);

export default router;