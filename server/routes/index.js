import express from 'express';
import { getCategories } from '../controllers/adminController.js';
import listingRoutes from './listingRoutes.js';
import favouriteRoutes from './favouriteRoutes.js';
import reportRoutes from './reportRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import sellerRoutes from './sellerRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Public reference data
router.get('/categories', getCategories);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/favourites', favouriteRoutes);
router.use('/reports', reportRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);

export default router;
