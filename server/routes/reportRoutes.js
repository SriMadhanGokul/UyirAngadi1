import express from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { reportSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.post('/', validateBody(reportSchema), createReport);
router.get('/my', getMyReports);

export default router;
