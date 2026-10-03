import express from 'express';
import {
  getSellerStats,
  getSellerListings,
  markSellerListingSold,
  getSellerEnquiries,
} from '../controllers/sellerController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { markSoldSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.get('/stats', getSellerStats);
router.get('/listings', getSellerListings);
router.patch('/listings/:id/sold', validateBody(markSoldSchema), markSellerListingSold);
router.get('/enquiries', getSellerEnquiries);

export default router;
