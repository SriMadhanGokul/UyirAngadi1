import express from 'express';
import { createEnquiry, getMyEnquiries } from '../controllers/enquiryController.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { enquirySchema } from '../utils/validators.js';

const router = express.Router();

router.post('/', optionalAuth, validateBody(enquirySchema), createEnquiry);
router.get('/my', protect, getMyEnquiries);

export default router;
