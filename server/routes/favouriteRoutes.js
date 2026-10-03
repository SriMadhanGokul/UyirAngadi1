import express from 'express';
import {
  getMyFavourites,
  addFavourite,
  removeFavourite,
} from '../controllers/favouriteController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { favouriteSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.get('/', getMyFavourites);
router.post('/', validateBody(favouriteSchema), addFavourite);
router.delete('/:listingId', removeFavourite);

export default router;
