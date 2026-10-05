import express from 'express';
import {
  getAdminStats,
  getAdminListings,
  approveListing,
  rejectListing,
  featureListing,
  updateAdminListing,
  updateAdminListingStatus,
  deleteListingAsAdmin,
  getAdminReports,
  updateReportStatus,
  getAdminUsers,
  suspendUser,
  deleteUserAsAdmin,
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  adminListingQuerySchema,
  adminListingStatusSchema,
  adminReportQuerySchema,
  adminUserQuerySchema,
  adminListingUpdateSchema,
  featureListingSchema,
  rejectListingSchema,
  suspendUserSchema,
  updateReportStatusSchema,
} from '../utils/validators.js';

const router = express.Router();

router.use(protect, restrictTo('ADMIN'));

router.get('/stats', getAdminStats);

router.get('/listings', validateQuery(adminListingQuerySchema), getAdminListings);
router.put('/listings/:id', validateBody(adminListingUpdateSchema), updateAdminListing);
router.patch('/listings/:id/status', validateBody(adminListingStatusSchema), updateAdminListingStatus);
router.patch('/listings/:id/approve', approveListing);
router.patch('/listings/:id/reject', validateBody(rejectListingSchema), rejectListing);
router.patch('/listings/:id/feature', validateBody(featureListingSchema), featureListing);
router.delete('/listings/:id', deleteListingAsAdmin);

router.get('/reports', validateQuery(adminReportQuerySchema), getAdminReports);
router.patch('/reports/:id', validateBody(updateReportStatusSchema), updateReportStatus);

router.get('/users', validateQuery(adminUserQuerySchema), getAdminUsers);
router.patch('/users/:id/suspend', validateBody(suspendUserSchema), suspendUser);
router.delete('/users/:id', deleteUserAsAdmin);

router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
