import express from 'express';
import { updateMe, uploadProfileImage } from '../controllers/userController.js';
import { getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingleImage } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/avatar', uploadSingleImage, uploadProfileImage);

export default router;
