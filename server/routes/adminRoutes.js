import express from 'express';
import {
  getAdminStats,
  getAdminListings,
  approveListing,
  rejectListing,
  featureListing,
  deleteListingAsAdmin,
  getAdminReports,
  updateReportStatus,
  getAdminUsers,
  suspendUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { rejectListingSchema, suspendUserSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect, restrictTo('ADMIN'));

router.get('/stats', getAdminStats);

router.get('/listings', getAdminListings);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', validateBody(rejectListingSchema), rejectListing);
router.patch('/listings/:id/feature', featureListing);
router.delete('/listings/:id', deleteListingAsAdmin);

router.get('/reports', getAdminReports);
router.patch('/reports/:id', updateReportStatus);

router.get('/users', getAdminUsers);
router.patch('/users/:id/suspend', validateBody(suspendUserSchema), suspendUser);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
